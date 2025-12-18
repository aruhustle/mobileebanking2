
import { db } from './database';
import { LedgerEntry, Transaction, TransactionStatus, LedgerDirection, TransactionType } from './types';

/**
 * Account balance must be calculated as:
 * SUM(all ledger.amount entries for that account)
 */
export const calculateBalance = (accountId: string): number => {
  return db.getLedger()
    .filter(entry => entry.accountId === accountId && entry.status === TransactionStatus.SUCCESS)
    .reduce((sum, entry) => sum + entry.amount, 0);
};

const generateUpiRefId = () => `TXN${Math.floor(1000000000 + Math.random() * 9000000000)}`;
const generateUtrNumber = () => `UTR${Math.floor(1000000000 + Math.random() * 9000000000)}`;

export const executeTransaction = async (tx: Transaction) => {
  const balanceBefore = calculateBalance(tx.senderAccountId);
  
  // Prevent transactions if balance_before < transaction_amount (for debits)
  if (balanceBefore < tx.amount) {
    db.updateTransactionStatus(tx.id, TransactionStatus.FAILED);
    throw new Error('Insufficient balance');
  }

  try {
    const timestamp = Date.now();
    const userId = db.getAccounts().find(a => a.id === tx.senderAccountId)?.userId || '';

    // Generate specific IDs requested
    const upiRefId = generateUpiRefId();
    const utrNumber = generateUtrNumber();

    // Create Immutable Ledger Entry
    const debitEntry: LedgerEntry = {
      id: 'led-' + Math.random().toString(36).substr(2, 9),
      transactionId: tx.id,
      userId: userId,
      accountId: tx.senderAccountId,
      amount: -tx.amount, // MONEY SENT = NEGATIVE
      direction: LedgerDirection.DEBIT,
      balanceBefore: balanceBefore,
      balanceAfter: balanceBefore - tx.amount,
      timestamp: timestamp,
      paymentMethod: tx.receiverDetails.type,
      upiRefId,
      utrNumber,
      counterpartyDetails: {
        name: tx.receiverDetails.name,
        id: tx.receiverDetails.upiId || tx.receiverDetails.accountNumber
      },
      status: TransactionStatus.SUCCESS
    };

    // Rollback check: If balance_after != balance_before + amount, fatal error
    if (debitEntry.balanceAfter !== debitEntry.balanceBefore + debitEntry.amount) {
      throw new Error('Ledger parity mismatch. Transaction aborted.');
    }

    db.addLedgerEntry(debitEntry);
    db.updateTransactionStatus(tx.id, TransactionStatus.SUCCESS);
    
    // Add success notification
    db.addNotification({
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      userId: userId,
      title: 'Payment Successful',
      message: `₹${tx.amount.toLocaleString()} ${debitEntry.direction} to ${tx.receiverDetails.name}. Ref: ${upiRefId}`,
      type: 'SUCCESS',
      isRead: false,
      timestamp: timestamp
    });

    return debitEntry;
  } catch (error) {
    db.updateTransactionStatus(tx.id, TransactionStatus.FAILED);
    throw error;
  }
};
