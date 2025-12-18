
import React from 'react';
import { User } from '../types';

const Borrow: React.FC<{ user: User | null }> = ({ user }) => {
  return (
    <div className="p-4 space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <h3 className="font-bold text-slate-800">CIBIL Score: 785</h3>
          <p className="text-slate-400 text-xs mt-1">Excellent! You are eligible for pre-approved loans.</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-slate-500 text-xs font-bold uppercase px-1">Special Offers for You</h3>
        <LoanOffer title="Personal Loan" amount="₹5,00,000" emi="₹9,800/mo" color="bg-blue-600" />
        <LoanOffer title="Car Loan" amount="₹12,00,000" emi="₹18,500/mo" color="bg-indigo-600" />
        <LoanOffer title="Home Loan" amount="₹75,00,000" emi="₹55,000/mo" color="bg-slate-800" />
      </div>

      <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
        <h4 className="font-bold text-orange-800 text-sm mb-2">Need Help?</h4>
        <p className="text-orange-700 text-xs leading-relaxed">Our relationship managers are available 24/7 to help you with your financial needs.</p>
        <button className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-xs active:scale-95 transition-transform">Request Callback</button>
      </div>
    </div>
  );
};

const LoanOffer = ({ title, amount, emi, color }: any) => (
  <div className={`${color} p-6 rounded-2xl text-white shadow-lg active:scale-95 transition-transform cursor-pointer relative overflow-hidden`}>
    <div className="relative z-10">
      <div className="font-bold opacity-70 text-xs uppercase tracking-widest">{title}</div>
      <div className="text-2xl font-bold mt-1">Pre-approved up to {amount}</div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs font-medium">Starting at {emi}</div>
        <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold">Apply Now</div>
      </div>
    </div>
    <div className="absolute right-[-10%] bottom-[-20%] w-32 h-32 bg-white/10 rounded-full" />
  </div>
);

export default Borrow;
