
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, VirtualAccount, LedgerEntry } from '../types';
import { db } from '../database';

interface OnboardingProps {
  onComplete: (user: User) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFinish = async () => {
    setLoading(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));

    const userId = Math.random().toString(36).substr(2, 9);
    const user: User = {
      id: userId,
      mobile,
      name,
      pin,
      kycStatus: 'VERIFIED',
      isBiometricEnabled: true,
      onboardedAt: Date.now()
    };

    const account: VirtualAccount = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      accountNumber: '4005' + Math.floor(Math.random() * 90000000),
      ifsc: 'NEOB0004005',
      type: 'SAVINGS',
      label: 'Main Savings',
      isFrozen: false
    };

    // Initialize with demo balance
    const openingEntry: LedgerEntry = {
      id: Math.random().toString(36).substr(2, 9),
      accountId: account.id,
      transactionId: 'OPENING',
      amount: 5000.00, // Reduced from demo to simulate fresh start
      timestamp: Date.now()
    };

    db.addUser(user);
    db.addAccount(account);
    db.addLedgerEntry(openingEntry);
    
    db.addNotification({
      id: Math.random().toString(36).substr(2, 9),
      userId,
      title: 'Welcome to NeoBank!',
      message: 'Your account is ready with a ₹5,000.00 opening balance.',
      type: 'SUCCESS',
      isRead: false,
      timestamp: Date.now()
    });

    sessionStorage.setItem('active_user', JSON.stringify(user));
    setLoading(false);
    onComplete(user);
  };

  return (
    <div className="min-h-screen bg-white p-8 flex flex-col justify-center animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#00366B] mb-2">Join NeoBank</h1>
        <p className="text-slate-500">Experience banking redefined.</p>
      </div>

      <div className="space-y-6">
        {step === 1 && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mobile Number</label>
              <input 
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 10-digit mobile"
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-100 focus:border-[#00366B] focus:ring-1 focus:ring-[#00366B] outline-none transition-all"
              />
            </div>
            <button 
              disabled={mobile.length < 10}
              onClick={() => setStep(2)}
              className="w-full py-4 bg-[#00366B] text-white rounded-xl font-bold disabled:opacity-50 active:scale-95 transition-transform"
            >
              Verify Number
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-2 text-slate-400 font-bold text-sm"
            >
              Back to Login
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
             <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="As per PAN/Aadhar"
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-100 focus:border-[#00366B] focus:ring-1 focus:ring-[#00366B] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Set 4-Digit Login PIN</label>
              <input 
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-100 focus:border-[#00366B] focus:ring-1 focus:ring-[#00366B] outline-none transition-all text-center text-2xl tracking-[1em]"
              />
            </div>
            <button 
              disabled={!name || pin.length < 4 || loading}
              onClick={handleFinish}
              className="w-full py-4 bg-[#E41B23] text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Complete Onboarding'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
