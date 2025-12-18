
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

  // For real-world use, we default to the demo user if no other session is found
  useEffect(() => {
    if (step === 'MOBILE') {
      // In a real app, we might retrieve the last used mobile from local storage
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
      setError('Mobile number not registered with HDFC Bank.');
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
      setError('Incorrect PIN. Please try again.');
      setPin('');
      
      if (newAttempts >= 3) {
        setIsLocked(true);
        setError('Security Lock: Too many failed attempts. Try again later.');
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
          <h1 className="mt-8 text-2xl font-bold text-[#00366B] tracking-tight text-center">HDFC Bank</h1>
          <p className="mt-1 text-slate-500 text-sm font-medium uppercase tracking-widest text-center">MobileBanking</p>
          
          <div className="w-full mt-12 space-y-8">
            <div className="border-b border-slate-200 py-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Registered Mobile Number</label>
              <div className="flex items-center">
                <span className="text-slate-800 font-bold mr-2">+91</span>
                <input 
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="9727180908"
                  className="flex-1 bg-transparent text-xl font-bold outline-none text-slate-800"
                />
              </div>
            </div>
            
            {error && <p className="text-[#E41B23] text-xs font-bold text-center">{error}</p>}

            <button 
              onClick={handleMobileNext}
              disabled={mobile.length < 10}
              className="w-full py-4 bg-[#E41B23] text-white rounded-[4px] font-bold text-sm tracking-widest active:bg-red-700 transition-colors disabled:opacity-50"
            >
              CONTINUE
            </button>
            
            <div className="text-center pt-4">
              <button 
                onClick={() => navigate('/onboard')}
                className="text-[#00366B] font-bold text-xs hover:underline"
              >
                OPEN DIGITAL ACCOUNT
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 text-center pb-12">
          <div className="flex justify-center items-center gap-2 mb-2">
            <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Your security is our priority</span>
          </div>
          <p className="text-[10px] text-slate-300 font-medium">© 2025 HDFC Bank Ltd.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col safe-top animate-in slide-in-from-right-4 duration-300">
      <div className="flex-1 flex flex-col items-center pt-16 px-8">
        <HDFCLogo size="md" />
        <p className="mt-4 text-slate-500 text-xs font-semibold">Welcome to Mobile Banking</p>
        
        <div className="mt-10 text-center">
          <p className="text-slate-500 text-xs font-bold tracking-widest mb-1">
            +91 ••••••{identifiedUser?.mobile.slice(-4)}
          </p>
          <h2 className="text-xl font-bold text-slate-800">{identifiedUser?.name}</h2>
          <button 
            onClick={() => { setStep('MOBILE'); setPin(''); }}
            className="mt-2 text-[#00366B] text-[10px] font-bold uppercase hover:underline"
          >
            Switch User
          </button>
        </div>

        <div className={`mt-10 flex gap-5 ${isShaking ? 'animate-shake' : ''}`}>
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border border-slate-300 transition-all duration-150 ${pin.length >= i ? 'bg-slate-800 border-slate-800' : 'bg-transparent'}`} 
            />
          ))}
        </div>

        {error && <p className="mt-6 text-[#E41B23] text-xs font-bold text-center">{error}</p>}

        {/* Numeric Keypad */}
        <div className="mt-8 grid grid-cols-3 gap-x-8 gap-y-6 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button 
              key={num} 
              onClick={() => handlePinInput(num.toString())}
              disabled={isLocked}
              className="w-16 h-16 flex items-center justify-center text-3xl font-medium text-slate-800 active:bg-slate-50 rounded-full transition-colors mx-auto"
            >
              {num}
            </button>
          ))}
          <div />
          <button 
            onClick={() => handlePinInput('0')}
            disabled={isLocked}
            className="w-16 h-16 flex items-center justify-center text-3xl font-medium text-slate-800 active:bg-slate-50 rounded-full transition-colors mx-auto"
          >
            0
          </button>
          <button 
            onClick={() => setPin(pin.slice(0, -1))}
            className="w-16 h-16 flex items-center justify-center text-slate-400 mx-auto active:bg-slate-50 rounded-full"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
            </svg>
          </button>
        </div>

        <button 
          onClick={() => {}}
          disabled={pin.length < 4 || isLocked}
          className="mt-10 w-full py-4 bg-[#E41B23] text-white rounded-[4px] font-bold text-sm tracking-widest active:bg-red-700 transition-colors disabled:opacity-50"
        >
          LOGIN
        </button>

        <div className="mt-8 flex justify-center gap-6">
          <button className="text-[#00366B] font-bold text-[10px] uppercase hover:underline">Forgot PIN?</button>
          <div className="w-px h-3 bg-slate-200 mt-0.5" />
          <button 
            onClick={() => setStep('MOBILE')}
            className="text-[#00366B] font-bold text-[10px] uppercase hover:underline"
          >
            Use another account
          </button>
        </div>
      </div>

      <div className="p-8 text-center pb-12">
        <div className="flex justify-center items-center gap-2 mb-2">
          <svg className="w-3 h-3 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secure Digital Banking</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
