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
  const [showSummary, setShowSummary] = useState(false);
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

  const isAmountValid = useMemo(() => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  }, [amount]);

  const handleInitiate = () => {
    if (isBlocked) {
      alert('Too many incorrect attempts. Please try again later.');
      return;
    }
    if (!isAmountValid) return alert('Enter a valid amount.');
    if (!currentAccount) return alert('Account not identified.');
    if (!payeeName.trim() || !payeeDetail.trim()) return alert('Fill payee details.');
    if (type === TransactionType.BANK_TRANSFER && !ifsc.trim()) return alert('Enter IFSC.');
    
    setShowSummary(true);
  };

  const handleConfirmSummary = () => {
    setShowSummary(false);
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
        alert('Too many incorrect attempts. Transaction blocked for security.');
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
      // Ensure redirect to receipt screen
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
      <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
        <header className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
             <HDFCLogo size="sm" />
             <span className="text-xs font-bold text-[#004c8f] uppercase tracking-widest">Verify Secure PIN</span>
          </div>
          <button onClick={() => setShowPinScreen(false)} className="text-slate-400 p-2">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
          </button>
        </header>
        
        <div className="p-8 text-center flex-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paying To</div>
          <div className="text-lg font-bold text-slate-800 mb-1">{payeeName}</div>
          <div className="text-[10px] font-mono text-slate-400 uppercase mb-8">{payeeDetail}</div>
          
          <div className="text-4xl font-black text-[#004c8f] mb-12">₹{parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="space-y-4 max-w-xs mx-auto">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Re-enter UPI PIN to confirm</label>
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
      {/* Header Tabs */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
        <button 
          onClick={() => setType(TransactionType.UPI)}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${type === TransactionType.UPI ? 'bg-[#00366B] text-white shadow-lg' : 'text-slate-400'}`}
        >
          UPI ID
        </button>
        <button 
          onClick={() => setType(TransactionType.BANK_TRANSFER)}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${type === TransactionType.BANK_TRANSFER ? 'bg-[#00366B] text-white shadow-lg' : 'text-slate-400'}`}
        >
          Bank Account
        </button>
      </div>

      {/* Recent & Favorite Payees */}
      {recentPayees.length > 0 && (
        <div className="space-y-3 animate-in fade-in duration-500">
          <h3 className="text-slate-500 text-[10px] font-bold uppercase px-1 tracking-widest">Recent & Favorites</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {recentPayees.map((p, i) => (
              <button 
                key={i} 
                onClick={() => selectPayee(p)}
                className="flex flex-col items-center gap-2 min-w-[72px] active:scale-90 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#00366B] font-bold text-lg uppercase group-active:bg-slate-50">
                  {p.name.charAt(0)}
                </div>
                <span className="text-[9px] font-bold text-slate-600 truncate w-16 text-center uppercase tracking-tighter leading-tight">{p.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Fields */}
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
            placeholder="e.g. For Rent, Coffee, etc."
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-1 focus:ring-[#00366B] text-sm font-medium border border-transparent focus:bg-white"
          />
        </div>
      </div>

      <button 
        disabled={!isAmountValid}
        onClick={handleInitiate}
        className="w-full py-5 bg-[#ed1c24] text-white rounded-2xl font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-50"
      >
        Continue to Summary
      </button>

      {/* Transaction Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-300 px-4">
          <div className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Transaction Summary</h3>
              <button onClick={() => setShowSummary(false)} className="text-slate-400 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Transfer Amount</div>
                <div className="text-5xl font-black text-slate-900 tracking-tighter">₹{parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <SummaryItem label="Payee Name" value={payeeName} />
                <SummaryItem label={type === TransactionType.UPI ? "UPI ID" : "Account Number"} value={payeeDetail} />
                {type === TransactionType.BANK_TRANSFER && <SummaryItem label="Bank IFSC" value={ifsc} />}
                {note && <SummaryItem label="Note" value={note} italic />}
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl flex items-start gap-3 border border-blue-100/50">
                 <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 <p className="text-[10px] font-medium text-blue-700 leading-normal">Please verify the beneficiary details carefully. Payments once initiated cannot be reversed easily.</p>
              </div>

              <button 
                onClick={handleConfirmSummary}
                className="w-full py-5 bg-[#ed1c24] text-white rounded-2xl font-bold text-base tracking-widest shadow-xl active:scale-[0.98] transition-all uppercase"
              >
                Proceed to Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SummaryItem = ({ label, value, italic }: { label: string; value: string; italic?: boolean }) => (
  <div className="flex justify-between items-start">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    <span className={`text-sm font-bold text-slate-800 text-right max-w-[200px] break-all ${italic ? 'italic font-medium' : ''}`}>{value}</span>
  </div>
);

export default Transfer;