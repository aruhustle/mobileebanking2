
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { VirtualAccount, TransactionType, TransactionStatus, Transaction, User } from '../types';
import { parseUPIUrl, ParsedUPI } from '../qrService';
import { db } from '../database';
import { executeTransaction } from '../ledgerEngine';
import { HDFCLogo } from '../App';

interface ScanAndPayProps {
  account: VirtualAccount | null;
}

const ScanAndPay: React.FC<ScanAndPayProps> = ({ account: propAccount }) => {
  const [scanning, setScanning] = useState(true);
  const [parsed, setParsed] = useState<ParsedUPI | null>(null);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [pin, setPin] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access denied:', err);
      }
    };
    if (scanning && !isProcessingFile) startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [scanning, isProcessingFile]);

  const handleManualScan = () => {
    const mockUrl = 'upi://pay?pa=merchant@hdfcbank&pn=HDFC%20Cafe&am=150.00&tn=Coffee';
    const result = parseUPIUrl(mockUrl);
    setParsed(result);
    if (result.amount) {
      setAmount(result.amount);
    } else {
      setAmount('');
    }
    setScanning(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setScanning(false);

    // Simulate QR code extraction from the image
    // In a real app, you'd use a library like jsQR or ZXing here.
    setTimeout(() => {
      // For simulation, we'll "extract" a predefined UPI URL from the selected image
      const mockUrlFromImage = 'upi://pay?pa=gallery_merchant@hdfc&pn=Gallery%20Payee&am=500.00&tn=Gallery%20Payment';
      const result = parseUPIUrl(mockUrlFromImage);
      
      setParsed(result);
      if (result.amount) {
        setAmount(result.amount);
      } else {
        setAmount('');
      }
      setIsProcessingFile(false);
    }, 1500);
  };

  const isAmountValid = React.useMemo(() => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  }, [amount]);

  const handleInitiatePayment = () => {
    if (!isAmountValid) {
      alert('Please enter a valid amount.');
      return;
    }
    setShowPinScreen(true);
  };

  const handleFinalPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || pin !== activeUser.pin) {
      alert('Incorrect UPI PIN. Please try again.');
      setPin('');
      return;
    }

    if (!currentAccount || !parsed || !amount) return;
    
    setProcessing(true);
    const tx: Transaction = {
      id: Math.random().toString(36).substring(2, 11).toUpperCase(),
      senderAccountId: currentAccount.id,
      receiverDetails: {
        upiId: parsed.vpa,
        name: parsed.name,
        type: TransactionType.UPI
      },
      amount: parseFloat(amount),
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
      alert(err.message || 'Payment Failed');
      setProcessing(false);
      setShowPinScreen(false);
      setPin('');
    }
  };

  if (isProcessingFile) {
    return (
      <div className="h-full w-full bg-[#004c8f] flex flex-col items-center justify-center text-white px-8 animate-in fade-in duration-300">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold uppercase tracking-widest text-center">Reading QR from Image</h2>
        <p className="mt-2 text-white/60 text-xs font-bold uppercase tracking-tighter text-center">Processing details securely...</p>
      </div>
    );
  }

  if (showPinScreen && parsed) {
    return (
      <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
        <header className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
             <HDFCLogo size="sm" />
             <span className="text-xs font-bold text-[#004c8f] uppercase tracking-widest">Verify Secure Pay</span>
          </div>
          <button onClick={() => setShowPinScreen(false)} className="text-slate-400 p-2">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
          </button>
        </header>
        
        <div className="p-8 text-center flex-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paying To</div>
          <div className="text-lg font-bold text-slate-800 mb-1">{parsed.name}</div>
          <div className="text-[10px] font-mono text-slate-400 uppercase mb-8">{parsed.vpa}</div>
          
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
             ) : 'Confirm & Authorize'}
           </button>
        </div>
      </div>
    );
  }

  if (!scanning && parsed && !isProcessingFile) {
    const isFixed = !!parsed.amount;
    return (
      <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-full bg-[#F4F6F8]">
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-[#004c8f]/5 text-[#004c8f] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#004c8f]/10 shadow-inner">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">{parsed.name}</h2>
          <p className="text-slate-400 text-xs font-mono tracking-tighter uppercase">{parsed.vpa}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Amount to Pay</label>
            <div className={`flex items-center gap-2 border-b-2 transition-colors pb-2 ${isFixed ? 'border-slate-100' : 'border-[#004c8f]/20 focus-within:border-[#004c8f]'}`}>
              <span className="text-3xl font-light text-slate-300">₹</span>
              <input 
                type="number"
                value={amount}
                readOnly={isFixed}
                autoFocus={!isFixed}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full text-4xl font-bold outline-none text-slate-800 bg-transparent ${isFixed ? 'opacity-60' : ''}`}
                placeholder="0"
              />
            </div>
            {isFixed && <p className="text-[10px] text-green-600 font-bold uppercase mt-2 tracking-widest">Merchant Requested Amount</p>}
          </div>
          
          {parsed.note && (
             <div className="pt-2 border-t border-slate-50">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Note from Merchant</label>
                <p className="text-sm font-medium text-slate-600 italic">"{parsed.note}"</p>
             </div>
          )}
        </div>

        <div className="space-y-4 pt-4">
          <button 
            disabled={!isAmountValid || processing}
            onClick={handleInitiatePayment}
            className="w-full py-5 bg-[#ed1c24] text-white rounded-2xl font-bold text-lg tracking-widest shadow-xl active:bg-red-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase"
          >
            Review & Pay
          </button>
          
          <button 
            onClick={() => setScanning(true)}
            className="w-full py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest active:text-slate-600"
          >
            Rescan QR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-black overflow-hidden flex flex-col">
      <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover opacity-50" />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="w-64 h-64 border-2 border-white/20 rounded-3xl flex items-center justify-center relative bg-black/10">
          <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-xl" />
          <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-xl" />
          <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-xl" />
          <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-xl" />
          <div className="w-full h-[2px] bg-[#ed1c24] absolute top-1/2 -translate-y-1/2 animate-[bounce_2s_infinite] shadow-[0_0_15px_rgba(237,28,36,0.8)]" />
        </div>
        <p className="mt-10 text-white font-bold text-xs uppercase tracking-[0.2em] opacity-80">Scan any UPI QR Code</p>
      </div>

      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      <div className="absolute bottom-12 left-0 right-0 px-8 flex flex-col gap-4">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4 bg-white text-[#004c8f] rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Upload from Gallery
        </button>

        <div 
          onClick={handleManualScan}
          className="w-full py-6 text-center text-white/10 active:text-white/20 font-bold text-[10px] uppercase tracking-widest cursor-pointer pointer-events-auto"
        >
          Tap to auto-detect QR (Test)
        </div>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full py-3 bg-white/10 backdrop-blur-lg text-white rounded-xl font-bold text-[10px] uppercase tracking-widest active:bg-white/20 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ScanAndPay;
