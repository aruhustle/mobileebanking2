
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../database';
import { User } from '../types';
import { HDFCLogo } from '../App';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'MOBILE' | 'PIN'>('MOBILE');
  const [error, setError] = useState('');
  const [identifiedUser, setIdentifiedUser] = useState<User | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 'MOBILE') {
      const lastMobile = localStorage.getItem('last_mobile') || '9727180908';
      setMobile(lastMobile);
    }
  }, [step]);

  const handleMobileNext = () => {
    const user = db.getUserByMobile(mobile);
    if (user) {
      setIdentifiedUser(user);
      setStep('PIN');
      setError('');
      localStorage.setItem('last_mobile', mobile);
    } else {
      setError('Mobile number not registered.');
    }
  };

  const handlePinInput = (digit: string) => {
    if (isLocked) return;
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        validatePin(newPin);
      }
    }
  };

  const validatePin = (inputPin: string) => {
    if (identifiedUser && identifiedUser.pin === inputPin) {
      sessionStorage.setItem('active_user', JSON.stringify(identifiedUser));
      onLogin(identifiedUser);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setIsShaking(true);
      setError('Invalid PIN.');
      setPin('');
      
      if (newAttempts >= 3) {
        setIsLocked(true);
        setError('Security Lock: Too many failed attempts.');
      }
      
      setTimeout(() => {
        setIsShaking(false);
        if (!isLocked) setError('');
      }, 2000);
    }
  };

  if (step === 'MOBILE') {
    return (
      <div className="min-h-screen bg-white flex flex-col safe-top animate-in fade-in duration-300">
        <div className="flex-1 px-8 pt-16 flex flex-col items-center">
          <HDFCLogo size="xl" />
          <h1 className="mt-8 text-3xl font-bold text-[#00366B] tracking-tight text-center">HDFC Bank</h1>
          <p className="mt-1 text-slate-500 text-xs font-bold uppercase tracking-[0.2em] text-center">MobileBanking</p>
          
          <div className="w-full mt-16 space-y-10">
            <div className="border-b-2 border-slate-100 focus-within:border-[#00366B] transition-colors py-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Registered Mobile Number</label>
              <div className="flex items-center">
                <span className="text-slate-800 font-bold text-xl mr-3">+91</span>
                <input 
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10 digit number"
                  className="flex-1 bg-transparent text-2xl font-bold outline-none text-slate-800 placeholder:text-slate-200"
                />
              </div>
            </div>
            
            {error && <p className="text-[#E41B23] text-xs font-bold text-center">{error}</p>}

            <button 
              onClick={handleMobileNext}
              disabled={mobile.length < 10}
              className="w-full py-5 bg-[#E41B23] text-white rounded-xl font-bold text-base tracking-widest shadow-lg active:bg-red-700 transition-colors disabled:opacity-50 uppercase"
            >
              Log In
            </button>
            
            <div className="text-center">
              <button 
                onClick={() => navigate('/onboard')}
                className="text-[#00366B] font-bold text-sm"
              >
                Register for Mobile Banking
              </button>
            </div>
          </div>
        </div>

        <div className="p-10 text-center pb-12 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
            <svg className="w-3 h-3 text-[#00366B]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">End-to-End Encrypted</span>
          </div>
          <p className="text-[10px] text-slate-300 font-medium tracking-tight">© 2025 HDFC Bank Ltd. All rights reserved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col safe-top animate-in slide-in-from-right-4 duration-300">
      <div className="flex-1 flex flex-col items-center pt-16 px-8">
        <HDFCLogo size="md" />
        <p className="mt-4 text-[#00366B] text-xs font-bold uppercase tracking-widest">Secure Access</p>
        
        <div className="mt-12 text-center">
          <div className="w-20 h-20 rounded-full bg-[#00366B] flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4 border-4 border-white shadow-xl ring-1 ring-slate-100">
            {identifiedUser?.name.charAt(0)}
          </div>
          <p className="text-slate-400 text-xs font-bold tracking-widest mb-1">
            +91 ••••••{identifiedUser?.mobile.slice(-4)}
          </p>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{identifiedUser?.name}</h2>
          <button 
            onClick={() => { setStep('MOBILE'); setPin(''); }}
            className="mt-3 text-[#00366B] text-[10px] font-bold uppercase tracking-widest border-b border-[#00366B]/20"
          >
            Switch User
          </button>
        </div>

        <div className={`mt-12 flex gap-6 ${isShaking ? 'animate-shake' : ''}`}>
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 border-slate-200 transition-all duration-200 ${pin.length >= i ? 'bg-[#00366B] border-[#00366B] scale-125' : 'bg-transparent'}`} 
            />
          ))}
        </div>

        {error && <p className="mt-8 text-[#E41B23] text-xs font-bold text-center tracking-wide">{error}</p>}

        {/* Numeric Keypad */}
        <div className="mt-10 grid grid-cols-3 gap-x-10 gap-y-6 w-full max-w-[300px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button 
              key={num} 
              onClick={() => handlePinInput(num.toString())}
              disabled={isLocked}
              className="w-16 h-16 flex items-center justify-center text-3xl font-medium text-slate-800 active:bg-slate-100 rounded-full transition-all mx-auto active:scale-90"
            >
              {num}
            </button>
          ))}
          <div />
          <button 
            onClick={() => handlePinInput('0')}
            disabled={isLocked}
            className="w-16 h-16 flex items-center justify-center text-3xl font-medium text-slate-800 active:bg-slate-100 rounded-full transition-all mx-auto active:scale-90"
          >
            0
          </button>
          <button 
            onClick={() => setPin(pin.slice(0, -1))}
            className="w-16 h-16 flex items-center justify-center text-slate-400 mx-auto active:bg-slate-50 rounded-full active:scale-90"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
          </button>
        </div>

        <div className="mt-12 flex flex-col items-center gap-6">
          <button className="text-[#00366B] font-bold text-[10px] uppercase tracking-[0.2em]">Forgot PIN?</button>
          <div className="flex items-center gap-2 opacity-30">
             <HDFCLogo size="sm" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-[#00366B]">Secure Banking</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
