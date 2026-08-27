import { Router, Response } from 'express';
import prisma from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { getAccountsWithBalances } from './accounts';

const router = Router();

// GET dashboard overview
router.get('/dashboard-overview', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // 1. Get accounts and calculate available cash
    const accounts = await getAccountsWithBalances(userId);
    const availableCash = accounts.reduce((sum, a) => sum + a.balance, 0);

    // 2. Get outstanding receivables (créances)
    const receivables = await prisma.receivable.findMany({
      where: { userId, status: { not: 'PAID' } }
    });
    const totalReceivables = receivables.reduce((sum, r) => sum + r.remainingAmount, 0);

    // 3. Get outstanding debts (dettes)
    const debts = await prisma.debt.findMany({
      where: { userId, status: { not: 'PAID' } }
    });
    const totalDebts = debts.reduce((sum, d) => sum + d.remainingAmount, 0);

    // 4. Calculate Net Worth
    const netWorth = availableCash + totalReceivables - totalDebts;

    // 5. Calculate previous period net worth (approx. 30 days ago) for trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Calculate historical balance up to 30 days ago
    const historicalTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: thirtyDaysAgo }
      }
    });

    // Net worth 30 days ago is current net worth minus transactions in the last 30 days
    // (since incomes increased it and expenses decreased it, we reverse them)
    let netWorthChange = 0;
    historicalTransactions.forEach(t => {
      if (t.type === 'INCOME') {
        netWorthChange += t.amount;
      } else if (t.type === 'EXPENSE') {
        netWorthChange -= t.amount;
      }
    });
    
    const previousNetWorth = netWorth - netWorthChange;
    const trendPercentage = previousNetWorth > 0 
      ? Math.round(((netWorth - previousNetWorth) / previousNetWorth) * 100 * 10) / 10 
      : 8.4; // Default mockup trend if no data

    // 6. Recent transactions (last 5)
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        account: true,
        category: true,
        person: true
      },
      orderBy: { date: 'desc' },
      take: 5
    });

    // 7. Upcoming elements (À venir)
    // Filter receivables and debts due in next 30 days, plus recurring transactions
    const fifteenDaysFromNow = new Date();
    fifteenDaysFromNow.setDate(fifteenDaysFromNow.getDate() + 15);

    const upcomingReceivables = await prisma.receivable.findMany({
      where: {
        userId,
        status: { not: 'PAID' },
        dueDate: { lte: fifteenDaysFromNow, gte: new Date() }
      },
      include: { person: true }
    });

    const upcomingDebts = await prisma.debt.findMany({
      where: {
        userId,
        status: { not: 'PAID' },
        dueDate: { lte: fifteenDaysFromNow, gte: new Date() }
      },
      include: { person: true }
    });

    const upcomingRecurring = await prisma.recurringTransaction.findMany({
      where: { userId },
      include: { account: true, category: true }
    });

    const upcoming = [
      ...upcomingReceivables.map(r => ({
        id: r.id,
        type: 'RECEIVABLE',
        title: `Remboursement attendu - ${r.person.firstName}`,
        amount: r.remainingAmount,
        date: r.dueDate,
        icon: 'payments'
      })),
      ...upcomingDebts.map(d => ({
        id: d.id,
        type: 'DEBT',
        title: `Dette à payer - ${d.person.firstName}`,
        amount: d.remainingAmount,
        date: d.dueDate,
        icon: 'outbox'
      })),
      ...upcomingRecurring.map(rec => ({
        id: rec.id,
        type: 'RECURRING',
        title: `Prévu: ${rec.description || 'Opération récurrente'}`,
        amount: rec.amount,
        date: new Date(), // scheduled next occurrences
        icon: rec.type === 'INCOME' ? 'download' : 'upload'
      }))
    ].slice(0, 4); // Top 4 upcoming items

    // 8. Financial Goals
    const goals = await prisma.financialGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 2
    });

    return res.json({
      netWorth,
      trendPercentage,
      availableCash,
      totalReceivables,
      totalDebts,
      accounts: accounts.slice(0, 5),
      recentTransactions,
      upcoming,
      goals
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du chargement des statistiques du Dashboard: ' + error.message });
  }
});

// GET full reports statistics
router.get('/statistics', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { period } = req.query; // 'week', 'month', 'year', 'all'

    // Determine start date
    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month' || !period) {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      startDate.setFullYear(2020, 0, 1); // A long time ago
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startDate }
      },
      include: { category: true }
    });

    // 1. Calculate Incomes and Expenses totals
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, { name: string; amount: number; color: string; icon: string }> = {};

    transactions.forEach(t => {
      if (t.type === 'INCOME') {
        totalIncome += t.amount;
      } else if (t.type === 'EXPENSE') {
        totalExpense += t.amount;
        if (t.category) {
          if (!categoryTotals[t.categoryId!]) {
            categoryTotals[t.categoryId!] = {
              name: t.category.name,
              amount: 0,
              color: t.category.color,
              icon: t.category.icon
            };
          }
          categoryTotals[t.categoryId!].amount += t.amount;
        }
      }
    });

    // Convert category breakdown to array and sort
    const categoriesBreakdown = Object.values(categoryTotals).map(c => ({
      ...c,
      percentage: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0
    })).sort((a, b) => b.amount - a.amount);

    // 2. Savings rate
    // Savings = Incomes - Expenses
    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

    // 3. Transactions group by Date (for chart)
    // Group transactions by date for bar/line charts
    const dailyDataMap: Record<string, { date: string; income: number; expense: number }> = {};
    const dateRange = (period === 'week') ? 7 : 30;
    
    for (let i = dateRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      dailyDataMap[dateStr] = { date: dateStr, income: 0, expense: 0 };
    }

    transactions.forEach(t => {
      const dateStr = new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      if (dailyDataMap[dateStr]) {
        if (t.type === 'INCOME') {
          dailyDataMap[dateStr].income += t.amount;
        } else if (t.type === 'EXPENSE') {
          dailyDataMap[dateStr].expense += t.amount;
        }
      }
    });

    const chartData = Object.values(dailyDataMap);

    return res.json({
      totalIncome,
      totalExpense,
      savings,
      savingsRate,
      categoriesBreakdown,
      chartData
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du calcul des statistiques: ' + error.message });
  }
});

// GET projections (7, 30, 90 days)
router.get('/projections', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const accounts = await getAccountsWithBalances(userId);
    const initialCash = accounts.reduce((sum, a) => sum + a.balance, 0);

    const receivables = await prisma.receivable.findMany({
      where: { userId, status: { not: 'PAID' } }
    });

    const debts = await prisma.debt.findMany({
      where: { userId, status: { not: 'PAID' } }
    });

    const recurring = await prisma.recurringTransaction.findMany({
      where: { userId }
    });

    // We build 90 daily projection slots
    const projections: any[] = [];
    let runningBalance = initialCash;
    let runningReceivables = receivables.reduce((sum, r) => sum + r.remainingAmount, 0);
    let runningDebts = debts.reduce((sum, d) => sum + d.remainingAmount, 0);

    for (let i = 0; i <= 90; i++) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];

      // 1. Check if any receivable is due today
      receivables.forEach(r => {
        if (r.dueDate && r.dueDate.toISOString().split('T')[0] === dateStr) {
          runningBalance += r.remainingAmount;
          runningReceivables -= r.remainingAmount;
        }
      });

      // 2. Check if any debt is due today
      debts.forEach(d => {
        if (d.dueDate && d.dueDate.toISOString().split('T')[0] === dateStr) {
          runningBalance -= d.remainingAmount;
          runningDebts -= d.remainingAmount;
        }
      });

      // 3. Process recurring transactions occurring today
      recurring.forEach(rec => {
        let isToday = false;
        const start = new Date(rec.startDate);
        
        if (currentDate >= start && (!rec.endDate || currentDate <= new Date(rec.endDate))) {
          if (rec.frequency === 'DAILY') {
            isToday = true;
          } else if (rec.frequency === 'WEEKLY') {
            isToday = currentDate.getDay() === start.getDay();
          } else if (rec.frequency === 'MONTHLY') {
            isToday = currentDate.getDate() === start.getDate();
          } else if (rec.frequency === 'YEARLY') {
            isToday = currentDate.getDate() === start.getDate() && currentDate.getMonth() === start.getMonth();
          }
        }

        if (isToday) {
          if (rec.type === 'INCOME') {
            runningBalance += rec.amount;
          } else {
            runningBalance -= rec.amount;
          }
        }
      });

      const projectedNetWorth = runningBalance + runningReceivables - runningDebts;

      projections.push({
        day: i,
        date: currentDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        availableCash: runningBalance,
        netWorth: projectedNetWorth
      });
    }

    return res.json({
      today: projections[0],
      in7Days: projections[7],
      in30Days: projections[30],
      in90Days: projections[90],
      timeline: projections
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors du calcul des prévisions: ' + error.message });
  }
});

// GET automated insights
router.get('/insights', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // 1. Load data
    const accounts = await getAccountsWithBalances(userId);
    const available = accounts.reduce((sum, a) => sum + a.balance, 0);

    const receivables = await prisma.receivable.findMany({
      where: { userId, status: { not: 'PAID' } }
    });
    const totalReceivables = receivables.reduce((sum, r) => sum + r.remainingAmount, 0);
    const receivablesPeopleCount = new Set(receivables.map(r => r.personId)).size;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfPrevMonth = new Date();
    startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);
    startOfPrevMonth.setDate(1);
    startOfPrevMonth.setHours(0, 0, 0, 0);

    const currentMonthExpenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfMonth }
      }
    });

    const prevMonthExpenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfPrevMonth, lt: startOfMonth }
      }
    });

    const curExpenseSum = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const prevExpenseSum = prevMonthExpenses.reduce((sum, t) => sum + t.amount, 0);

    // 2. Build insights
    const insights: any[] = [];

    // Trend insight
    if (prevExpenseSum > 0) {
      const diff = ((curExpenseSum - prevExpenseSum) / prevExpenseSum) * 100;
      if (diff > 0) {
        insights.push({
          type: 'WARNING',
          message: `Vos dépenses ont augmenté de ${Math.round(diff)}% ce mois-ci par rapport au mois dernier.`
        });
      } else {
        insights.push({
          type: 'SUCCESS',
          message: `Vos dépenses ont diminué de ${Math.round(Math.abs(diff))}% ce mois-ci par rapport au mois dernier. Bon travail !`
        });
      }
    } else {
      insights.push({
        type: 'INFO',
        message: 'Pas assez d\'historique pour comparer avec le mois précédent.'
      });
    }

    // Category percentage insight (transport as example)
    const categoryTotals: Record<string, { name: string; amount: number }> = {};
    let totalSpent = 0;

    const allExpenses = await prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE' },
      include: { category: true }
    });

    allExpenses.forEach(t => {
      totalSpent += t.amount;
      if (t.categoryId && t.category) {
        if (!categoryTotals[t.categoryId]) {
          categoryTotals[t.categoryId] = { name: t.category.name, amount: 0 };
        }
        categoryTotals[t.categoryId].amount += t.amount;
      }
    });

    const sortedCats = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);
    if (sortedCats.length > 0 && totalSpent > 0) {
      const topCat = sortedCats[0];
      const percentage = Math.round((topCat.amount / totalSpent) * 100);
      insights.push({
        type: 'INFO',
        message: `La catégorie "${topCat.name}" représente ${percentage}% de vos dépenses totales (${topCat.amount.toLocaleString()} FCFA).`
      });
    }

    // Receivables insight
    if (totalReceivables > 0) {
      insights.push({
        type: 'INFO',
        message: `Vous devez récupérer ${totalReceivables.toLocaleString()} FCFA auprès de ${receivablesPeopleCount} personne(s).`
      });
    }

    // Savings rate insight
    const allIncomes = await prisma.transaction.findMany({
      where: { userId, type: 'INCOME' }
    });

    const totalIncome = allIncomes.reduce((sum, t) => sum + t.amount, 0);
    if (totalIncome > 0) {
      const savings = totalIncome - totalSpent;
      const rate = Math.round((savings / totalIncome) * 100);
      if (rate > 0) {
        insights.push({
          type: 'SUCCESS',
          message: `Votre taux d'épargne global est de ${rate}%.`
        });
      } else {
        insights.push({
          type: 'WARNING',
          message: `Attention! Vos dépenses dépassent vos revenus. Votre taux d'épargne est de ${rate}%.`
        });
      }
    }

    return res.json(insights);
  } catch (error: any) {
    return res.status(500).json({ error: 'Erreur lors de la génération des analyses: ' + error.message });
  }
});

export default router;
