import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET all notifications for current user
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(notifications);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement des notifications: ' + error.message });
  }
});

// PUT mark notification as read
router.put('/:id/read', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const notif = await prisma.notification.findFirst({
      where: { id, userId }
    });

    if (!notif) {
      return res.status(404).json({ error: 'Notification non trouvée.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur de mise à jour de la notification: ' + error.message });
  }
});

// DELETE clear all notifications
router.delete('/clear', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    await prisma.notification.deleteMany({
      where: { userId }
    });
    return res.json({ message: 'Toutes les notifications ont été supprimées.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la suppression des notifications: ' + error.message });
  }
});

export default router;
