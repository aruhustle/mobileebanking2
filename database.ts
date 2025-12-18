
import { User, VirtualAccount, Transaction, LedgerEntry, Notification, Bill } from './types';

const STORAGE_KEY = 'neobank_data_v2';

interface DatabaseSchema {
  users: User[];
  accounts: VirtualAccount[];
  transactions: Transaction[];
  ledger: LedgerEntry[];
  notifications: Notification[];
  bills: Bill[];
}

const DEMO_USER_ID = 'demo-armaan';
const DEMO_ACCOUNT_ID = 'demo-acc-nre';

const initialDb: DatabaseSchema = {
  users: [{
    id: DEMO_USER_ID,
    mobile: '9727180908',
    name: 'Armaan Thakkar',
    pin: '1809',
    kycStatus: 'VERIFIED',
    isBiometricEnabled: true,
    onboardedAt: 1700000000000
  }],
  accounts: [{
    id: DEMO_ACCOUNT_ID,
    userId: DEMO_USER_ID,
    accountNumber: '5010042728350',
    ifsc: 'HDFC0000001',
    type: 'SAVINGS',
    label: 'NRE Savings Account',
    isFrozen: false
  }],
  transactions: [],
  ledger: [{
    id: 'seed-ledger-1',
    accountId: DEMO_ACCOUNT_ID,
    transactionId: 'INITIAL_DEPOSIT',
    amount: 1427283.50,
    timestamp: Date.now() - 86400000 * 30 // 30 days ago
  }],
  notifications: [{
    id: 'notif-welcome',
    userId: DEMO_USER_ID,
    title: 'Welcome to HDFC Bank',
    message: 'Securely manage your finances with the official MobileBanking app.',
    type: 'SUCCESS',
    isRead: false,
    timestamp: Date.now()
  }],
  bills: [
    {
      id: 'bill-1',
      billerName: 'Reliance Energy',
      category: 'Electricity',
      amount: 4250.00,
      dueDate: Date.now() + 86400000 * 5, // 5 days from now
      status: 'DUE'
    },
    {
      id: 'bill-2',
      billerName: 'HDFC Credit Card',
      category: 'Credit Card',
      amount: 12840.50,
      dueDate: Date.now() + 86400000 * 2, // 2 days from now
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
        const parsed = JSON.parse(stored);
        this.data = {
          users: parsed.users || initialDb.users,
          accounts: parsed.accounts || initialDb.accounts,
          transactions: parsed.transactions || initialDb.transactions,
          ledger: parsed.ledger || initialDb.ledger,
          notifications: parsed.notifications || initialDb.notifications,
          bills: parsed.bills || initialDb.bills
        };
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
    if (!userId) return [];
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
