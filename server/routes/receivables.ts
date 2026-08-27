import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all receivables
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const receivables = await prisma.receivable.findMany({
      where: { userId },
      include: {
        person: true,
        payments: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    return res.json(receivables);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement des créances: ' + error.message });
  }
});

// POST create receivable (Argent prêté: Compte - montant. Créance + montant.)
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

    // 1. Create the Receivable
    const receivable = await prisma.receivable.create({
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

    // 2. Create associated EXPENSE transaction (Argent prêté: Compte - montant)
    await prisma.transaction.create({
      data: {
        userId,
        accountId,
        type: 'EXPENSE',
        amount: parsedAmount,
        date: parsedDate,
        description: `Prêt d'argent (${receivable.person.firstName} ${receivable.person.lastName || ''}) - ${description || ''}`,
        personId,
        receivableId: receivable.id
      }
    });

    // Notification
    await prisma.notification.create({
      data: {
        userId,
        message: `Nouvelle créance de ${parsedAmount.toLocaleString()} FCFA enregistrée sur ${receivable.person.firstName}.`,
        type: 'INFO'
      }
    });

    return res.status(201).json(receivable);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la création de la créance: ' + error.message });
  }
});

// POST repay receivable (Remboursement reçu: Compte + montant. Créance - montant.)
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

    const rec = await prisma.receivable.findFirst({
      where: { id, userId },
      include: { person: true }
    });

    if (!rec) {
      return res.status(404).json({ error: 'Créance non trouvée.' });
    }

    if (parsedAmount > rec.remainingAmount) {
      return res.status(400).json({ error: `Le remboursement (${parsedAmount} FCFA) ne peut pas dépasser le montant restant dû (${rec.remainingAmount} FCFA).` });
    }

    // Create an INCOME transaction linked to this receivable
    // The hooks in transactions.ts automatically reduce the receivable's remainingAmount.
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        accountId,
        type: 'INCOME',
        amount: parsedAmount,
        date: parsedDate,
        description: `Remboursement reçu (${rec.person.firstName} ${rec.person.lastName || ''}) - ${description || ''}`,
        personId: rec.personId,
        receivableId: rec.id
      }
    });

    const updatedRec = await prisma.receivable.findUnique({
      where: { id },
      include: { person: true, payments: true }
    });

    return res.json({
      message: 'Remboursement enregistré avec succès.',
      transaction,
      receivable: updatedRec
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du remboursement de la créance: ' + error.message });
  }
});

// DELETE receivable
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const rec = await prisma.receivable.findFirst({
      where: { id, userId }
    });

    if (!rec) {
      return res.status(404).json({ error: 'Créance non trouvée.' });
    }

    // Delete associated transactions first
    await prisma.transaction.deleteMany({
      where: { receivableId: id }
    });

    await prisma.receivable.delete({
      where: { id }
    });

    return res.json({ message: 'Créance et historique associés supprimés.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la suppression de la créance: ' + error.message });
  }
});

export default router;
