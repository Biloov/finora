import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import prisma from './db';

// Import routers
import authRouter from './routes/auth';
import accountsRouter from './routes/accounts';
import transactionsRouter from './routes/transactions';
import peopleRouter from './routes/people';
import debtsRouter from './routes/debts';
import receivablesRouter from './routes/receivables';
import budgetsRouter from './routes/budgets';
import goalsRouter from './routes/goals';
import recurringRouter from './routes/recurring';
import reportsRouter from './routes/reports';
import notificationsRouter from './routes/notifications';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists and mount it statically
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Route Registration
app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/people', peopleRouter);
app.use('/api/debts', debtsRouter);
app.use('/api/receivables', receivablesRouter);
app.use('/api/budgets', budgetsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/recurring', recurringRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/notifications', notificationsRouter);

// Fallback test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Seed default system categories if empty
async function initSystemCategories() {
  try {
    const count = await prisma.category.count();
    if (count === 0) {
      console.log('Seeding default system categories...');
      const defaultCategories = [
        { name: 'Alimentation', icon: 'restaurant', color: '#EF4444', type: 'EXPENSE' },
        { name: 'Transport', icon: 'directions_car', color: '#F59E0B', type: 'EXPENSE' },
        { name: 'Logement', icon: 'home', color: '#3B82F6', type: 'EXPENSE' },
        { name: 'Santé', icon: 'medical_services', color: '#10B981', type: 'EXPENSE' },
        { name: 'Services', icon: 'electrical_services', color: '#8B5CF6', type: 'EXPENSE' },
        { name: 'Commerce', icon: 'storefront', color: '#EC4899', type: 'BOTH' },
        { name: 'Salaire', icon: 'payments', color: '#10B981', type: 'INCOME' },
        { name: 'Autres', icon: 'more_horiz', color: '#6B7280', type: 'BOTH' }
      ];

      for (const cat of defaultCategories) {
        await prisma.category.create({ data: cat });
      }
      console.log('Default system categories seeded.');
    }
  } catch (error) {
    console.error('Error seeding default categories:', error);
  }
}

async function initDemoUser() {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      console.log('No users found in database. Seeding demo user "Marc" automatically...');
      const passwordHash = await bcrypt.hash('password', 10);
      const user = await prisma.user.create({
        data: {
          email: 'marc@finora.com',
          name: 'Marc',
          passwordHash,
          pinCode: '1234',
          avatarUrl: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Marc'
        }
      });
      
      const userId = user.id;

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

      const alimCat = await prisma.category.findFirst({ where: { name: 'Alimentation' } });
      const transCat = await prisma.category.findFirst({ where: { name: 'Transport' } });
      const logCat = await prisma.category.findFirst({ where: { name: 'Logement' } });
      const santeCat = await prisma.category.findFirst({ where: { name: 'Santé' } });
      const servCat = await prisma.category.findFirst({ where: { name: 'Services' } });
      const commCat = await prisma.category.findFirst({ where: { name: 'Commerce' } });
      const salCat = await prisma.category.findFirst({ where: { name: 'Salaire' } });

      const alimId = alimCat?.id || '';
      const transId = transCat?.id || '';
      const logId = logCat?.id || '';
      const santeId = santeCat?.id || '';
      const servId = servCat?.id || '';
      const commId = commCat?.id || '';
      const salId = salCat?.id || '';

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
          categoryId: commId || undefined,
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
          categoryId: commId || undefined
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
          categoryId: transId || undefined
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
          categoryId: servId || undefined
        }
      });

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
            categoryId: salId || undefined
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
            categoryId: alimId || undefined
          }
        });
      }

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

      await prisma.budget.create({
        data: {
          userId,
          categoryId: transId || '',
          amount: 100000,
          spentAmount: 72000,
          period: 'MONTHLY'
        }
      });

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

      await prisma.recurringTransaction.create({
        data: {
          userId,
          accountId: banque.id,
          type: 'INCOME',
          amount: 600000,
          frequency: 'MONTHLY',
          startDate: new Date('2024-01-01'),
          categoryId: salId || undefined,
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
          categoryId: logId || undefined,
          description: 'Loyer mensuel'
        }
      });

      console.log('Demo user "Marc" and demo datasets seeded automatically.');
    }
  } catch (error) {
    console.error('Error auto-seeding demo user:', error);
  }
}

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildDir = path.join(__dirname, '../');
  app.use(express.static(clientBuildDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildDir, 'index.html'));
  });
}

// Start Server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initSystemCategories();
  await initDemoUser();
});
