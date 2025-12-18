
export enum TransactionStatus {
  INITIATED = 'INITIATED',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED'
}

export enum TransactionType {
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
  BILL_PAY = 'BILL_PAY',
  RECHARGE = 'RECHARGE',
  SELF_TRANSFER = 'SELF_TRANSFER'
}

export enum LedgerDirection {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT'
}

export interface User {
  id: string;
  mobile: string;
  name: string;
  pin: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isBiometricEnabled: boolean;
  onboardedAt: number;
}

export interface VirtualAccount {
  id: string;
  userId: string;
  accountNumber: string;
  ifsc: string;
  type: 'SAVINGS' | 'WALLET' | 'INVESTMENT';
  label: string;
  isFrozen: boolean;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  userId: string;
  accountId: string;
  amount: number; // Signed value: Negative for Debit, Positive for Credit
  direction: LedgerDirection;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: number;
  paymentMethod: TransactionType;
  counterpartyDetails: {
    name: string;
    id?: string; // UPI ID or Account Number
  };
  status: TransactionStatus;
}

export interface Transaction {
  id: string;
  senderAccountId: string;
  receiverDetails: {
    upiId?: string;
    accountNumber?: string;
    ifsc?: string;
    name: string;
    type: TransactionType;
  };
  amount: number;
  note?: string;
  status: TransactionStatus;
  timestamp: number;
  referenceId: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'ALERT' | 'ERROR';
  isRead: boolean;
  timestamp: number;
}

export interface Bill {
  id: string;
  billerName: string;
  category: string;
  amount: number;
  dueDate: number;
  status: 'PAID' | 'DUE' | 'OVERDUE';
}
