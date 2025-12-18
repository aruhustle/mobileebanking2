
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VirtualAccount, TransactionType, TransactionStatus } from '../types';
import { db } from '../database';
import { executeTransaction } from '../ledgerEngine';

interface TransferProps {
  account: VirtualAccount | null;
}

const Transfer: React.FC<TransferProps> = ({ account }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.UPI);
  const [payeeName, setPayeeName] = useState('');
  const [payeeDetail, setPayeeDetail] = useState(''); // UPI ID or Acc Num
  const [ifsc, setIfsc] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const handleTransfer = async () => {
    if (!account || !amount || !payeeName) return;

    setProcessing(true);
    const tx = {
      id: Math.random().toString(36).substr(2, 9),
      senderAccountId: account.id,
      receiverDetails: {
        upiId: type === TransactionType.UPI ? payeeDetail : undefined,
        accountNumber: type === TransactionType.BANK_TRANSFER ? payeeDetail : undefined,
        ifsc: type === TransactionType.BANK_TRANSFER ? ifsc : undefined,
        name: payeeName,
        type: type
      },
      amount: parseFloat(amount),
      note: note,
      status: TransactionStatus.INITIATED,
      timestamp: Date.now(),
      referenceId: 'TXN' + Math.floor(Math.random() * 100000000)
    };

    db.addTransaction(tx);

    try {
      await executeTransaction(tx);
      alert('Transfer Successful!');
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Transfer Failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
        <button 
          onClick={() => setType(TransactionType.UPI)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${type === TransactionType.UPI ? 'bg-[#00366B] text-white shadow-md' : 'text-slate-500'}`}
        >
          UPI ID
        </button>
        <button 
          onClick={() => setType(TransactionType.BANK_TRANSFER)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${type === TransactionType.BANK_TRANSFER ? 'bg-[#00366B] text-white shadow-md' : 'text-slate-500'}`}
        >
          Bank Account
        </button>
      </div>

      <div className="space-y-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payee Name</label>
          <input 
            type="text"
            value={payeeName}
            onChange={(e) => setPayeeName(e.target.value)}
            placeholder="Recipient Full Name"
            className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-1 focus:ring-[#00366B] text-sm font-semibold"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
            {type === TransactionType.UPI ? 'UPI ID' : 'Account Number'}
          </label>
          <input 
            type="text"
            value={payeeDetail}
            onChange={(e) => setPayeeDetail(e.target.value)}
            placeholder={type === TransactionType.UPI ? "example@upi" : "0000 0000 0000"}
            className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-1 focus:ring-[#00366B] text-sm font-semibold"
          />
        </div>

        {type === TransactionType.BANK_TRANSFER && (
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">IFSC Code</label>
            <input 
              type="text"
              value={ifsc}
              onChange={(e) => setIfsc(e.target.value.toUpperCase())}
              placeholder="HDFC0001234"
              className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-1 focus:ring-[#00366B] text-sm font-semibold"
            />
          </div>
        )}

        <div className="h-px bg-slate-100 my-2" />

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount to Transfer</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-300">₹</span>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 p-3 bg-slate-50 rounded-xl outline-none focus:ring-1 focus:ring-[#00366B] text-2xl font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Remark (Optional)</label>
          <input 
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Gift, Rent, etc."
            className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-1 focus:ring-[#00366B] text-sm"
          />
        </div>
      </div>

      <button 
        disabled={processing || !amount || !payeeName || !payeeDetail}
        onClick={handleTransfer}
        className="w-full py-4 bg-[#E41B23] text-white rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-3"
      >
        {processing ? (
          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        ) : `Send Money`}
      </button>

      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl text-blue-700">
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-[10px] leading-relaxed">
          Payments are instant and irreversible. Please verify payee details before proceeding. By continuing, you agree to NeoBank's T&Cs.
        </p>
      </div>
    </div>
  );
};

export default Transfer;
