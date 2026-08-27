import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all recurring transactions templates
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const templates = await prisma.recurringTransaction.findMany({
      where: { userId },
      include: {
        account: true,
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(templates);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement des opérations récurrentes: ' + error.message });
  }
});

// POST create recurring transaction template
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { accountId, type, amount, frequency, startDate, endDate, categoryId, description } = req.body;

    if (!accountId || !type || !amount || !frequency || !startDate) {
      return res.status(400).json({ error: 'Champs obligatoires manquants: compte, type, montant, fréquence, date de début.' });
    }

    const template = await prisma.recurringTransaction.create({
      data: {
        userId,
        accountId,
        type,
        amount: parseFloat(amount),
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        categoryId: categoryId || null,
        description
      },
      include: {
        account: true,
        category: true
      }
    });

    return res.status(201).json(template);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la création de la récurrence: ' + error.message });
  }
});

// DELETE recurring template
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const template = await prisma.recurringTransaction.findFirst({
      where: { id, userId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Modèle de récurrence non trouvé.' });
    }

    await prisma.recurringTransaction.delete({
      where: { id }
    });

    return res.json({ message: 'Modèle de récurrence supprimé avec succès.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la suppression de la récurrence: ' + error.message });
  }
});

export default router;
