
import { db } from './database';
import { LedgerEntry, Transaction, TransactionStatus } from './types';

export const calculateBalance = (accountId: string): number => {
  return db.getLedger()
    .filter(entry => entry.accountId === accountId)
    .reduce((sum, entry) => sum + entry.amount, 0);
};

export const executeTransaction = async (tx: Transaction) => {
  const senderBalance = calculateBalance(tx.senderAccountId);
  
  if (senderBalance < tx.amount) {
    db.updateTransactionStatus(tx.id, TransactionStatus.FAILED);
    throw new Error('Insufficient balance');
  }

  try {
    // 1. Debit Sender
    const debit: LedgerEntry = {
      id: Math.random().toString(36).substr(2, 9),
      accountId: tx.senderAccountId,
      transactionId: tx.id,
      amount: -tx.amount,
      timestamp: Date.now()
    };
    db.addLedgerEntry(debit);

    // 2. Credit Receiver (In a real system, this would happen at the receiver's bank/account)
    // For this simulation, we simulate the completion
    db.updateTransactionStatus(tx.id, TransactionStatus.SUCCESS);
    
    // Add success notification
    db.addNotification({
      id: Math.random().toString(36).substr(2, 9),
      userId: db.getAccounts().find(a => a.id === tx.senderAccountId)?.userId || '',
      title: 'Payment Successful',
      message: `Sent ₹${tx.amount.toLocaleString()} to ${tx.receiverDetails.name}`,
      type: 'SUCCESS',
      isRead: false,
      timestamp: Date.now()
    });

    return true;
  } catch (error) {
    db.updateTransactionStatus(tx.id, TransactionStatus.FAILED);
    throw error;
  }
};
