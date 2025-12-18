
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VirtualAccount, TransactionType, TransactionStatus } from '../types';
import { db } from '../database';
import { executeTransaction } from '../ledgerEngine';

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
  const navigate = useNavigate();

  // Robustly handle missing account in props
  const currentAccount = React.useMemo(() => {
    if (propAccount) return propAccount;
    const user = JSON.parse(sessionStorage.getItem('active_user') || 'null');
    if (user) {
      return db.getAccounts().find(a => a.userId === user.id) || null;
    }
    return null;
  }, [propAccount]);

  const handleTransfer = async () => {
    const transferAmount = parseFloat(amount);
    
    // Safety checks
    if (!currentAccount) return alert('Source account not identified.');
    if (isNaN(transferAmount) || transferAmount <= 0) return alert('Please enter a valid amount.');
    if (!payeeName.trim()) return alert('Please enter payee name.');
    if (!payeeDetail.trim()) return alert('Please enter recipient details.');
    if (type === TransactionType.BANK_TRANSFER && !ifsc.trim()) return alert('Please enter IFSC code.');

    setProcessing(true);
    
    const tx = {
      id: Math.random().toString(36).substring(2, 11).toUpperCase(),
      senderAccountId: currentAccount.id,
      receiverDetails: {
        upiId: type === TransactionType.UPI ? payeeDetail : undefined,
        accountNumber: type === TransactionType.BANK_TRANSFER ? payeeDetail : undefined,
        ifsc: type === TransactionType.BANK_TRANSFER ? ifsc : undefined,
        name: payeeName.trim(),
        type: type
      },
      amount: transferAmount,
      note: note.trim() || undefined, // NOTE IS OPTIONAL
      status: TransactionStatus.INITIATED,
      timestamp: Date.now(),
      referenceId: 'HDFC' + Math.floor(10000000 + Math.random() * 90000000)
    };

    try {
      // Small artificial delay for realism
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      db.addTransaction(tx);
      const ledgerEntry = await executeTransaction(tx);
      
      // Navigate to detailed receipt
      navigate('/receipt', { state: { entry: ledgerEntry } });
    } catch (err: any) {
      alert(err.message || 'Transaction could not be completed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 bg-[#F4F6F8] min-h-full">
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
        <button 
          onClick={() => setType(TransactionType.UPI)}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${type === TransactionType.UPI ? 'bg-[#00366B] text-white shadow-lg' : 'text-slate-400'}`}
        >
          UPI Transfer
        </button>
        <button 
          onClick={() => setType(TransactionType.BANK_TRANSFER)}
          className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${type === TransactionType.BANK_TRANSFER ? 'bg-[#00366B] text-white shadow-lg' : 'text-slate-400'}`}
        >
          Bank Account
        </button>
      </div>

      <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payee Details</label>
          <input 
            type="text"
            value={payeeName}
            onChange={(e) => setPayeeName(e.target.value)}
            placeholder="Full Name"
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-1 focus:ring-[#00366B] text-sm font-semibold"
          />
          <input 
            type="text"
            value={payeeDetail}
            onChange={(e) => setPayeeDetail(e.target.value)}
            placeholder={type === TransactionType.UPI ? "UPI ID (e.g. armaan@hdfc)" : "Account Number"}
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-1 focus:ring-[#00366B] text-sm font-semibold"
          />
          {type === TransactionType.BANK_TRANSFER && (
            <input 
              type="text"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase())}
              placeholder="IFSC Code"
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-1 focus:ring-[#00366B] text-sm font-semibold"
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
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Remark (Optional)</label>
          <input 
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What's this for?"
            className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-1 focus:ring-[#00366B] text-sm"
          />
        </div>
      </div>

      <button 
        disabled={processing}
        onClick={handleTransfer}
        className="w-full py-5 bg-[#E41B23] text-white rounded-2xl font-bold text-lg shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest"
      >
        {processing ? (
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : `Pay ₹${amount || '0'}`}
      </button>

      <div className="flex items-center gap-4 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl text-[#00366B]">
        <svg className="w-6 h-6 flex-shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-[11px] font-medium leading-relaxed opacity-80 uppercase tracking-tight">
          Payments are secured with bank-grade encryption. Please verify payee details carefully.
        </p>
      </div>
    </div>
  );
};

export default Transfer;
