import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads (receipts/justificatifs)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET default and user-specific categories
router.get('/categories', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: null },
          { userId }
        ]
      }
    });
    return res.json(categories);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement des catégories: ' + error.message });
  }
});

// GET all transactions with filters
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { search, categoryId, accountId, type, startDate, endDate } = req.query;

    const whereClause: any = { userId };

    if (categoryId) {
      whereClause.categoryId = categoryId as string;
    }
    if (accountId) {
      whereClause.accountId = accountId as string;
    }
    if (type) {
      whereClause.type = type as string;
    }
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate as string);
      }
    }
    if (search) {
      whereClause.OR = [
        { description: { contains: search as string } },
        { person: { firstName: { contains: search as string } } },
        { person: { lastName: { contains: search as string } } }
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        account: true,
        targetAccount: true,
        category: true,
        person: true,
        debt: true,
        receivable: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    return res.json(transactions);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement des transactions: ' + error.message });
  }
});

// GET single transaction
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        account: true,
        targetAccount: true,
        category: true,
        person: true,
        debt: true,
        receivable: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction non trouvée.' });
    }

    return res.json(transaction);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement de la transaction: ' + error.message });
  }
});

// Helper: Check budgets and create notifications if thresholds exceeded
async function checkBudgetThresholds(userId: string, categoryId: string, amountAdded: number) {
  const budget = await prisma.budget.findFirst({
    where: { userId, categoryId },
    include: { category: true }
  });

  if (!budget) return;

  const currentSpent = budget.spentAmount;
  const newSpent = currentSpent + amountAdded;
  const limit = budget.amount;

  // Update budget spent amount
  await prisma.budget.update({
    where: { id: budget.id },
    data: { spentAmount: newSpent }
  });

  const oldRatio = currentSpent / limit;
  const newRatio = newSpent / limit;

  // Check 80% threshold
  if (newRatio >= 0.8 && oldRatio < 0.8) {
    await prisma.notification.create({
      data: {
        userId,
        message: `Ton budget ${budget.category.name} a atteint 80% (${newSpent.toLocaleString()} / ${limit.toLocaleString()} FCFA).`,
        type: 'WARNING'
      }
    });
  }
  // Check 90% threshold
  if (newRatio >= 0.9 && oldRatio < 0.9) {
    await prisma.notification.create({
      data: {
        userId,
        message: `Ton budget ${budget.category.name} a atteint 90% (${newSpent.toLocaleString()} / ${limit.toLocaleString()} FCFA).`,
        type: 'WARNING'
      }
    });
  }
  // Check 100% threshold
  if (newRatio >= 1.0 && oldRatio < 1.0) {
    await prisma.notification.create({
      data: {
        userId,
        message: `Attention! Ton budget ${budget.category.name} est dépassé à 100% (${newSpent.toLocaleString()} / ${limit.toLocaleString()} FCFA).`,
        type: 'DANGER'
      }
    });
  }
}

// Helper: Subtract amount from budget when transaction is deleted/modified
async function updateBudgetOnRemoval(userId: string, categoryId: string, amountRemoved: number) {
  const budget = await prisma.budget.findFirst({
    where: { userId, categoryId }
  });

  if (!budget) return;

  const newSpent = Math.max(0, budget.spentAmount - amountRemoved);
  await prisma.budget.update({
    where: { id: budget.id },
    data: { spentAmount: newSpent }
  });
}

// POST create transaction
router.post('/', authenticateToken, upload.single('attachment'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      accountId,
      targetAccountId,
      type,
      categoryId,
      personId,
      debtId,
      receivableId,
      amount,
      date,
      description
    } = req.body;

    if (!accountId || !type || !amount || !date) {
      return res.status(400).json({ error: 'Champs obligatoires manquants: compte, type, montant, date.' });
    }

    const parsedAmount = parseFloat(amount);
    const parsedDate = new Date(date);

    // If transfer, verify target account
    if (type === 'TRANSFER' && !targetAccountId) {
      return res.status(400).json({ error: 'Un compte de destination est requis pour un transfert.' });
    }

    let fileUrl: string | null = null;
    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    // Start Transaction logic
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        accountId,
        targetAccountId: type === 'TRANSFER' ? targetAccountId : null,
        type,
        categoryId: categoryId || null,
        personId: personId || null,
        debtId: debtId || null,
        receivableId: receivableId || null,
        amount: parsedAmount,
        date: parsedDate,
        description,
        attachmentUrl: fileUrl
      }
    });

    // 1. If linked to Budget (and is EXPENSE)
    if (type === 'EXPENSE' && categoryId) {
      await checkBudgetThresholds(userId, categoryId, parsedAmount);
    }

    // 2. If linked to Debt (repaying a debt: EXPENSE)
    if (debtId && type === 'EXPENSE') {
      const debt = await prisma.debt.findUnique({ where: { id: debtId } });
      if (debt) {
        const newPaid = debt.paidAmount + parsedAmount;
        const newRemaining = Math.max(0, debt.amount - newPaid);
        const status = newRemaining === 0 ? 'PAID' : 'PARTIALLY_PAID';
        
        await prisma.debt.update({
          where: { id: debtId },
          data: {
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            status
          }
        });

        // Trigger notification
        if (status === 'PAID') {
          await prisma.notification.create({
            data: {
              userId,
              message: `Félicitations! Vous avez entièrement remboursé votre dette de ${debt.amount.toLocaleString()} FCFA.`,
              type: 'SUCCESS'
            }
          });
        }
      }
    }

    // 3. If linked to Receivable (reimbursement received: INCOME)
    if (receivableId && type === 'INCOME') {
      const rec = await prisma.receivable.findUnique({ where: { id: receivableId } });
      if (rec) {
        const newPaid = rec.paidAmount + parsedAmount;
        const newRemaining = Math.max(0, rec.amount - newPaid);
        const status = newRemaining === 0 ? 'PAID' : 'PARTIALLY_PAID';
        
        await prisma.receivable.update({
          where: { id: receivableId },
          data: {
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            status
          }
        });

        // Trigger notification
        if (status === 'PAID') {
          const person = await prisma.person.findUnique({ where: { id: rec.personId } });
          const name = person ? `${person.firstName} ${person.lastName || ''}` : 'Quelqu\'un';
          await prisma.notification.create({
            data: {
              userId,
              message: `${name} vous a entièrement remboursé la créance de ${rec.amount.toLocaleString()} FCFA.`,
              type: 'SUCCESS'
            }
          });
        }
      }
    }

    return res.status(201).json(transaction);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la création de la transaction: ' + error.message });
  }
});

// DELETE transaction
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction non trouvée.' });
    }

    // Reverse budget effects
    if (transaction.type === 'EXPENSE' && transaction.categoryId) {
      await updateBudgetOnRemoval(userId, transaction.categoryId, transaction.amount);
    }

    // Reverse debt repayment effects
    if (transaction.debtId && transaction.type === 'EXPENSE') {
      const debt = await prisma.debt.findUnique({ where: { id: transaction.debtId } });
      if (debt) {
        const newPaid = Math.max(0, debt.paidAmount - transaction.amount);
        const newRemaining = debt.amount - newPaid;
        const status = newPaid === 0 ? 'PENDING' : newRemaining === 0 ? 'PAID' : 'PARTIALLY_PAID';
        await prisma.debt.update({
          where: { id: transaction.debtId },
          data: { paidAmount: newPaid, remainingAmount: newRemaining, status }
        });
      }
    }

    // Reverse receivable repayment effects
    if (transaction.receivableId && transaction.type === 'INCOME') {
      const rec = await prisma.receivable.findUnique({ where: { id: transaction.receivableId } });
      if (rec) {
        const newPaid = Math.max(0, rec.paidAmount - transaction.amount);
        const newRemaining = rec.amount - newPaid;
        const status = newPaid === 0 ? 'PENDING' : newRemaining === 0 ? 'PAID' : 'PARTIALLY_PAID';
        await prisma.receivable.update({
          where: { id: transaction.receivableId },
          data: { paidAmount: newPaid, remainingAmount: newRemaining, status }
        });
      }
    }

    await prisma.transaction.delete({
      where: { id }
    });

    return res.json({ message: 'Transaction supprimée avec succès.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la suppression de la transaction: ' + error.message });
  }
});

export default router;
