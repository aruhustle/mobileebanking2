
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { VirtualAccount, TransactionType, TransactionStatus, User, LedgerDirection } from '../types';
import { db } from '../database';
import { executeTransaction } from '../ledgerEngine';
import { HDFCLogo } from '../App';

interface TransferProps {
  account: VirtualAccount | null;
}

const Transfer: React.FC<TransferProps> = ({ account: propAccount }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.UPI);
  const [payeeName, setPayeeName] = useState('');
  const [payeeDetail, setPayeeDetail] = useState(''); 
  const [ifsc, setIfsc] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [pin, setPin] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const navigate = useNavigate();

  const activeUser: User | null = React.useMemo(() => {
    const stored = sessionStorage.getItem('active_user');
    return stored ? JSON.parse(stored) : null;
  }, []);

  const currentAccount = React.useMemo(() => {
    if (propAccount) return propAccount;
    if (activeUser) {
      return db.getAccounts().find(a => a.userId === activeUser.id) || null;
    }
    return null;
  }, [propAccount, activeUser]);

  const recentPayees = useMemo(() => {
    if (!activeUser) return [];
    const ledger = db.getLedger().filter(e => e.userId === activeUser.id && e.direction === LedgerDirection.DEBIT);
    const seen = new Set();
    const payees: any[] = [];
    ledger.forEach(e => {
      const key = e.counterpartyDetails.id || e.counterpartyDetails.name;
      if (!seen.has(key)) {
        seen.add(key);
        payees.push({
          name: e.counterpartyDetails.name,
          id: e.counterpartyDetails.id,
          type: e.paymentMethod
        });
      }
    });
    return payees.slice(0, 5);
  }, [activeUser]);

  const handleInitiate = () => {
    if (isBlocked) {
      alert('Too many incorrect attempts. Please try again later.');
      return;
    }
    const num = parseFloat(amount);
    if (!currentAccount) return alert('Account not identified.');
    if (isNaN(num) || num <= 0) return alert('Enter a valid amount.');
    if (!payeeName.trim() || !payeeDetail.trim()) return alert('Fill payee details.');
    if (type === TransactionType.BANK_TRANSFER && !ifsc.trim()) return alert('Enter IFSC.');
    
    setShowPinScreen(true);
  };

  const handleFinalPay = async () => {
    if (isBlocked) return;

    if (!activeUser || pin !== activeUser.pin) {
      const newAttempts = pinAttempts + 1;
      setPinAttempts(newAttempts);
      setPin('');
      
      if (newAttempts >= 3) {
        setIsBlocked(true);
        alert('Too many incorrect attempts. Transaction blocked.');
      } else {
        alert('Incorrect UPI PIN. Please try again.');
      }
      return;
    }

    setProcessing(true);
    const tx = {
      id: Math.random().toString(36).substring(2, 11).toUpperCase(),
      senderAccountId: currentAccount!.id,
      receiverDetails: {
        upiId: type === TransactionType.UPI ? payeeDetail : undefined,
        accountNumber: type === TransactionType.BANK_TRANSFER ? payeeDetail : undefined,
        ifsc: type === TransactionType.BANK_TRANSFER ? ifsc : undefined,
        name: payeeName.trim(),
        type: type
      },
      amount: parseFloat(amount),
      note: note.trim() || undefined,
      status: TransactionStatus.INITIATED,
      timestamp: Date.now(),
      referenceId: 'HDFC' + Math.floor(10000000 + Math.random() * 90000000)
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      db.addTransaction(tx);
      const ledgerEntry = await executeTransaction(tx);
      navigate(`/receipt/${ledgerEntry.transactionId}`, { state: { entry: ledgerEntry }, replace: true });
    } catch (err: any) {
      alert(err.message || 'Transaction failed.');
      setProcessing(false);
      setShowPinScreen(false);
      setPin('');
    }
  };

  const selectPayee = (p: any) => {
    setPayeeName(p.name);
    setPayeeDetail(p.id || '');
    setType(p.type || TransactionType.UPI);
  };

  if (showPinScreen) {
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
        <header className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
             <HDFCLogo size="sm" />
             <span className="text-xs font-bold text-[#004c8f] uppercase tracking-widest">Enter UPI PIN</span>
          </div>
          <button onClick={() => setShowPinScreen(false)} className="text-slate-400">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
          </button>
        </header>
        
        <div className="p-8 text-center flex-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paying To</div>
          <div className="text-lg font-bold text-slate-800 mb-1">{payeeName}</div>
          <div className="text-[10px] font-mono text-slate-400 uppercase mb-8">{payeeDetail}</div>
          
          <div className="text-4xl font-black text-[#004c8f] mb-12">₹{parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="space-y-4 max-w-xs mx-auto">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verify with 4-digit PIN</label>
            <div className="flex justify-center gap-4">
              <input 
                type="password"
                maxLength={4}
                value={pin}
                autoFocus
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-4xl font-bold tracking-[0.5em] bg-slate-50 border-b-4 border-[#004c8f] py-4 outline-none rounded-t-2xl"
              />
            </div>
          </div>
        </div>

        <div className="p-8">
           <button 
             disabled={pin.length < 4 || processing}
             onClick={handleFinalPay}
             className="w-full py-5 bg-[#ed1c24] text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest"
           >
             {processing ? (
               <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : 'Confirm & Pay'}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 bg-[#F4F6F8] min-h-full pb-32">
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
        <button 
          onClick={() => setType(TransactionType.UPI)}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${type === TransactionType.UPI ? 'bg-[#00366B] text-white shadow-lg' : 'text-slate-400'}`}
        >
          UPI
        </button>
        <button 
          onClick={() => setType(TransactionType.BANK_TRANSFER)}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${type === TransactionType.BANK_TRANSFER ? 'bg-[#00366B] text-white shadow-lg' : 'text-slate-400'}`}
        >
          Bank Transfer
        </button>
      </div>

      {/* Recent Payees */}
      {recentPayees.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-slate-500 text-[10px] font-bold uppercase px-1 tracking-widest">Recent & Favorites</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {recentPayees.map((p, i) => (
              <button 
                key={i} 
                onClick={() => selectPayee(p)}
                className="flex flex-col items-center gap-2 min-w-[70px] active:scale-90 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#00366B] font-bold text-lg uppercase">
                  {p.name.charAt(0)}
                </div>
                <span className="text-[9px] font-bold text-slate-600 truncate w-14 text-center uppercase tracking-tighter">{p.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payee Details</label>
          <input 
            type="text"
            value={payeeName}
            onChange={(e) => setPayeeName(e.target.value)}
            placeholder="Recipient Full Name"
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-1 focus:ring-[#00366B] text-sm font-semibold border border-transparent focus:bg-white"
          />
          <input 
            type="text"
            value={payeeDetail}
            onChange={(e) => setPayeeDetail(e.target.value)}
            placeholder={type === TransactionType.UPI ? "UPI ID (e.g. name@hdfc)" : "Bank Account Number"}
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-1 focus:ring-[#00366B] text-sm font-semibold border border-transparent focus:bg-white"
          />
          {type === TransactionType.BANK_TRANSFER && (
            <input 
              type="text"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase())}
              placeholder="Bank IFSC Code"
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-1 focus:ring-[#00366B] text-sm font-semibold border border-transparent focus:bg-white"
            />
          )}
        </div>

        <div className="pt-2">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">₹</span>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 p-5 bg-slate-50 rounded-2xl outline-none focus:ring-1 focus:ring-[#00366B] text-3xl font-bold border border-transparent focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Note (Optional)</label>
          <input 
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's this for?"
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-1 focus:ring-[#00366B] text-sm font-medium border border-transparent focus:bg-white"
          />
        </div>
      </div>

      <button 
        onClick={handleInitiate}
        className="w-full py-5 bg-[#ed1c24] text-white rounded-2xl font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
      >
        Proceed to Pay
      </button>

      <div className="flex items-center gap-4 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl text-[#00366B]">
        <svg className="w-6 h-6 flex-shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-[10px] font-bold leading-relaxed opacity-80 uppercase tracking-tight">
          Your transaction is protected by bank-grade security. Do not share your PIN with anyone.
        </p>
      </div>
    </div>
  );
};

export default Transfer;
