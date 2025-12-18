
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

const generateUpiRefId = () => `HDFC${Math.floor(1000000000 + Math.random() * 9000000000)}`;
const generateUtrNumber = () => `${Math.floor(100000000000 + Math.random() * 900000000000)}`; // 12-digit numeric UTR

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

    // Generate specific IDs once per transaction
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

    // Parity check
    if (Math.abs(debitEntry.balanceAfter - (debitEntry.balanceBefore + debitEntry.amount)) > 0.01) {
      throw new Error('Ledger parity mismatch. Transaction aborted.');
    }

    db.addLedgerEntry(debitEntry);
    db.updateTransactionStatus(tx.id, TransactionStatus.SUCCESS);
    
    // Update the transaction object itself to persist the generated IDs if needed
    // In this simulation, we rely on the LedgerEntry for receipt details.

    // Add success notification
    db.addNotification({
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      userId: userId,
      title: 'Payment Successful',
      message: `₹${tx.amount.toLocaleString()} sent to ${tx.receiverDetails.name}. UTR: ${utrNumber}`,
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
