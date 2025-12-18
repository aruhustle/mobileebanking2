
import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LedgerEntry, LedgerDirection, TransactionStatus } from '../types';
import { HDFCLogo } from '../App';
import { db } from '../database';

const Receipt: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Attempt to get entry from navigation state first, fallback to DB lookup for deep-linking
  const entry = useMemo(() => {
    if (location.state?.entry) return location.state.entry as LedgerEntry;
    if (id) {
      return db.getLedger().find(e => e.transactionId === id || e.id === id);
    }
    return null;
  }, [location.state, id]);

  if (!entry) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        </div>
        <h3 className="text-slate-800 font-bold">Receipt unavailable</h3>
        <p className="text-slate-400 text-xs">The requested transaction details could not be found.</p>
        <button onClick={() => navigate('/history')} className="text-[#00366B] font-bold text-xs uppercase tracking-widest pt-4">Back to History</button>
      </div>
    );
  }

  const isDebit = entry.direction === LedgerDirection.DEBIT;
  const statusColor = entry.status === TransactionStatus.SUCCESS ? 'text-green-600' : 'text-red-600';

  const handleDownload = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'HDFC Bank Transaction Receipt',
        text: `Transaction of ₹${Math.abs(entry.amount).toLocaleString()} to ${entry.counterpartyDetails.name} was successful. Ref: ${entry.transactionId}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      alert('Transaction details copied to clipboard');
    }
  };

  return (
    <div className="min-h-full bg-[#F4F6F8] p-4 safe-top animate-in fade-in duration-500 pb-20">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 relative print:shadow-none print:border-none">
        
        {/* HDFC Bank Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
          <div className="scale-[6] rotate-[-15deg]">
             <HDFCLogo size="xl" />
          </div>
        </div>

        {/* Receipt Header */}
        <div className="bg-[#00366B] p-8 text-center text-white relative z-10">
          <div className="flex justify-between items-center mb-6">
            <HDFCLogo size="sm" />
            <div className="text-[10px] font-bold tracking-widest uppercase opacity-60">e-Receipt</div>
          </div>
          
          <div className="flex justify-center mb-4">
            <div className={`w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg`}>
              {isDebit ? (
                <svg className="w-8 h-8 text-[#E41B23]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </div>
          </div>

          <h2 className="text-lg font-bold uppercase tracking-[0.2em] opacity-90">Transaction {entry.status}</h2>
          
          <div className="text-4xl font-black tracking-tighter mt-4 flex items-center justify-center gap-1">
            <span className="text-2xl font-light opacity-60">₹</span>
            {isDebit ? '–' : '+'}{Math.abs(entry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          
          <p className="mt-3 text-white/50 text-[10px] font-bold tracking-widest uppercase">
            {entry.direction} • {entry.paymentMethod}
          </p>
        </div>

        {/* Receipt Details */}
        <div className="p-8 space-y-6 relative z-10 bg-white">
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            <ReceiptField label="Beneficiary" value={entry.counterpartyDetails.name} />
            <ReceiptField label="Recipient ID" value={entry.counterpartyDetails.id || 'N/A'} />
            <ReceiptField label="Transaction ID" value={entry.transactionId} />
            <ReceiptField label="Reference No." value={entry.id.toUpperCase()} />
            <ReceiptField label="Date" value={new Date(entry.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
            <ReceiptField label="Time" value={new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} />
          </div>

          <div className="h-px bg-slate-100 my-4" />

          {/* Ledger Parity Verification */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opening Balance</span>
              <span className="text-xs font-bold text-slate-700">₹{entry.balanceBefore.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Amount</span>
              <span className={`text-xs font-bold ${isDebit ? 'text-[#E41B23]' : 'text-green-600'}`}>
                {isDebit ? '-' : '+'}₹{Math.abs(entry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="h-px bg-slate-200" />
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Closing Balance</span>
              <span className="text-sm font-black text-[#00366B]">₹{entry.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="pt-4">
            <div className="flex items-center justify-center gap-2 mb-4">
               <div className="h-px bg-slate-100 flex-1" />
               <span className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em]">Official Receipt</span>
               <div className="h-px bg-slate-100 flex-1" />
            </div>
            <p className="text-[9px] text-slate-400 leading-relaxed font-medium text-center">
              This is a digitally generated transaction confirmation. HDFC Bank will never ask for your confidential information like OTP, PIN or CVV. Always verify recipient details before making payments.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 relative z-10 print:hidden">
          <button 
            onClick={handleDownload}
            className="flex-1 py-3.5 bg-white border border-slate-200 rounded-xl text-[#00366B] font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            PDF
          </button>
          <button 
            onClick={handleShare}
            className="flex-1 py-3.5 bg-[#00366B] rounded-xl text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            Share
          </button>
        </div>
      </div>
      
      <div className="flex flex-col items-center mt-6 gap-4 print:hidden">
        <button 
          onClick={() => {
             const txId = entry.transactionId;
             navigator.clipboard.writeText(txId);
             alert('Transaction ID copied');
          }}
          className="text-slate-400 font-bold text-[9px] uppercase tracking-widest hover:text-slate-600"
        >
          Copy Transaction ID: <span className="text-slate-500">{entry.transactionId}</span>
        </button>
        <button 
          onClick={() => navigate('/history')}
          className="px-8 py-3 bg-slate-200 text-slate-600 rounded-full font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all"
        >
          Back to Statement
        </button>
      </div>
    </div>
  );
};

const ReceiptField = ({ label, value }: { label: string; value: string }) => (
  <div className="overflow-hidden">
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">{label}</div>
    <div className="text-[13px] font-bold text-slate-800 break-words leading-tight">{value}</div>
  </div>
);

export default Receipt;
