import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { LedgerEntry, LedgerDirection, TransactionStatus } from '../types';
import { HDFCLogo } from '../App';
import { db } from '../database';

const Receipt: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

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

  const handleDownload = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'HDFC Bank Transaction Receipt',
        text: `Transaction of ₹${Math.abs(entry.amount).toLocaleString()} to ${entry.counterpartyDetails.name} successful. Ref: ${entry.upiRefId}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      alert('Transaction details copied to clipboard');
    }
  };

  return (
    <div className="min-h-full bg-[#F4F6F8] p-4 safe-top animate-in fade-in duration-500 pb-20">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 relative print:shadow-none print:border-none">
        
        {/* Subtle Watermark Logo */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
          <div className="scale-[5] rotate-[-20deg]">
             <HDFCLogo size="xl" />
          </div>
        </div>

        {/* Receipt Header */}
        <div className="bg-[#004c8f] p-8 text-center text-white relative z-10 overflow-hidden">
          {/* Decorative Pattern Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 20L20 0H10L0 10M20 20V10L10 20'/%3E%3C/g%3E%3C/svg%3E")` }}></div>
          
          <div className="flex justify-between items-center mb-6">
            <HDFCLogo size="sm" color="white" />
            <div className="text-[10px] font-extrabold tracking-[0.3em] uppercase opacity-70">e-Transaction Receipt</div>
          </div>
          
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/10`}>
              {isDebit ? (
                <svg className="w-10 h-10 text-[#ed1c24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </div>
          </div>

          <h2 className="text-xl font-black uppercase tracking-widest opacity-95">Payment {entry.status}</h2>
          
          <div className="text-5xl font-black tracking-tighter mt-4 flex items-center justify-center gap-1">
            <span className="text-2xl font-light opacity-60">₹</span>
            {isDebit ? '–' : '+'}{Math.abs(entry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          
          <p className="mt-4 text-white/50 text-[10px] font-bold tracking-[0.2em] uppercase">
            {entry.direction} • {entry.paymentMethod}
          </p>
        </div>

        {/* Receipt Details Body */}
        <div className="p-8 space-y-8 relative z-10 bg-white">
          <div className="space-y-6">
            <ReceiptField label="Beneficiary Name" value={entry.counterpartyDetails.name} large />
            <div className="grid grid-cols-2 gap-x-6 gap-y-6 border-t border-slate-50 pt-6">
              <ReceiptField label="Recipient ID" value={entry.counterpartyDetails.id || 'N/A'} />
              <ReceiptField label="Transaction ID" value={entry.transactionId} />
              <ReceiptField label="UPI Ref ID" value={entry.upiRefId || 'N/A'} />
              <ReceiptField label="UTR Number" value={entry.utrNumber || 'N/A'} />
              <ReceiptField label="Payment Date" value={new Date(entry.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
              <ReceiptField label="Time" value={new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} />
            </div>
          </div>

          <div className="pt-4 text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
               <div className="h-px bg-slate-100 flex-1" />
               <HDFCLogo size="sm" className="opacity-40" color="#cbd5e1" />
               <div className="h-px bg-slate-100 flex-1" />
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest px-4">
              Authorized by HDFC Bank MobileBanking. This receipt is digitally generated for your records.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 relative z-10 print:hidden">
          <button 
            onClick={handleDownload}
            className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl text-[#004c8f] font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download
          </button>
          <button 
            onClick={handleShare}
            className="flex-1 py-4 bg-[#004c8f] rounded-2xl text-white font-bold text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            Share
          </button>
        </div>
      </div>
      
      <div className="flex flex-col items-center mt-8 gap-4 print:hidden">
        <button 
          onClick={() => navigate('/history')}
          className="px-10 py-4 bg-white text-[#004c8f] border border-slate-200 rounded-full font-black text-[11px] uppercase tracking-[0.2em] active:scale-95 transition-all shadow-sm"
        >
          View Statement
        </button>
      </div>
    </div>
  );
};

const ReceiptField = ({ label, value, large }: { label: string; value: string; large?: boolean }) => (
  <div className="flex flex-col text-left">
    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</div>
    <div className={`${large ? 'text-xl' : 'text-sm'} font-bold text-slate-800 break-words leading-tight tracking-tight`}>{value}</div>
  </div>
);

export default Receipt;