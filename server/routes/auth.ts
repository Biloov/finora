import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'finora_very_secret_key_123456';

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Tous les champs (email, mot de passe, nom) sont requis.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Cet email est déjà enregistré.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
      }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de l\'inscription: ' + error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Identifiants invalides.' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        pinCode: user.pinCode
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la connexion: ' + error.message });
  }
});

// Login with PIN
router.post('/login-pin', async (req, res) => {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      return res.status(400).json({ error: 'Email et code PIN requis.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.pinCode !== pin) {
      return res.status(401).json({ error: 'Code PIN incorrect.' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        pinCode: user.pinCode
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la connexion par PIN: ' + error.message });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(444).json({ error: 'Utilisateur non trouvé.' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      pinCode: user.pinCode
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la récupération du profil: ' + error.message });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    const validPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Ancien mot de passe incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { passwordHash }
    });

    return res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur de changement de mot de passe: ' + error.message });
  }
});

// Set PIN
router.post('/set-pin', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pin } = req.body;

    if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
      return res.status(400).json({ error: 'Le code PIN doit comporter exactement 4 chiffres.' });
    }

    await prisma.user.update({
      where: { id: req.userId },
      data: { pinCode: pin }
    });

    return res.json({ message: 'Code PIN enregistré avec succès.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur de configuration du code PIN: ' + error.message });
  }
});

// Reset database to Marc mockup demo data for this user
router.post('/reset-demo', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // 1. Clean existing user data
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.financialGoal.deleteMany({ where: { userId } });
    await prisma.budget.deleteMany({ where: { userId } });
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.receivable.deleteMany({ where: { userId } });
    await prisma.debt.deleteMany({ where: { userId } });
    await prisma.person.deleteMany({ where: { userId } });
    await prisma.recurringTransaction.deleteMany({ where: { userId } });
    await prisma.account.deleteMany({ where: { userId } });

    // 2. Create Accounts
    const caisse = await prisma.account.create({
      data: {
        userId,
        name: 'Caisse',
        type: 'Caisse',
        initialBalance: 200000,
        currency: 'FCFA',
        description: 'Espèces physiques'
      }
    });

    const banque = await prisma.account.create({
      data: {
        userId,
        name: 'Banque',
        type: 'Banque',
        initialBalance: 1500000,
        currency: 'FCFA',
        description: 'Compte courant principal •••• 4092'
      }
    });

    const moov = await prisma.account.create({
      data: {
        userId,
        name: 'Moov',
        type: 'Mobile Money',
        initialBalance: 350000,
        currency: 'FCFA',
        description: 'Mobile Money Moov •••• 1289'
      }
    });

    const togocom = await prisma.account.create({
      data: {
        userId,
        name: 'Togocom',
        type: 'Mobile Money',
        initialBalance: 125000,
        currency: 'FCFA',
        description: 'Mobile Money T-Money •••• 8841'
      }
    });

    // 3. Ensure Categories exist for this user or globally
    const alimCat = await prisma.category.findFirst({ where: { name: 'Alimentation' } }) || 
      await prisma.category.create({ data: { name: 'Alimentation', icon: 'restaurant', color: '#EF4444', type: 'EXPENSE' } });
    const transCat = await prisma.category.findFirst({ where: { name: 'Transport' } }) ||
      await prisma.category.create({ data: { name: 'Transport', icon: 'directions_car', color: '#F59E0B', type: 'EXPENSE' } });
    const logCat = await prisma.category.findFirst({ where: { name: 'Logement' } }) ||
      await prisma.category.create({ data: { name: 'Logement', icon: 'home', color: '#3B82F6', type: 'EXPENSE' } });
    const santeCat = await prisma.category.findFirst({ where: { name: 'Santé' } }) ||
      await prisma.category.create({ data: { name: 'Santé', icon: 'medical_services', color: '#10B981', type: 'EXPENSE' } });
    const servCat = await prisma.category.findFirst({ where: { name: 'Services' } }) ||
      await prisma.category.create({ data: { name: 'Services', icon: 'electrical_services', color: '#8B5CF6', type: 'EXPENSE' } });
    const commCat = await prisma.category.findFirst({ where: { name: 'Commerce' } }) ||
      await prisma.category.create({ data: { name: 'Commerce', icon: 'storefront', color: '#EC4899', type: 'BOTH' } });
    const salCat = await prisma.category.findFirst({ where: { name: 'Salaire' } }) ||
      await prisma.category.create({ data: { name: 'Salaire', icon: 'payments', color: '#10B981', type: 'INCOME' } });

    // 4. Create Contacts (People)
    const abdou = await prisma.person.create({
      data: {
        userId,
        firstName: 'Abdou',
        lastName: 'Diallo',
        phone: '+228 90 12 34 56',
        email: 'abdou@gmail.com',
        notes: 'Ami d\'enfance',
        photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Abdou'
      }
    });

    const moussa = await prisma.person.create({
      data: {
        userId,
        firstName: 'Moussa',
        lastName: 'Traoré',
        phone: '+228 91 98 76 54',
        email: 'moussa@gmail.com',
        notes: 'Client commerce',
        photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Moussa'
      }
    });

    const ali = await prisma.person.create({
      data: {
        userId,
        firstName: 'Ali',
        lastName: 'Koffi',
        phone: '+228 92 11 22 33',
        email: 'ali@gmail.com',
        notes: 'Partenaire commercial',
        photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ali'
      }
    });

    const mohamed = await prisma.person.create({
      data: {
        userId,
        firstName: 'Mohamed',
        lastName: 'Sylla',
        phone: '+228 93 44 55 66',
        email: 'mohamed@gmail.com',
        notes: 'Prêteur',
        photoUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Mohamed'
      }
    });

    const entrepriseX = await prisma.person.create({
      data: {
        userId,
        firstName: 'Entreprise X',
        phone: '+228 22 21 00 11',
        email: 'contact@entreprise-x.com',
        notes: 'Fournisseur de matériel',
        photoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=X'
      }
    });

    // 5. Create Receivables (On me doit - Abdou: 300k, Moussa: 250k, Ali: 300k)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    await prisma.receivable.create({
      data: {
        userId,
        personId: abdou.id,
        amount: 300000,
        remainingAmount: 300000,
        paidAmount: 0,
        date: new Date('2024-05-01'),
        dueDate: tomorrow,
        description: 'Prêt pour achat ordinateur',
        status: 'PENDING'
      }
    });

    await prisma.receivable.create({
      data: {
        userId,
        personId: moussa.id,
        amount: 250000,
        remainingAmount: 250000,
        paidAmount: 0,
        date: new Date('2024-05-10'),
        dueDate: new Date('2024-06-10'),
        description: 'Avance sur livraison de marchandises',
        status: 'PENDING'
      }
    });

    await prisma.receivable.create({
      data: {
        userId,
        personId: ali.id,
        amount: 300000,
        remainingAmount: 300000,
        paidAmount: 0,
        date: new Date('2024-05-12'),
        dueDate: new Date('2024-06-15'),
        description: 'Achat de marchandises à crédit',
        status: 'PENDING'
      }
    });

    // 6. Create Debts (Mohamed: 200k, Entreprise X: 200k)
    await prisma.debt.create({
      data: {
        userId,
        personId: mohamed.id,
        amount: 200000,
        remainingAmount: 200000,
        paidAmount: 0,
        date: new Date('2024-04-15'),
        dueDate: new Date('2024-06-30'),
        description: 'Emprunt de trésorerie',
        status: 'PENDING'
      }
    });

    await prisma.debt.create({
      data: {
        userId,
        personId: entrepriseX.id,
        amount: 200000,
        remainingAmount: 200000,
        paidAmount: 0,
        date: new Date('2024-04-20'),
        dueDate: new Date('2024-06-01'),
        description: 'Achat d\'outils professionnels',
        status: 'PENDING'
      }
    });

    // 7. Create Transactions (Achat marchandises, Vente, Frais de transport, Facture Électricité)
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    await prisma.transaction.create({
      data: {
        userId,
        accountId: caisse.id,
        type: 'EXPENSE',
        amount: 150000,
        date: today,
        description: 'Achat marchandises',
        categoryId: commCat.id,
        personId: ali.id
      }
    });

    await prisma.transaction.create({
      data: {
        userId,
        accountId: banque.id,
        type: 'INCOME',
        amount: 350000,
        date: today,
        description: 'Vente',
        categoryId: commCat.id
      }
    });

    await prisma.transaction.create({
      data: {
        userId,
        accountId: caisse.id,
        type: 'EXPENSE',
        amount: 15000,
        date: yesterday,
        description: 'Frais de transport',
        categoryId: transCat.id
      }
    });

    await prisma.transaction.create({
      data: {
        userId,
        accountId: banque.id,
        type: 'EXPENSE',
        amount: 45000,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
        description: 'Facture Électricité',
        categoryId: servCat.id
      }
    });

    // Add extra mock transactions to support graphs
    for (let i = 5; i <= 25; i += 5) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - i);
      
      await prisma.transaction.create({
        data: {
          userId,
          accountId: banque.id,
          type: 'INCOME',
          amount: 400000,
          date: pastDate,
          description: 'Versement salaire ou commerce',
          categoryId: salCat.id
        }
      });

      await prisma.transaction.create({
        data: {
          userId,
          accountId: caisse.id,
          type: 'EXPENSE',
          amount: 80000,
          date: pastDate,
          description: 'Achat nourriture / divers',
          categoryId: alimCat.id
        }
      });
    }

    // 8. Create Savings Goal
    await prisma.financialGoal.create({
      data: {
        userId,
        name: 'Achat voiture',
        targetAmount: 8000000,
        savedAmount: 2500000,
        targetDate: new Date('2027-12-31'),
        icon: 'directions_car'
      }
    });

    // 9. Create Budgets
    await prisma.budget.create({
      data: {
        userId,
        categoryId: transCat.id,
        amount: 100000,
        spentAmount: 72000,
        period: 'MONTHLY'
      }
    });

    // 10. Create Notifications
    await prisma.notification.create({
      data: {
        userId,
        message: 'Abdou doit te rembourser 100 000 FCFA demain.',
        type: 'INFO',
        isRead: false
      }
    });

    await prisma.notification.create({
      data: {
        userId,
        message: 'Ton budget transport atteint 90 %.',
        type: 'WARNING',
        isRead: false
      }
    });

    await prisma.notification.create({
      data: {
        userId,
        message: 'Ton objectif voiture vient d\'atteindre 30 %.',
        type: 'SUCCESS',
        isRead: false
      }
    });

    // 11. Create Recurring Templates
    await prisma.recurringTransaction.create({
      data: {
        userId,
        accountId: banque.id,
        type: 'INCOME',
        amount: 600000,
        frequency: 'MONTHLY',
        startDate: new Date('2024-01-01'),
        categoryId: salCat.id,
        description: 'Salaire Mensuel'
      }
    });

    await prisma.recurringTransaction.create({
      data: {
        userId,
        accountId: banque.id,
        type: 'EXPENSE',
        amount: 150000,
        frequency: 'MONTHLY',
        startDate: new Date('2024-01-05'),
        categoryId: logCat.id,
        description: 'Loyer mensuel'
      }
    });

    return res.json({ message: 'Données de démonstration réinitialisées avec succès.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur de réinitialisation : ' + error.message });
  }
});

// Clear all financial records for this user
router.post('/clear-data', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    await prisma.auditLog.deleteMany({ where: { userId } });
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.financialGoal.deleteMany({ where: { userId } });
    await prisma.budget.deleteMany({ where: { userId } });
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.receivable.deleteMany({ where: { userId } });
    await prisma.debt.deleteMany({ where: { userId } });
    await prisma.person.deleteMany({ where: { userId } });
    await prisma.recurringTransaction.deleteMany({ where: { userId } });
    await prisma.account.deleteMany({ where: { userId } });

    return res.json({ message: 'Toutes vos données financières ont été effacées.' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la suppression des données : ' + error.message });
  }
});

export default router;
