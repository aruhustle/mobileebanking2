import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LedgerEntry, LedgerDirection, TransactionStatus } from '../types';
import { HDFCLogo } from '../App';
import { db } from '../database';

const Receipt: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const entry = useMemo(() => {
    if (location.state?.entry) return location.state.entry as LedgerEntry;
    if (id) {
      return db.getLedger().find(e => e.transactionId === id || e.id === id);
    }
    return null;
  }, [location.state, id]);

  if (!entry) {
    return (
      <div className="p-12 text-center space-y-4 pt-[20vh]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        </div>
        <h3 className="text-slate-800 font-bold text-lg uppercase tracking-tight">Receipt unavailable</h3>
        <p className="text-slate-400 text-xs font-medium">The requested transaction details could not be verified.</p>
        <button onClick={() => navigate('/history')} className="text-[#004c8f] font-bold text-xs uppercase tracking-[0.2em] pt-8 border-b border-[#004c8f]/20">Back to History</button>
      </div>
    );
  }

  const isDebit = entry.direction === LedgerDirection.DEBIT;

  // Mask sensitive IDs
  const maskId = (val?: string) => {
    if (!val) return 'N/A';
    if (val.includes('@')) {
      const [u, d] = val.split('@');
      return `${u.slice(0, 2)}***@${d}`;
    }
    return `XXXXXX${val.slice(-4)}`;
  };

  // Derive PSP Name from UPI ID
  const getPspName = (val?: string) => {
    if (!val || !val.includes('@')) return 'HDFC Bank';
    const domain = val.split('@')[1].toLowerCase();
    if (domain.includes('okaxis')) return 'Axis Bank';
    if (domain.includes('okicici')) return 'ICICI Bank';
    if (domain.includes('oksbi')) return 'SBI';
    if (domain.includes('paytm')) return 'Paytm';
    if (domain.includes('ybl') || domain.includes('ibl')) return 'PhonePe';
    return 'Other Bank';
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(entry.upiRefId || entry.transactionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareText = `Transaction Successful! Paid ₹${Math.abs(entry.amount).toLocaleString()} to ${entry.counterpartyDetails.name}. Ref: ${entry.upiRefId || entry.transactionId}`;
    if (navigator.share) {
      navigator.share({ title: 'HDFC Transaction Receipt', text: shareText, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Copied to clipboard');
    }
  };

  return (
    <div className="min-h-full bg-white animate-in fade-in duration-500 overflow-y-auto pb-24 no-scrollbar">
      {/* Receipt Card Container */}
      <div className="max-w-md mx-auto print:p-0">
        
        {/* Header Section */}
        <div className="flex flex-col items-center pt-10 pb-6 px-6">
          <HDFCLogo size="lg" className="mb-6" />
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${entry.status === 'SUCCESS' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Transaction {entry.status === 'SUCCESS' ? 'Successful' : 'Failed'}</h1>
          </div>
          <div className={`text-4xl font-black tracking-tight mt-4 ${isDebit ? 'text-[#ed1c24]' : 'text-green-600'}`}>
            {isDebit ? '–' : '+'}₹{Math.abs(entry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">
            {entry.paymentMethod} • {new Date(entry.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>

        {/* Recipient Details Section */}
        <div className="mx-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Recipient Details</div>
              <div className="text-base font-bold text-slate-800">{entry.counterpartyDetails.name}</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">{maskId(entry.counterpartyDetails.id)}</div>
            </div>
            <div className="text-right">
               <div className="text-[9px] font-bold text-white bg-[#004c8f] px-2 py-0.5 rounded-full uppercase tracking-tighter">
                 {getPspName(entry.counterpartyDetails.id)}
               </div>
            </div>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="px-8 space-y-6">
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <ReceiptItem label="UTR Number" value={entry.utrNumber || 'N/A'} />
            <ReceiptItem label="Reference ID" value={entry.upiRefId || entry.transactionId} />
            <ReceiptItem label="Payment Date" value={new Date(entry.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} />
            <ReceiptItem label="Time" value={new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()} />
            <ReceiptItem label="From Account" value={maskId('5010042728350')} />
            <ReceiptItem label="Paid Via" value={entry.paymentMethod} />
          </div>

          <div className="h-px bg-slate-100 my-4" />

          {/* Balance Breakdown Section */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Balance Summary</div>
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Opening Balance</span>
                <span>₹{entry.balanceBefore.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className={`flex justify-between text-xs font-bold ${isDebit ? 'text-[#ed1c24]' : 'text-green-600'}`}>
                <span>Transaction Amount</span>
                <span>{isDebit ? '–' : '+'}₹{Math.abs(entry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="h-px bg-slate-200" />
              <div className="flex justify-between text-sm font-black text-slate-800">
                <span>Closing Balance</span>
                <span>₹{entry.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-12 text-center">
           <p className="text-[9px] text-slate-300 leading-relaxed font-bold uppercase tracking-[0.1em]">
            This is a computer generated digital receipt and does not require a physical signature.
            Payments are processed securely via HDFC Bank's multi-layered gateway.
          </p>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-3 print:hidden shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
        <button 
          onClick={handleCopyId}
          className="flex-1 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          {copied ? 'Copied!' : 'Copy ID'}
        </button>
        <button 
          onClick={() => window.print()}
          className="flex-1 py-3.5 bg-white border border-[#004c8f] rounded-xl text-[#004c8f] font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
        >
          Download
        </button>
        <button 
          onClick={handleShare}
          className="flex-1 py-3.5 bg-[#004c8f] rounded-xl text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
        >
          Share
        </button>
      </div>
    </div>
  );
};

const ReceiptItem = ({ label, value }: { label: string; value: string }) => (
  <div className="overflow-hidden">
    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</div>
    <div className="text-[13px] font-bold text-slate-700 truncate leading-tight">{value}</div>
  </div>
);

export default Receipt;
