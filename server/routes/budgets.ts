import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all budgets with category details
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    
    // Fetch budgets
    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: { category: true }
    });

    return res.json(budgets);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement des budgets: ' + error.message });
  }
});

// POST create budget
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { categoryId, amount, period } = req.body;

    if (!categoryId || !amount) {
      return res.status(400).json({ error: 'La catégorie et le montant sont requis.' });
    }

    const parsedAmount = parseFloat(amount);

    // Check if budget for this category already exists
    const existing = await prisma.budget.findFirst({
      where: { userId, categoryId }
    });

    if (existing) {
      return res.status(400).json({ error: 'Un budget existe déjà pour cette catégorie.' });
    }

    // Calculate current spent for this category in the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        categoryId,
        type: 'EXPENSE',
        date: { gte: startOfMonth }
      }
    });

    const spentAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

    const budget = await prisma.budget.create({
      data: {
        userId,
        categoryId,
        amount: parsedAmount,
        spentAmount,
        period: period || 'MONTHLY'
      },
      include: { category: true }
    });

    return res.status(201).json(budget);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la création du budget: ' + error.message });
  }
});

// PUT update budget
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { amount, period } = req.body;

    const budget = await prisma.budget.findFirst({
      where: { id, userId }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget non trouvé.' });
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: {
        amount: amount !== undefined ? parseFloat(amount) : budget.amount,
        period: period !== undefined ? period : budget.period
      },
      include: { category: true }
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du budget: ' + error.message });
  }
});

// DELETE budget
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const budget = await prisma.budget.findFirst({
      where: { id, userId }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget non trouvé.' });
    }

    await prisma.budget.delete({
      where: { id }
    });

    return res.json({ message: 'Budget supprimé avec succès.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la suppression du budget: ' + error.message });
  }
});

export default router;
