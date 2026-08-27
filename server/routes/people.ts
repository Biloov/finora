import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper to calculate balances for a contact list
async function getPeopleWithBalances(userId: string) {
  const people = await prisma.person.findMany({
    where: { userId },
    include: {
      receivables: {
        where: { status: { not: 'PAID' } }
      },
      debts: {
        where: { status: { not: 'PAID' } }
      }
    }
  });

  return people.map(p => {
    const sheOwesMe = p.receivables.reduce((sum, r) => sum + r.remainingAmount, 0);
    const iOweHer = p.debts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const netBalance = sheOwesMe - iOweHer;

    const { receivables, debts, ...personData } = p;

    return {
      ...personData,
      sheOwesMe,
      iOweHer,
      netBalance
    };
  });
}

// GET all people with calculated balances
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const people = await getPeopleWithBalances(userId);
    return res.json(people);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement des personnes: ' + error.message });
  }
});

// GET single person details with financial history
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const person = await prisma.person.findFirst({
      where: { id, userId },
      include: {
        receivables: true,
        debts: true,
        transactions: {
          include: {
            account: true,
            category: true
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!person) {
      return res.status(404).json({ error: 'Personne non trouvée.' });
    }

    const sheOwesMe = person.receivables.filter(r => r.status !== 'PAID').reduce((sum, r) => sum + r.remainingAmount, 0);
    const iOweHer = person.debts.filter(d => d.status !== 'PAID').reduce((sum, d) => sum + d.remainingAmount, 0);
    const netBalance = sheOwesMe - iOweHer;

    return res.json({
      ...person,
      sheOwesMe,
      iOweHer,
      netBalance
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement des détails de la personne: ' + error.message });
  }
});

// POST create person
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { firstName, lastName, phone, email, notes } = req.body;

    if (!firstName) {
      return res.status(400).json({ error: 'Le prénom est requis.' });
    }

    const person = await prisma.person.create({
      data: {
        userId,
        firstName,
        lastName,
        phone,
        email,
        notes,
        photoUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(firstName + (lastName || ''))}`
      }
    });

    return res.status(201).json({
      ...person,
      sheOwesMe: 0,
      iOweHer: 0,
      netBalance: 0
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la création du contact: ' + error.message });
  }
});

// PUT update person
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { firstName, lastName, phone, email, notes } = req.body;

    const person = await prisma.person.findFirst({
      where: { id, userId }
    });

    if (!person) {
      return res.status(404).json({ error: 'Contact non trouvé.' });
    }

    const updated = await prisma.person.update({
      where: { id },
      data: {
        firstName: firstName !== undefined ? firstName : person.firstName,
        lastName: lastName !== undefined ? lastName : person.lastName,
        phone: phone !== undefined ? phone : person.phone,
        email: email !== undefined ? email : person.email,
        notes: notes !== undefined ? notes : person.notes
      }
    });

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du contact: ' + error.message });
  }
});

// DELETE person
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const person = await prisma.person.findFirst({
      where: { id, userId }
    });

    if (!person) {
      return res.status(404).json({ error: 'Contact non trouvé.' });
    }

    // Checking if there are unpaid debts or receivables
    const unpaidReceivables = await prisma.receivable.count({
      where: { personId: id, status: { not: 'PAID' } }
    });
    const unpaidDebts = await prisma.debt.count({
      where: { personId: id, status: { not: 'PAID' } }
    });

    if (unpaidReceivables > 0 || unpaidDebts > 0) {
      return res.status(400).json({ error: 'Impossible de supprimer un contact ayant des dettes ou des créances en cours.' });
    }

    await prisma.person.delete({
      where: { id }
    });

    return res.json({ message: 'Contact supprimé avec succès.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la suppression du contact: ' + error.message });
  }
});

export default router;
