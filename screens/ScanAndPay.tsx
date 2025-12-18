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
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
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
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setErrorMsg("Camera access denied. Please check permissions.");
      }
    };
    if (scanning && !isProcessingFile) startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [scanning, isProcessingFile]);

  const handleQRDetected = (url: string) => {
    const result = parseUPIUrl(url);
    if (result.isValid) {
      setParsed(result);
      setAmount(result.amount || '');
      setNote(result.note || '');
      setScanning(false);
      setErrorMsg(null);
    } else {
      setErrorMsg(result.error || 'Invalid QR Code');
      // Briefly show error then resume scanning if it's camera
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleManualScan = () => {
    // Simulated test case: Google Pay QR
    const mockUrl = 'upi://pay?pa=7208180908@okaxis&pn=Armaan%20Thakkar&am=500.00&tn=Dinner&mc=0000&cu=INR';
    handleQRDetected(mockUrl);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setScanning(false);

    // Simulate OCR/QR extraction
    setTimeout(() => {
      const mockUrlFromImage = 'upi://pay?pa=paytmqr28100505@paytm&pn=Paytm%20Merchant&mc=5411';
      handleQRDetected(mockUrlFromImage);
      setIsProcessingFile(false);
    }, 1500);
  };

  const isAmountValid = React.useMemo(() => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  }, [amount]);

  const handleInitiatePayment = () => {
    if (!isAmountValid) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }
    setShowPinScreen(true);
  };

  const handleFinalPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser || pin !== activeUser.pin) {
      setErrorMsg('Incorrect UPI PIN. Please try again.');
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
      referenceId: parsed.transactionRef || ('HDFC' + Math.floor(10000000 + Math.random() * 90000000))
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      db.addTransaction(tx);
      const ledgerEntry = await executeTransaction(tx);
      navigate(`/receipt/${ledgerEntry.transactionId}`, { state: { entry: ledgerEntry }, replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment Failed');
      setProcessing(false);
      setShowPinScreen(false);
      setPin('');
    }
  };

  if (isProcessingFile) {
    return (
      <div className="h-full w-full bg-[#004c8f] flex flex-col items-center justify-center text-white px-8 animate-in fade-in duration-300">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold uppercase tracking-widest text-center">Reading QR from Gallery</h2>
        <p className="mt-2 text-white/60 text-xs font-bold uppercase tracking-tighter text-center">Analyzing image securely...</p>
      </div>
    );
  }

  // UPI PIN Screen
  if (showPinScreen && parsed) {
    return (
      <div className="fixed inset-0 z-[70] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
        <header className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-3">
             <HDFCLogo size="sm" />
             <span className="text-xs font-bold text-[#004c8f] uppercase tracking-widest">Secure PIN Authentication</span>
          </div>
          <button onClick={() => setShowPinScreen(false)} className="text-slate-400 p-2">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
          </button>
        </header>
        
        <div className="p-8 text-center flex-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paying To</div>
          <div className="text-lg font-bold text-slate-800 mb-1 leading-tight">{parsed.name}</div>
          <div className="text-[10px] font-mono text-slate-400 uppercase mb-8">{parsed.vpa}</div>
          
          <div className="text-4xl font-black text-[#004c8f] mb-12 flex items-center justify-center gap-1">
            <span className="text-2xl font-light opacity-40">₹</span>
            {parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          
          <div className="space-y-4 max-w-xs mx-auto">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">ENTER 4-DIGIT UPI PIN</label>
            <div className="flex justify-center gap-4">
              <input 
                type="password"
                maxLength={4}
                value={pin}
                autoFocus
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-4xl font-bold tracking-[0.5em] bg-slate-50 border-b-4 border-[#004c8f] py-4 outline-none rounded-t-2xl shadow-inner"
              />
            </div>
            {errorMsg && <p className="text-[#ed1c24] text-[10px] font-bold uppercase">{errorMsg}</p>}
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100">
           <button 
             disabled={pin.length < 4 || processing}
             onClick={handleFinalPay}
             className="w-full py-5 bg-[#ed1c24] text-white rounded-2xl font-bold text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-widest"
           >
             {processing ? (
               <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
             ) : 'Confirm Secure Payment'}
           </button>
        </div>
      </div>
    );
  }

  // Payee Review Screen
  if (!scanning && parsed && !isProcessingFile) {
    const isFixed = !!parsed.amount;
    return (
      <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 min-h-full bg-[#F4F6F8] pb-24">
        {/* Payee Identity Card */}
        <div className="text-center py-6 bg-white rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
          {/* PSP Badge */}
          <div className="absolute top-4 right-4 bg-[#004c8f]/10 text-[#004c8f] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter">
            {parsed.pspName}
          </div>
          
          <div className="w-20 h-20 bg-slate-50 text-[#004c8f] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-slate-100 shadow-inner">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <h2 className="text-xl font-black text-slate-800 leading-tight px-6">{parsed.name}</h2>
          <p className="text-slate-400 text-[10px] font-mono tracking-tighter uppercase mt-1">{parsed.vpa}</p>
          
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
            <div className={`w-1.5 h-1.5 rounded-full ${parsed.isMerchant ? 'bg-blue-500' : 'bg-green-500'}`}></div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              {parsed.isMerchant ? 'Merchant Verified' : 'Individual Payee'}
            </span>
          </div>
        </div>

        {/* Input Controls */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Amount to Pay (INR)</label>
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
            {isFixed && <p className="text-[10px] text-blue-600 font-bold uppercase mt-2 tracking-widest">Payee Requested Fixed Amount</p>}
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Add Remark</label>
            <input 
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's this for?"
              className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-1 focus:ring-[#004c8f] text-sm font-medium border border-transparent focus:bg-white transition-all"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-shake">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-xs font-bold text-red-700 uppercase tracking-tight">{errorMsg}</p>
          </div>
        )}

        <div className="space-y-4 pt-4">
          <button 
            disabled={!isAmountValid || processing}
            onClick={handleInitiatePayment}
            className="w-full py-5 bg-[#ed1c24] text-white rounded-2xl font-bold text-lg tracking-widest shadow-xl active:bg-red-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase"
          >
            Review & Authorize
          </button>
          
          <button 
            onClick={() => { setScanning(true); setParsed(null); setErrorMsg(null); }}
            className="w-full py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest active:text-slate-600"
          >
            Cancel & Rescan
          </button>
        </div>
      </div>
    );
  }

  // Camera Scanning View
  return (
    <div className="relative h-full bg-black overflow-hidden flex flex-col">
      <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover opacity-60" />
      
      {/* Scanner Overlay UI */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="w-72 h-72 border-2 border-white/10 rounded-[40px] flex items-center justify-center relative bg-black/10 backdrop-blur-[2px]">
          <div className="absolute -top-1 -left-1 w-16 h-16 border-t-4 border-l-4 border-white rounded-tl-[40px]" />
          <div className="absolute -top-1 -right-1 w-16 h-16 border-t-4 border-r-4 border-white rounded-tr-[40px]" />
          <div className="absolute -bottom-1 -left-1 w-16 h-16 border-b-4 border-l-4 border-white rounded-bl-[40px]" />
          <div className="absolute -bottom-1 -right-1 w-16 h-16 border-b-4 border-r-4 border-white rounded-br-[40px]" />
          
          {/* Animated Scanning Line */}
          <div className="w-[90%] h-[3px] bg-[#ed1c24] absolute top-1/2 -translate-y-1/2 animate-[bounce_3s_infinite] shadow-[0_0_20px_rgba(237,28,36,0.9)] rounded-full" />
        </div>
        
        <div className="mt-12 text-center px-8">
          <p className="text-white font-black text-xs uppercase tracking-[0.3em] opacity-90">Align UPI QR Code</p>
          <p className="mt-2 text-white/40 text-[9px] font-bold uppercase tracking-widest">Payments are 100% secure & encrypted</p>
        </div>
      </div>

      {/* Error Toast for Scanning */}
      {errorMsg && (
        <div className="absolute top-10 left-6 right-6 z-[60] animate-in slide-in-from-top duration-300">
           <div className="bg-red-600/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4">
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="text-[11px] font-black uppercase tracking-widest leading-tight">{errorMsg}</p>
           </div>
        </div>
      )}

      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* Bottom Actions */}
      <div className="absolute bottom-12 left-0 right-0 px-8 flex flex-col gap-4">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-4.5 bg-white text-[#004c8f] rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Select QR from Gallery
        </button>

        <div 
          onClick={handleManualScan}
          className="w-full py-6 text-center text-white/20 active:text-white/40 font-black text-[10px] uppercase tracking-[0.3em] cursor-pointer pointer-events-auto"
        >
          Tap to simulated scan (GPay)
        </div>
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full py-4 bg-white/10 backdrop-blur-xl text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:bg-white/20 transition-all border border-white/10"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default ScanAndPay;