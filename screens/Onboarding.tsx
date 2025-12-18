
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Add LedgerDirection, TransactionType, and TransactionStatus to imports
import { User, VirtualAccount, LedgerEntry, LedgerDirection, TransactionType, TransactionStatus } from '../types';
import { db } from '../database';
import { HDFCLogo } from '../App';

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
    await new Promise(r => setTimeout(r, 1800));

    const userId = Math.floor(10000000 + Math.random() * 90000000).toString();
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
      id: 'acc-' + Math.floor(1000000000000 + Math.random() * 9000000000000),
      userId,
      accountNumber: '50100' + Math.floor(10000000 + Math.random() * 90000000),
      ifsc: 'HDFC0000001',
      type: 'SAVINGS',
      label: 'Savings Account',
      isFrozen: false
    };

    // Fix: Added missing properties to conform to LedgerEntry interface
    const openingEntry: LedgerEntry = {
      id: 'led-' + Math.random().toString(36).substr(2, 9),
      transactionId: 'OPENING_CREDIT',
      userId: userId,
      accountId: account.id,
      amount: 5000.00,
      direction: LedgerDirection.CREDIT,
      balanceBefore: 0,
      balanceAfter: 5000.00,
      timestamp: Date.now(),
      paymentMethod: TransactionType.BANK_TRANSFER,
      counterpartyDetails: { name: 'Account Opening' },
      status: TransactionStatus.SUCCESS
    };

    db.addUser(user);
    db.addAccount(account);
    db.addLedgerEntry(openingEntry);
    
    db.addNotification({
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      userId,
      title: 'Digital Account Activated',
      message: 'Welcome to HDFC Bank. Your account is ready for use.',
      type: 'SUCCESS',
      isRead: false,
      timestamp: Date.now()
    });

    sessionStorage.setItem('active_user', JSON.stringify(user));
    setLoading(false);
    onComplete(user);
  };

  return (
    <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center animate-in fade-in duration-500">
      <div className="mb-12 text-center">
        <div className="flex justify-center mb-6">
          <HDFCLogo size="xl" />
        </div>
        <h1 className="text-3xl font-bold text-[#00366B] mb-2 tracking-tight">HDFC Bank</h1>
        <p className="text-slate-400 font-medium uppercase tracking-widest text-[10px]">MobileBanking Registration</p>
      </div>

      <div className="w-full max-sm space-y-8">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="border-b-2 border-slate-100 focus-within:border-[#00366B] transition-colors py-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mobile Number</label>
              <div className="flex items-center">
                 <span className="font-bold text-slate-400 mr-2">+91</span>
                  <input 
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    placeholder="9727180908"
                    className="w-full text-xl font-bold text-slate-800 outline-none bg-transparent"
                  />
              </div>
            </div>
            <button 
              disabled={mobile.length < 10}
              onClick={() => setStep(2)}
              className="w-full py-4 bg-[#E41B23] text-white rounded-[4px] font-bold tracking-widest active:bg-red-700 transition-colors disabled:opacity-50"
            >
              CONTINUE
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-2 text-slate-400 font-bold text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="border-b-2 border-slate-100 focus-within:border-[#00366B] transition-colors py-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Armaan Thakkar"
                className="w-full text-xl font-bold text-slate-800 outline-none bg-transparent"
              />
            </div>
            <div className="border-b-2 border-slate-100 focus-within:border-[#00366B] transition-colors py-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Set 4-Digit Login PIN</label>
              <input 
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full text-xl font-bold text-slate-800 outline-none bg-transparent text-center tracking-[1em]"
              />
            </div>
            <button 
              disabled={!name || pin.length < 4 || loading}
              onClick={handleFinish}
              className="w-full py-4 bg-[#E41B23] text-white rounded-[4px] font-bold tracking-widest flex items-center justify-center gap-2 active:bg-red-700 transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'PROCEED TO ACCOUNT'}
            </button>
          </div>
        )}
      </div>

      <div className="absolute bottom-12 text-center px-12 opacity-40">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] leading-relaxed">
          Subject to terms, conditions and bank verification policies. Regulated by Reserve Bank of India.
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
