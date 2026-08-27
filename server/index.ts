import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
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

// Start Server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initSystemCategories();
});
