import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper to compute account balances
export async function getAccountsWithBalances(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId, status: 'ACTIVE' },
    include: {
      transactions: true, // Outgoing transactions (expenses, incomes, outgoing transfers)
      incomingTransfers: true // Incoming transfers
    }
  });

  return accounts.map(account => {
    let balance = account.initialBalance;

    // Outgoing or direct transactions
    account.transactions.forEach(t => {
      if (t.type === 'INCOME') {
        balance += t.amount;
      } else if (t.type === 'EXPENSE') {
        balance -= t.amount;
      } else if (t.type === 'TRANSFER') {
        // Transfer out of this account
        balance -= t.amount;
      }
    });

    // Incoming transfers
    account.incomingTransfers.forEach(t => {
      balance += t.amount;
    });

    // Clean up relations for the API response
    const { transactions, incomingTransfers, ...accountData } = account;
    
    return {
      ...accountData,
      balance
    };
  });
}

// GET all accounts with calculated balances
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const accounts = await getAccountsWithBalances(userId);
    return res.json(accounts);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération des comptes: ' + error.message });
  }
});

// GET single account details
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const account = await prisma.account.findFirst({
      where: { id, userId, status: 'ACTIVE' },
      include: {
        transactions: true,
        incomingTransfers: true
      }
    });

    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé.' });
    }

    let balance = account.initialBalance;

    account.transactions.forEach(t => {
      if (t.type === 'INCOME') {
        balance += t.amount;
      } else if (t.type === 'EXPENSE') {
        balance -= t.amount;
      } else if (t.type === 'TRANSFER') {
        balance -= t.amount;
      }
    });

    account.incomingTransfers.forEach(t => {
      balance += t.amount;
    });

    const { transactions, incomingTransfers, ...accountData } = account;

    return res.json({
      ...accountData,
      balance
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération du compte: ' + error.message });
  }
});

// POST create account
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, type, initialBalance, currency, description } = req.body;
    const userId = req.userId!;

    if (!name || !type) {
      return res.status(400).json({ error: 'Le nom et le type de compte sont requis.' });
    }

    const account = await prisma.account.create({
      data: {
        userId,
        name,
        type,
        initialBalance: initialBalance ? parseFloat(initialBalance) : 0,
        currency: currency || 'FCFA',
        description,
        status: 'ACTIVE'
      }
    });

    return res.status(201).json({
      ...account,
      balance: account.initialBalance
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la création du compte: ' + error.message });
  }
});

// PUT update account
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, initialBalance, currency, description } = req.body;
    const userId = req.userId!;

    const account = await prisma.account.findFirst({
      where: { id, userId }
    });

    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé.' });
    }

    const updated = await prisma.account.update({
      where: { id },
      data: {
        name: name !== undefined ? name : account.name,
        type: type !== undefined ? type : account.type,
        initialBalance: initialBalance !== undefined ? parseFloat(initialBalance) : account.initialBalance,
        currency: currency !== undefined ? currency : account.currency,
        description: description !== undefined ? description : account.description
      }
    });

    // Recalculate balance for response
    const completeAccount = await prisma.account.findUnique({
      where: { id },
      include: { transactions: true, incomingTransfers: true }
    });

    let balance = completeAccount!.initialBalance;
    completeAccount!.transactions.forEach(t => {
      if (t.type === 'INCOME') balance += t.amount;
      else if (t.type === 'EXPENSE') balance -= t.amount;
      else if (t.type === 'TRANSFER') balance -= t.amount;
    });
    completeAccount!.incomingTransfers.forEach(t => {
      balance += t.amount;
    });

    const { transactions, incomingTransfers, ...accountData } = completeAccount!;

    return res.json({
      ...accountData,
      balance
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la mise à jour du compte: ' + error.message });
  }
});

// DELETE (archive) account
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const account = await prisma.account.findFirst({
      where: { id, userId }
    });

    if (!account) {
      return res.status(404).json({ error: 'Compte non trouvé.' });
    }

    // We archive accounts instead of fully deleting them to preserve transaction history integrity
    await prisma.account.update({
      where: { id },
      data: { status: 'ARCHIVED' }
    });

    return res.json({ message: 'Compte archivé avec succès.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de l\'archivage du compte: ' + error.message });
  }
});

export default router;
