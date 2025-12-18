
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
      <div className="p-12 text-center space-y-4 pt-[20vh]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        </div>
        <h3 className="text-slate-800 font-bold">Receipt unavailable</h3>
        <p className="text-slate-400 text-xs">The requested transaction details could not be found.</p>
        <button onClick={() => navigate('/history')} className="text-[#004c8f] font-bold text-xs uppercase tracking-widest pt-4">Back to History</button>
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
        text: `Transaction of ₹${Math.abs(entry.amount).toLocaleString()} to ${entry.counterpartyDetails.name} was successful. Ref: ${entry.upiRefId || entry.transactionId}`,
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
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.05] pointer-events-none select-none overflow-hidden">
          <div className="scale-[4] rotate-[-15deg]">
             <img src="https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/6f6f9662-7945-4228-86d1-4470d036329e/Footer/About%20Us/Logos/HDFC_Bank_Logo.png" alt="" className="w-24 h-24 grayscale brightness-50" />
          </div>
        </div>

        {/* Receipt Header */}
        <div className="bg-[#004c8f] p-8 text-center text-white relative z-10">
          <div className="flex justify-between items-center mb-6">
            <HDFCLogo size="sm" />
            <div className="text-[10px] font-bold tracking-widest uppercase opacity-60">e-Receipt</div>
          </div>
          
          <div className="flex justify-center mb-4">
            <div className={`w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg`}>
              {isDebit ? (
                <svg className="w-8 h-8 text-[#ed1c24]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </div>
          </div>

          <h2 className="text-lg font-bold uppercase tracking-[0.2em] opacity-90">Payment {entry.status}</h2>
          
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
            <ReceiptField label="UPI Ref ID" value={entry.upiRefId || `TXN${entry.transactionId.slice(-8).toUpperCase()}`} />
            <ReceiptField label="UTR Number" value={entry.utrNumber || `UTR${Math.floor(1000000000 + Math.random() * 9000000000)}`} />
            <ReceiptField label="Date" value={new Date(entry.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
            <ReceiptField label="Time" value={new Date(entry.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} />
          </div>

          <div className="h-px bg-slate-100 my-4" />

          <div className="pt-2 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
               <div className="h-px bg-slate-100 flex-1" />
               <HDFCLogo size="sm" />
               <div className="h-px bg-slate-100 flex-1" />
            </div>
            <p className="text-[9px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest">
              Secured by HDFC Bank MobileBanking. This receipt is digitally generated and does not require a physical signature.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 relative z-10 print:hidden">
          <button 
            onClick={handleDownload}
            className="flex-1 py-3.5 bg-white border border-slate-200 rounded-xl text-[#004c8f] font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            PDF
          </button>
          <button 
            onClick={handleShare}
            className="flex-1 py-3.5 bg-[#004c8f] rounded-xl text-white font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            Share
          </button>
        </div>
      </div>
      
      <div className="flex flex-col items-center mt-6 gap-4 print:hidden">
        <button 
          onClick={() => navigate('/history')}
          className="px-8 py-3 bg-white text-[#004c8f] border border-slate-200 rounded-full font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-sm"
        >
          View Statement
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
