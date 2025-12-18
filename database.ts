
import { User, VirtualAccount, Transaction, LedgerEntry, Notification, Bill, LedgerDirection, TransactionStatus, TransactionType } from './types';

const STORAGE_KEY = 'hdfc_bank_prod_v2'; // Bump version for new schema

interface DatabaseSchema {
  users: User[];
  accounts: VirtualAccount[];
  transactions: Transaction[];
  ledger: LedgerEntry[];
  notifications: Notification[];
  bills: Bill[];
}

const CUSTOMER_ID = '82719405';
const ACCOUNT_ID = 'acc-5010042728350';

const initialDb: DatabaseSchema = {
  users: [{
    id: CUSTOMER_ID,
    mobile: '9727180908',
    name: 'Armaan Thakkar',
    pin: '1809',
    kycStatus: 'VERIFIED',
    isBiometricEnabled: true,
    onboardedAt: 1700000000000
  }],
  accounts: [{
    id: ACCOUNT_ID,
    userId: CUSTOMER_ID,
    accountNumber: '5010042728350',
    ifsc: 'HDFC0000001',
    type: 'SAVINGS',
    label: 'Savings Account',
    isFrozen: false
  }],
  transactions: [],
  ledger: [{
    id: 'ledger-seed-1',
    transactionId: 'DEPOSIT_INIT',
    userId: CUSTOMER_ID,
    accountId: ACCOUNT_ID,
    amount: 1427283.50, // Positive = Credit
    direction: LedgerDirection.CREDIT,
    balanceBefore: 0,
    balanceAfter: 1427283.50,
    timestamp: Date.now() - 86400000 * 30,
    paymentMethod: TransactionType.BANK_TRANSFER,
    counterpartyDetails: { name: 'Initial Deposit' },
    status: TransactionStatus.SUCCESS
  }],
  notifications: [{
    id: 'notif-welcome',
    userId: CUSTOMER_ID,
    title: 'Welcome to MobileBanking',
    message: 'Access your HDFC Bank account securely and conveniently on the go.',
    type: 'SUCCESS',
    isRead: false,
    timestamp: Date.now()
  }],
  bills: [
    {
      id: 'bill-adani',
      billerName: 'Adani Electricity',
      category: 'Utilities',
      amount: 4250.00,
      dueDate: Date.now() + 86400000 * 5,
      status: 'DUE'
    },
    {
      id: 'bill-cc',
      billerName: 'HDFC Bank Credit Card',
      category: 'Credit Card',
      amount: 12840.50,
      dueDate: Date.now() + 86400000 * 2,
      status: 'DUE'
    }
  ]
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.data = JSON.parse(stored);
      } catch (e) {
        this.data = initialDb;
      }
    } else {
      this.data = initialDb;
      this.persist();
    }
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  getUsers() { return this.data.users; }
  getUserByMobile(mobile: string) { return this.data.users.find(u => u.mobile === mobile); }
  addUser(user: User) { this.data.users.push(user); this.persist(); }
  
  getAccounts() { return this.data.accounts; }
  addAccount(acc: VirtualAccount) { this.data.accounts.push(acc); this.persist(); }

  getTransactions() { return this.data.transactions; }
  addTransaction(tx: Transaction) { 
    this.data.transactions.unshift(tx); 
    this.persist(); 
  }
  updateTransactionStatus(id: string, status: any) {
    const tx = this.data.transactions.find(t => t.id === id);
    if (tx) tx.status = status;
    this.persist();
  }

  getLedger() { return this.data.ledger; }
  addLedgerEntry(entry: LedgerEntry) { this.data.ledger.push(entry); this.persist(); }

  getNotifications(userId: string) {
    return this.data.notifications.filter(n => n.userId === userId);
  }
  addNotification(n: Notification) {
    this.data.notifications.unshift(n);
    this.persist();
  }
  markNotificationRead(id: string) {
    const n = this.data.notifications.find(item => item.id === id);
    if (n) n.isRead = true;
    this.persist();
  }

  getBills() { return this.data.bills; }
}

export const db = new Database();
