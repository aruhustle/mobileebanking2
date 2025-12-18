
import React, { useState, useMemo, useEffect } from 'react';
import { User, VirtualAccount } from '../types';
import { calculateBalance } from '../ledgerEngine';
import { db } from '../database';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: User | null;
  account: VirtualAccount | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user: propUser, account: propAccount }) => {
  const [showBalance, setShowBalance] = useState(false);
  const [localUser, setLocalUser] = useState<User | null>(propUser);
  const [localAccount, setLocalAccount] = useState<VirtualAccount | null>(propAccount);
  const navigate = useNavigate();

  useEffect(() => {
    // Sync props or fetch from session/db
    if (!localUser) {
      const stored = sessionStorage.getItem('active_user');
      if (stored) setLocalUser(JSON.parse(stored));
    }
  }, [propUser]);

  useEffect(() => {
    if (localUser && !localAccount) {
      const accounts = db.getAccounts().filter(a => a.userId === localUser.id);
      if (accounts.length > 0) setLocalAccount(accounts[0]);
    }
  }, [localUser, localAccount]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const balance = useMemo(() => {
    return localAccount ? calculateBalance(localAccount.id) : 0;
  }, [localAccount]);

  const recentTransactions = useMemo(() => {
    return db.getTransactions().slice(0, 3);
  }, []);

  const upcomingBills = useMemo(() => {
    return db.getBills().filter(b => b.status === 'DUE').slice(0, 2);
  }, []);

  if (!localUser || !localAccount) {
    return (
      <div className="p-4 space-y-6">
        <div className="h-40 bg-slate-200 rounded-2xl shimmer"></div>
        <div className="grid grid-cols-4 gap-4">
           {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-200 rounded-xl shimmer"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 bg-[#F4F6F8] min-h-full">
      {/* Header Greeting */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{greeting}</h2>
          <h1 className="text-xl font-bold text-[#00366B]">{localUser.name.split(' ')[0]}</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">Secure Session</span>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-[#00366B] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden ring-1 ring-white/10 group active:scale-[0.99] transition-transform duration-200">
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="text-white/70 text-[10px] font-bold uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                {localAccount.label}
                <svg className="w-3 h-3 text-white/40" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              </div>
              <div className="text-[11px] font-mono opacity-60 tracking-tighter">XX-{localAccount.accountNumber.slice(-4)}</div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowBalance(!showBalance); }}
              className="p-2 bg-white/10 rounded-full active:bg-white/20 transition-all"
            >
              {showBalance ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
              )}
            </button>
          </div>
          <div className="flex items-end gap-2 mb-8">
            <span className="text-xl font-light opacity-60 pb-1">₹</span>
            <div className="text-4xl font-bold tracking-tight">
              {showBalance ? balance.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '••••••'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button 
               onClick={() => navigate('/transfer')}
               className="bg-white text-[#00366B] font-bold py-3.5 rounded-xl active:scale-[0.97] transition-all text-xs uppercase tracking-wider"
            >
              Money Transfer
            </button>
            <button 
              onClick={() => navigate('/history')}
              className="bg-[#E41B23] text-white font-bold py-3.5 rounded-xl active:scale-[0.97] transition-all text-xs uppercase tracking-wider shadow-lg"
            >
              View Statement
            </button>
          </div>
        </div>
        <div className="absolute right-[-10%] top-[-10%] w-48 h-48 bg-white/[0.03] rounded-full" />
        <div className="absolute left-[-5%] bottom-[-5%] w-32 h-32 bg-white/[0.02] rounded-full" />
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-4 gap-y-6">
        <QuickAction icon="qrcode" label="Scan & Pay" onClick={() => navigate('/scan')} />
        <QuickAction icon="user" label="UPI ID" onClick={() => navigate('/transfer')} />
        <QuickAction icon="bank" label="Bank Trf" onClick={() => navigate('/transfer')} />
        <QuickAction icon="receipt" label="Bills" />
        <QuickAction icon="phone" label="Recharge" />
        <QuickAction icon="credit" label="Cards" />
        <QuickAction icon="invest" label="Mutual Funds" onClick={() => navigate('/invest')} />
        <QuickAction icon="dots" label="More" />
      </div>

      {/* Bills */}
      {upcomingBills.length > 0 && (
        <div className="animate-in fade-in duration-700 delay-200">
          <h3 className="text-slate-500 text-[10px] font-bold uppercase mb-3 px-1 tracking-widest">Upcoming Payments</h3>
          <div className="space-y-3">
            {upcomingBills.map(bill => (
              <div key={bill.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm active:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                    {bill.billerName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{bill.billerName}</div>
                    <div className="text-[10px] text-slate-400 font-medium">Due in {Math.round((bill.dueDate - Date.now()) / 86400000)} days</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-900">₹{bill.amount.toLocaleString()}</div>
                  <button className="text-[10px] font-bold text-[#E41B23] uppercase tracking-tighter border border-[#E41B23]/20 px-2 py-0.5 rounded mt-1">Pay</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      <div className="animate-in fade-in duration-700 delay-300">
        <div className="flex justify-between items-center mb-3 px-1">
          <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Last Transactions</h3>
          <button onClick={() => navigate('/history')} className="text-[#00366B] text-[10px] font-bold uppercase tracking-tighter">See All</button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx) => (
              <div key={tx.id} className="p-4 flex justify-between items-center" onClick={() => navigate('/history')}>
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${tx.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-[#00366B]'}`}>
                    {tx.receiverDetails.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800">{tx.receiverDetails.name}</div>
                    <div className="text-slate-400 text-[10px]">{new Date(tx.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold text-sm ${tx.amount < 0 ? 'text-slate-900' : 'text-green-600'}`}>
                    {tx.amount < 0 ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                  </div>
                  <div className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${tx.status === 'SUCCESS' ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.status}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center">
              <p className="text-slate-400 text-[11px] font-medium">No recent transactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const QuickAction: React.FC<{ icon: string; label: string; onClick?: () => void }> = ({ icon, label, onClick }) => {
  const icons: Record<string, React.ReactElement> = {
    qrcode: <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v-4m6 0h2m-6 0h-2m10 5V7a2 2 0 00-2-2h-3m-6 0H7a2 2 0 00-2 2v3m14 6v3a2 2 0 01-2 2h-3m-6 0H7a2 2 0 01-2-2v-3" />,
    user: <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    bank: <path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />,
    receipt: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
    phone: <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />,
    credit: <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
    invest: <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />,
    dots: <path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />,
  };

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform group">
      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-200 group-active:bg-slate-50 transition-colors">
        <svg className="w-5 h-5 text-[#00366B]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          {icons[icon]}
        </svg>
      </div>
      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter text-center">{label}</span>
    </button>
  );
};

export default Dashboard;
