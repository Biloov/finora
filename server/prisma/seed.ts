import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.financialGoal.deleteMany({});
  await prisma.budget.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.receivable.deleteMany({});
  await prisma.debt.deleteMany({});
  await prisma.person.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Create User
  const passwordHash = await bcrypt.hash('password', 10);
  const user = await prisma.user.create({
    data: {
      email: 'marc@finora.com',
      name: 'Marc',
      passwordHash,
      pinCode: '1234',
      avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0PWucA1lL9eNHWbJvgdjubL8wFtDhAut3tqfcNQlok84cLiCHv9g8tr1ZiRDCdvclrRJdnmBbbnO4SX2krsTMQ-_eeulTSmp3n8D439TT6490EMCJSDx4zhlWuxaEtuY4wM5j7rcfxT4Jp6i4aP7Y7pYIv7WTcLG-CIe5YbnXpBYl60DznSfXSjj5SrZ2ibfkyypfqMVQ1FjoXDxjPJVpXG2uAbeCftGyUnfdZSli-ZTkqcL3kB8Q'
    }
  });

  console.log(`Created user: ${user.name} (${user.email})`);

  // 3. Create Accounts
  const caisse = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Caisse',
      type: 'Caisse',
      initialBalance: 200000,
      currency: 'FCFA',
      description: 'Espèces physiques'
    }
  });

  const banque = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Banque',
      type: 'Banque',
      initialBalance: 1500000,
      currency: 'FCFA',
      description: 'Compte courant principal •••• 4092'
    }
  });

  const moov = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Moov',
      type: 'Mobile Money',
      initialBalance: 350000,
      currency: 'FCFA',
      description: 'Mobile Money Moov •••• 1289'
    }
  });

  const togocom = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Togocom',
      type: 'Mobile Money',
      initialBalance: 125000,
      currency: 'FCFA',
      description: 'Mobile Money T-Money •••• 8841'
    }
  });

  console.log('Accounts created.');

  // 4. Create categories
  // Fetch system categories or create them if we don't have them
  const alimCat = await prisma.category.create({
    data: { userId: user.id, name: 'Alimentation', icon: 'restaurant', color: '#EF4444', type: 'EXPENSE' }
  });
  const transCat = await prisma.category.create({
    data: { userId: user.id, name: 'Transport', icon: 'directions_car', color: '#F59E0B', type: 'EXPENSE' }
  });
  const logCat = await prisma.category.create({
    data: { userId: user.id, name: 'Logement', icon: 'home', color: '#3B82F6', type: 'EXPENSE' }
  });
  const santeCat = await prisma.category.create({
    data: { userId: user.id, name: 'Santé', icon: 'medical_services', color: '#10B981', type: 'EXPENSE' }
  });
  const servCat = await prisma.category.create({
    data: { userId: user.id, name: 'Services', icon: 'electrical_services', color: '#8B5CF6', type: 'EXPENSE' }
  });
  const commCat = await prisma.category.create({
    data: { userId: user.id, name: 'Commerce', icon: 'storefront', color: '#EC4899', type: 'BOTH' }
  });
  const salCat = await prisma.category.create({
    data: { userId: user.id, name: 'Salaire', icon: 'payments', color: '#10B981', type: 'INCOME' }
  });
  const autCat = await prisma.category.create({
    data: { userId: user.id, name: 'Autres', icon: 'more_horiz', color: '#6B7280', type: 'BOTH' }
  });

  console.log('Categories created.');

  // 5. Create Contacts (People)
  const abdou = await prisma.person.create({
    data: {
      userId: user.id,
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
      userId: user.id,
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
      userId: user.id,
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
      userId: user.id,
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
      userId: user.id,
      firstName: 'Entreprise X',
      lastName: '',
      phone: '+228 22 21 00 11',
      email: 'contact@entreprise-x.com',
      notes: 'Fournisseur de matériel',
      photoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=X'
    }
  });

  console.log('People contacts created.');

  // 6. Create Receivables (On me doit - Abdou: 300k, Moussa: 250k, Ali: 300k = 850k)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const recAbdou = await prisma.receivable.create({
    data: {
      userId: user.id,
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

  const recMoussa = await prisma.receivable.create({
    data: {
      userId: user.id,
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

  const recAli = await prisma.receivable.create({
    data: {
      userId: user.id,
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

  console.log('Receivables created.');

  // 7. Create Debts (Je dois - Mohamed: 200k, Entreprise X: 200k = 400k)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const debtMohamed = await prisma.debt.create({
    data: {
      userId: user.id,
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

  const debtX = await prisma.debt.create({
    data: {
      userId: user.id,
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

  console.log('Debts created.');

  // 8. Create Transactions to match historical activity
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);


  
  // Item 1: Achat marchandises (-150 000 FCFA, Caisse)
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: caisse.id,
      type: 'EXPENSE',
      amount: 150000,
      date: today,
      description: 'Achat marchandises',
      categoryId: commCat.id,
      personId: ali.id
    }
  });

  // Item 2: Vente (+350 000 FCFA, Banque)
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: banque.id,
      type: 'INCOME',
      amount: 350000,
      date: today,
      description: 'Vente',
      categoryId: commCat.id
    }
  });

  // Item 3: Frais de transport (-15 000 FCFA, Caisse)
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: caisse.id,
      type: 'EXPENSE',
      amount: 15000,
      date: yesterday,
      description: 'Frais de transport',
      categoryId: transCat.id
    }
  });

  // Item 4: Facture Électricité (-45 000 FCFA, Banque)
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: banque.id,
      type: 'EXPENSE',
      amount: 45000,
      date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2), // 2 days ago
      description: 'Facture Électricité',
      categoryId: servCat.id
    }
  });

  // We add some extra mock transactions to support nice graphs (Income vs Expense in the past month)
  // Let's add transactions for previous days
  for (let i = 5; i <= 25; i += 5) {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - i);
    
    // Past income (e.g. Salary, commerce)
    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: banque.id,
        type: 'INCOME',
        amount: 400000,
        date: pastDate,
        description: 'Versement salaire ou commerce',
        categoryId: salCat.id
      }
    });

    // Past expense (Alimentation, Logement)
    await prisma.transaction.create({
      data: {
        userId: user.id,
        accountId: caisse.id,
        type: 'EXPENSE',
        amount: 80000,
        date: pastDate,
        description: 'Achat nourriture / divers',
        categoryId: alimCat.id
      }
    });
  }

  console.log('Transactions created.');

  // 9. Create Savings Goals
  await prisma.financialGoal.create({
    data: {
      userId: user.id,
      name: 'Achat voiture',
      targetAmount: 8000000,
      savedAmount: 2500000,
      targetDate: new Date('2027-12-31'),
      icon: 'directions_car'
    }
  });

  console.log('Financial goals created.');

  // 10. Create Budgets
  await prisma.budget.create({
    data: {
      userId: user.id,
      categoryId: transCat.id,
      amount: 100000,
      spentAmount: 72000, // matches 72k / 100k
      period: 'MONTHLY'
    }
  });

  await prisma.budget.create({
    data: {
      userId: user.id,
      categoryId: alimCat.id,
      amount: 250000,
      spentAmount: 180000,
      period: 'MONTHLY'
    }
  });

  console.log('Budgets created.');

  // 11. Create Notifications
  await prisma.notification.create({
    data: {
      userId: user.id,
      message: 'Abdou doit te rembourser 100 000 FCFA demain.',
      type: 'INFO',
      isRead: false
    }
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      message: 'Ton budget transport atteint 90 %.',
      type: 'WARNING',
      isRead: false
    }
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      message: 'Ton objectif voiture vient d\'atteindre 30 %.',
      type: 'SUCCESS',
      isRead: false
    }
  });

  console.log('Notifications created.');

  // 12. Create Recurring Transaction templates
  await prisma.recurringTransaction.create({
    data: {
      userId: user.id,
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
      userId: user.id,
      accountId: banque.id,
      type: 'EXPENSE',
      amount: 150000,
      frequency: 'MONTHLY',
      startDate: new Date('2024-01-05'),
      categoryId: logCat.id,
      description: 'Loyer mensuel'
    }
  });

  console.log('Recurring templates created.');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
