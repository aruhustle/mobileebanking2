
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { VirtualAccount, TransactionType, TransactionStatus, Transaction } from '../types';
import { parseUPIUrl, ParsedUPI } from '../qrService';
import { db } from '../database';
import { executeTransaction } from '../ledgerEngine';

interface ScanAndPayProps {
  account: VirtualAccount | null;
}

const ScanAndPay: React.FC<ScanAndPayProps> = ({ account }) => {
  const [scanning, setScanning] = useState(true);
  const [parsed, setParsed] = useState<ParsedUPI | null>(null);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successTx, setSuccessTx] = useState<Transaction | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

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
    if (scanning && !successTx) startCamera();
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [scanning, successTx]);

  const handleSimulateScan = () => {
    const mockUrl = 'upi://pay?pa=merchant@hdfcbank&pn=HDFC%20Cafe&am=150.00&tn=Coffee';
    const result = parseUPIUrl(mockUrl);
    setParsed(result);
    setAmount(result.amount || '');
    setScanning(false);
  };

  const handlePay = async () => {
    if (!account || !parsed || !amount) return;
    
    setProcessing(true);
    const tx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      senderAccountId: account.id,
      receiverDetails: {
        upiId: parsed.vpa,
        name: parsed.name,
        type: TransactionType.UPI
      },
      amount: parseFloat(amount),
      status: TransactionStatus.INITIATED,
      timestamp: Date.now(),
      referenceId: 'REF' + Math.floor(Math.random() * 100000000)
    };

    try {
      db.addTransaction(tx);
      await executeTransaction(tx);
      setSuccessTx(tx);
    } catch (err: any) {
      alert(err.message || 'Payment Failed');
    } finally {
      setProcessing(false);
    }
  };

  if (successTx) {
    return (
      <div className="flex-1 flex flex-col bg-white animate-in zoom-in-95 duration-500 min-h-full">
        <div className="flex-1 p-8 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 animate-in slide-in-from-bottom-4 duration-700">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Payment Successful</h2>
          <p className="text-slate-400 text-sm mt-1">Ref ID: {successTx.referenceId}</p>

          <div className="w-full mt-10 space-y-4 border-t border-slate-50 pt-10">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">To</span>
              <span className="text-slate-800 font-bold">{successTx.receiverDetails.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Amount</span>
              <span className="text-slate-800 font-bold text-lg">₹{successTx.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-medium">Date & Time</span>
              <span className="text-slate-800 font-bold">{new Date(successTx.timestamp).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-50 space-y-3">
          <button onClick={() => navigate('/dashboard')} className="w-full py-4 bg-[#00366B] text-white font-bold rounded-xl active:scale-95 transition-transform uppercase tracking-widest text-xs">Back to Home</button>
          <button className="w-full py-4 text-[#00366B] font-bold text-xs uppercase tracking-widest">Share Receipt</button>
        </div>
      </div>
    );
  }

  if (!scanning && parsed) {
    return (
      <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-[#00366B]/5 text-[#00366B] rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-[#00366B]/10">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800">{parsed.name}</h2>
          <p className="text-slate-400 text-[11px] font-mono tracking-tighter uppercase">{parsed.vpa}</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Amount to Pay</label>
            <div className="flex items-center gap-2 border-b-2 border-[#00366B]/20 pb-2 focus-within:border-[#00366B] transition-colors">
              <span className="text-3xl font-light text-slate-300">₹</span>
              <input 
                type="number"
                value={amount}
                autoFocus
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-4xl font-bold outline-none text-slate-800"
                placeholder="0"
              />
            </div>
          </div>
          <button 
            disabled={!amount || parseFloat(amount) <= 0 || processing}
            onClick={handlePay}
            className="w-full py-4 bg-[#E41B23] text-white rounded-xl font-bold text-sm tracking-widest shadow-lg active:bg-red-700 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {processing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : `PROCEED TO PAY ₹${amount || '0'}`}
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
    <div className="relative h-full bg-black overflow-hidden">
      <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover opacity-50" />
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="w-64 h-64 border-2 border-white/20 rounded-3xl flex items-center justify-center relative bg-black/10">
          <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-xl" />
          <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-xl" />
          <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-xl" />
          <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-xl" />
          <div className="w-full h-[2px] bg-[#E41B23] absolute top-1/2 -translate-y-1/2 animate-[bounce_2s_infinite] shadow-[0_0_15px_rgba(228,27,35,0.8)]" />
        </div>
        <p className="mt-10 text-white font-bold text-xs uppercase tracking-[0.2em] opacity-80">Place QR in the box</p>
      </div>

      <div className="absolute bottom-12 left-0 right-0 px-8 flex flex-col gap-4">
        <button 
          onClick={handleSimulateScan}
          className="w-full py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-bold text-xs uppercase tracking-widest active:bg-white/20 transition-all"
        >
          SIMULATE DETECTION
        </button>
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full py-2 text-white/40 font-bold text-[10px] uppercase tracking-widest"
        >
          Cancel Payment
        </button>
      </div>
    </div>
  );
};

export default ScanAndPay;
