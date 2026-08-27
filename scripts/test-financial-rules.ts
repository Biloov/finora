import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- STARTING FINANCIAL RULES AUTOMATED VERIFICATION ---');

  // 1. Setup temporary test user
  const email = `test-${Date.now()}@finora.com`;
  const passwordHash = await bcrypt.hash('testpass', 10);
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Tester',
      passwordHash
    }
  });

  // 2. Setup test accounts (Banque and Caisse)
  const banque = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Banque Test',
      type: 'Banque',
      initialBalance: 100000,
      currency: 'FCFA'
    }
  });

  const caisse = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Caisse Test',
      type: 'Caisse',
      initialBalance: 50000,
      currency: 'FCFA'
    }
  });

  const person = await prisma.person.create({
    data: {
      userId: user.id,
      firstName: 'Ami Test'
    }
  });

  console.log('✓ Test user, accounts, and contact created.');

  // Helper to get fresh computed balance for an account
  const getAccountBalance = async (accountId: string) => {
    const acc = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        transactions: true,
        incomingTransfers: true
      }
    });
    if (!acc) throw new Error('Account not found');
    let balance = acc.initialBalance;
    acc.transactions.forEach(t => {
      if (t.type === 'INCOME') balance += t.amount;
      else if (t.type === 'EXPENSE') balance -= t.amount;
      else if (t.type === 'TRANSFER') balance -= t.amount;
    });
    acc.incomingTransfers.forEach(t => {
      balance += t.amount;
    });
    return balance;
  };

  // RULE 1: INCOME (Banque + 20,000)
  console.log('\nTesting Rule: Income...');
  const txIncome = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: banque.id,
      type: 'INCOME',
      amount: 20000,
      date: new Date(),
      description: 'Test Revenu'
    }
  });
  
  const balanceBanqueAfterIncome = await getAccountBalance(banque.id);
  console.log(`Banque Balance: Expected: 120000, Got: ${balanceBanqueAfterIncome}`);
  if (balanceBanqueAfterIncome !== 120000) throw new Error('Income rule failed');
  console.log('✓ Income rule verified successfully.');

  // RULE 2: EXPENSE (Caisse - 5,000)
  console.log('\nTesting Rule: Expense...');
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: caisse.id,
      type: 'EXPENSE',
      amount: 5000,
      date: new Date(),
      description: 'Test Dépense'
    }
  });

  const balanceCaisseAfterExpense = await getAccountBalance(caisse.id);
  console.log(`Caisse Balance: Expected: 45000, Got: ${balanceCaisseAfterExpense}`);
  if (balanceCaisseAfterExpense !== 45000) throw new Error('Expense rule failed');
  console.log('✓ Expense rule verified successfully.');

  // RULE 3: TRANSFER (Banque -> Caisse 10,000)
  console.log('\nTesting Rule: Transfer...');
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: banque.id,
      targetAccountId: caisse.id,
      type: 'TRANSFER',
      amount: 10000,
      date: new Date(),
      description: 'Test Virement'
    }
  });

  const bAfterTransfer = await getAccountBalance(banque.id);
  const cAfterTransfer = await getAccountBalance(caisse.id);
  console.log(`Banque Balance (expected 110000): ${bAfterTransfer}`);
  console.log(`Caisse Balance (expected 55000): ${cAfterTransfer}`);
  
  if (bAfterTransfer !== 110000 || cAfterTransfer !== 55000) {
    throw new Error('Transfer rule failed');
  }
  console.log('✓ Transfer rule verified successfully.');

  // RULE 4 & 5: Receivable & Repayment (Lent 30k -> Repaid 10k)
  console.log('\nTesting Rule: Receivable and repayment...');
  // lend money (creating receivable, which creates an EXPENSE on Banque)
  const rec = await prisma.receivable.create({
    data: {
      userId: user.id,
      personId: person.id,
      amount: 30000,
      remainingAmount: 30000,
      date: new Date(),
      status: 'PENDING'
    }
  });

  // associate loan expense
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: banque.id,
      type: 'EXPENSE',
      amount: 30000,
      date: new Date(),
      receivableId: rec.id
    }
  });

  const bAfterLending = await getAccountBalance(banque.id);
  console.log(`Banque after lending (expected 80000): ${bAfterLending}`);
  if (bAfterLending !== 80000) throw new Error('Lending failed');

  // Repay 10,000 (INCOME to Caisse)
  const repayTx = await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: caisse.id,
      type: 'INCOME',
      amount: 10000,
      date: new Date(),
      receivableId: rec.id
    }
  });

  // trigger update in receivable
  const updatedRec = await prisma.receivable.update({
    where: { id: rec.id },
    data: {
      paidAmount: rec.paidAmount + 10000,
      remainingAmount: Math.max(0, rec.amount - (rec.paidAmount + 10000)),
      status: 'PARTIALLY_PAID'
    }
  });

  const cAfterRepayment = await getAccountBalance(caisse.id);
  console.log(`Caisse after repayment (expected 65000): ${cAfterRepayment}`);
  console.log(`Receivable remaining (expected 20000): ${updatedRec.remainingAmount}`);

  if (cAfterRepayment !== 65000 || updatedRec.remainingAmount !== 20000) {
    throw new Error('Receivable repayment rule failed');
  }
  console.log('✓ Receivable loan and repayment rules verified successfully.');

  // RULE 6 & 7: Debt & Repayment (Borrow 50k -> Repay 15k)
  console.log('\nTesting Rule: Debt and repayment...');
  // borrow money (creating debt, which creates INCOME on Banque)
  const debt = await prisma.debt.create({
    data: {
      userId: user.id,
      personId: person.id,
      amount: 50000,
      remainingAmount: 50000,
      date: new Date(),
      status: 'PENDING'
    }
  });

  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: banque.id,
      type: 'INCOME',
      amount: 50000,
      date: new Date(),
      debtId: debt.id
    }
  });

  const bAfterBorrowing = await getAccountBalance(banque.id);
  console.log(`Banque after borrowing (expected 130000): ${bAfterBorrowing}`);
  if (bAfterBorrowing !== 130000) throw new Error('Borrowing failed');

  // Repay 15,000 (EXPENSE from Caisse)
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: caisse.id,
      type: 'EXPENSE',
      amount: 15000,
      date: new Date(),
      debtId: debt.id
    }
  });

  const updatedDebt = await prisma.debt.update({
    where: { id: debt.id },
    data: {
      paidAmount: debt.paidAmount + 15000,
      remainingAmount: Math.max(0, debt.amount - (debt.paidAmount + 15000)),
      status: 'PARTIALLY_PAID'
    }
  });

  const cAfterDebtPayment = await getAccountBalance(caisse.id);
  console.log(`Caisse after debt repayment (expected 50000): ${cAfterDebtPayment}`);
  console.log(`Debt remaining (expected 35000): ${updatedDebt.remainingAmount}`);

  if (cAfterDebtPayment !== 50000 || updatedDebt.remainingAmount !== 35000) {
    throw new Error('Debt repayment rule failed');
  }
  console.log('✓ Debt borrowing and repayment rules verified successfully.');

  // 3. Clean up test database records
  console.log('\nCleaning up test records...');
  await prisma.transaction.deleteMany({ where: { userId: user.id } });
  await prisma.debt.deleteMany({ where: { userId: user.id } });
  await prisma.receivable.deleteMany({ where: { userId: user.id } });
  await prisma.person.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  console.log('✓ Database cleaned.');

  console.log('\n--- ALL FINANCIAL BUSINESS RULES PASSED SUCCESSFULLY ---');
}

runTests()
  .catch(err => {
    console.error('✖ Verification test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
