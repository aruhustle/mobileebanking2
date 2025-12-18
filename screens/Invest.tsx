
import React from 'react';
import { User } from '../types';

const Invest: React.FC<{ user: User | null }> = ({ user }) => {
  return (
    <div className="p-4 space-y-6">
      <div className="bg-gradient-to-r from-[#00366B] to-blue-500 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold mb-1">Grow Your Wealth</h2>
        <p className="text-white/70 text-sm">Start investing in Mutual Funds & FDs instantly.</p>
        <div className="mt-6 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Investment Value</div>
            <div className="text-2xl font-bold">₹0.00</div>
          </div>
          <button className="bg-white text-[#00366B] px-4 py-2 rounded-lg font-bold text-xs">Explore Funds</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InvestmentCard title="Fixed Deposit" rate="7.25% p.a." icon="lock" color="bg-indigo-50" />
        <InvestmentCard title="Mutual Funds" rate="12.4% avg." icon="chart" color="bg-cyan-50" />
        <InvestmentCard title="Digital Gold" rate="24K Pure" icon="sparkles" color="bg-yellow-50" />
        <InvestmentCard title="Stocks" rate="Zero Brokerage" icon="trending" color="bg-emerald-50" />
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-100">
        <h3 className="text-slate-800 font-bold mb-4">Top Performing Funds</h3>
        <div className="space-y-4">
          <FundItem name="BlueChip Equity Fund" returns="+18.4%" trend="UP" />
          <FundItem name="Debt Conservative Fund" returns="+8.2%" trend="UP" />
          <FundItem name="Tax Saver ELSS" returns="+21.1%" trend="UP" />
        </div>
      </div>
    </div>
  );
};

const InvestmentCard = ({ title, rate, icon, color }: any) => (
  <div className={`${color} p-4 rounded-xl border border-black/5 active:scale-95 transition-transform cursor-pointer`}>
    <div className="font-bold text-slate-800 text-sm mb-1">{title}</div>
    <div className="text-[#00366B] font-extrabold text-xs">{rate}</div>
  </div>
);

const FundItem = ({ name, returns, trend }: any) => (
  <div className="flex justify-between items-center">
    <div className="text-sm font-medium text-slate-600">{name}</div>
    <div className="text-green-600 font-bold text-sm">{returns}</div>
  </div>
);

export default Invest;
