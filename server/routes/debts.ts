import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all debts
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const debts = await prisma.debt.findMany({
      where: { userId },
      include: {
        person: true,
        payments: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    return res.json(debts);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement des dettes: ' + error.message });
  }
});

// POST create debt (Emprunt reçu: Compte + montant. Dette + montant.)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { personId, amount, accountId, date, dueDate, description } = req.body;

    if (!personId || !amount || !accountId || !date) {
      return res.status(400).json({ error: 'Champs obligatoires manquants: contact, montant, compte, date.' });
    }

    const parsedAmount = parseFloat(amount);
    const parsedDate = new Date(date);
    const parsedDueDate = dueDate ? new Date(dueDate) : null;

    // 1. Create the Debt
    const debt = await prisma.debt.create({
      data: {
        userId,
        personId,
        amount: parsedAmount,
        remainingAmount: parsedAmount,
        date: parsedDate,
        dueDate: parsedDueDate,
        description,
        status: 'PENDING'
      },
      include: { person: true }
    });

    // 2. Create the associated INCOME transaction (Emprunt reçu: Compte + montant.)
    await prisma.transaction.create({
      data: {
        userId,
        accountId,
        type: 'INCOME',
        amount: parsedAmount,
        date: parsedDate,
        description: `Emprunt reçu (${debt.person.firstName} ${debt.person.lastName || ''}) - ${description || ''}`,
        personId,
        debtId: debt.id
      }
    });

    // Create a notification
    await prisma.notification.create({
      data: {
        userId,
        message: `Nouvelle dette de ${parsedAmount.toLocaleString()} FCFA enregistrée envers ${debt.person.firstName}.`,
        type: 'INFO'
      }
    });

    return res.status(201).json(debt);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la création de la dette: ' + error.message });
  }
});

// POST repay debt (Remboursement de dette: Compte - montant. Dette - montant.)
router.post('/:id/repay', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { amount, accountId, date, description } = req.body;

    if (!amount || !accountId || !date) {
      return res.status(400).json({ error: 'Champs obligatoires manquants: montant, compte, date.' });
    }

    const parsedAmount = parseFloat(amount);
    const parsedDate = new Date(date);

    const debt = await prisma.debt.findFirst({
      where: { id, userId },
      include: { person: true }
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dette non trouvée.' });
    }

    if (parsedAmount > debt.remainingAmount) {
      return res.status(400).json({ error: `Le remboursement (${parsedAmount} FCFA) ne peut pas dépasser le montant restant de la dette (${debt.remainingAmount} FCFA).` });
    }

    // Create an EXPENSE transaction linked to this debt
    // The transaction's hooks (implemented in transactions.ts) will automatically update the Debt's paidAmount, remainingAmount and status.
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        accountId,
        type: 'EXPENSE',
        amount: parsedAmount,
        date: parsedDate,
        description: `Remboursement dette (${debt.person.firstName} ${debt.person.lastName || ''}) - ${description || ''}`,
        personId: debt.personId,
        debtId: debt.id
      }
    });

    // Fetch the updated debt to return it
    const updatedDebt = await prisma.debt.findUnique({
      where: { id },
      include: { person: true, payments: true }
    });

    return res.json({
      message: 'Remboursement enregistré avec succès.',
      transaction,
      debt: updatedDebt
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du remboursement de la dette: ' + error.message });
  }
});

// DELETE debt
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const debt = await prisma.debt.findFirst({
      where: { id, userId }
    });

    if (!debt) {
      return res.status(404).json({ error: 'Dette non trouvée.' });
    }

    // Delete associated transactions first to preserve database constraint integrity
    await prisma.transaction.deleteMany({
      where: { debtId: id }
    });

    await prisma.debt.delete({
      where: { id }
    });

    return res.json({ message: 'Dette et historique associés supprimés.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la suppression de la dette: ' + error.message });
  }
});

export default router;
