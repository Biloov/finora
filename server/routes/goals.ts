import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all goals
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const goals = await prisma.financialGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(goals);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement des objectifs: ' + error.message });
  }
});

// POST create goal
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, targetAmount, targetDate, icon } = req.body;

    if (!name || !targetAmount) {
      return res.status(400).json({ error: 'Le nom et le montant cible sont requis.' });
    }

    const goal = await prisma.financialGoal.create({
      data: {
        userId,
        name,
        targetAmount: parseFloat(targetAmount),
        savedAmount: 0,
        targetDate: targetDate ? new Date(targetDate) : null,
        icon: icon || 'savings'
      }
    });

    return res.status(201).json(goal);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la création de l\'objectif: ' + error.message });
  }
});

// POST add funds to goal (moves money from an account to the goal)
router.post('/:id/add-funds', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { amount, accountId } = req.body;

    if (!amount || !accountId) {
      return res.status(400).json({ error: 'Le montant et le compte d\'origine sont requis.' });
    }

    const parsedAmount = parseFloat(amount);

    const goal = await prisma.financialGoal.findFirst({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Objectif non trouvé.' });
    }

    // 1. Create an EXPENSE transaction to represent allocating funds to this savings goal
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        accountId,
        type: 'EXPENSE',
        amount: parsedAmount,
        date: new Date(),
        description: `Épargne pour objectif : ${goal.name}`,
        // We could also record metadata or category, we'll label it as savings
      }
    });

    // 2. Update the goal's savedAmount
    const oldRatio = goal.savedAmount / goal.targetAmount;
    const newSaved = goal.savedAmount + parsedAmount;
    const newRatio = newSaved / goal.targetAmount;

    const updatedGoal = await prisma.financialGoal.update({
      where: { id },
      data: { savedAmount: newSaved }
    });

    // 3. Trigger progression notifications
    const checkMilestone = async (threshold: number, label: string) => {
      if (newRatio >= threshold && oldRatio < threshold) {
        await prisma.notification.create({
          data: {
            userId,
            message: `Ton objectif "${goal.name}" vient d'atteindre ${label} (${newSaved.toLocaleString()} / ${goal.targetAmount.toLocaleString()} FCFA) !`,
            type: threshold === 1.0 ? 'SUCCESS' : 'INFO'
          }
        });
      }
    };

    await checkMilestone(0.3, '30%');
    await checkMilestone(0.5, '50%');
    await checkMilestone(0.75, '75%');
    await checkMilestone(1.0, '100%');

    return res.json({
      message: 'Fonds ajoutés avec succès.',
      transaction,
      goal: updatedGoal
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du versement sur l\'objectif: ' + error.message });
  }
});

// PUT update goal
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { name, targetAmount, savedAmount, targetDate, icon } = req.body;

    const goal = await prisma.financialGoal.findFirst({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Objectif non trouvé.' });
    }

    const updated = await prisma.financialGoal.update({
      where: { id },
      data: {
        name: name !== undefined ? name : goal.name,
        targetAmount: targetAmount !== undefined ? parseFloat(targetAmount) : goal.targetAmount,
        savedAmount: savedAmount !== undefined ? parseFloat(savedAmount) : goal.savedAmount,
        targetDate: targetDate !== undefined ? new Date(targetDate) : goal.targetDate,
        icon: icon !== undefined ? icon : goal.icon
      }
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'objectif: ' + error.message });
  }
});

// DELETE goal
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const goal = await prisma.financialGoal.findFirst({
      where: { id, userId }
    });

    if (!goal) {
      return res.status(404).json({ error: 'Objectif non trouvé.' });
    }

    await prisma.financialGoal.delete({
      where: { id }
    });

    return res.json({ message: 'Objectif d\'épargne supprimé avec succès.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la suppression de l\'objectif: ' + error.message });
  }
});

export default router;
