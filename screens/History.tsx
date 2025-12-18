
import React, { useState, useMemo } from 'react';
import { User, VirtualAccount, TransactionType, Transaction } from '../types';
import { db } from '../database';

interface HistoryProps {
  user: User | null;
  account: VirtualAccount | null;
}

const History: React.FC<HistoryProps> = ({ user, account }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<TransactionType | 'ALL'>('ALL');

  const groupedTransactions = useMemo(() => {
    let list = db.getTransactions();
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(tx => 
        tx.receiverDetails.name.toLowerCase().includes(s) || 
        tx.receiverDetails.upiId?.toLowerCase().includes(s) ||
        tx.note?.toLowerCase().includes(s)
      );
    }
    if (filter !== 'ALL') {
      list = list.filter(tx => tx.receiverDetails.type === filter);
    }

    const groups: Record<string, Transaction[]> = {};
    list.forEach(tx => {
      const month = new Date(tx.timestamp).toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[month]) groups[month] = [];
      groups[month].push(tx);
    });
    return groups;
  }, [search, filter]);

  return (
    <div className="flex flex-col h-full bg-[#F4F6F8]">
      <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payees, notes..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-xl outline-none focus:ring-1 focus:ring-[#00366B] text-xs font-medium"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <FilterTab active={filter === 'ALL'} label="All" onClick={() => setFilter('ALL')} />
          <FilterTab active={filter === TransactionType.UPI} label="UPI" onClick={() => setFilter(TransactionType.UPI)} />
          <FilterTab active={filter === TransactionType.BANK_TRANSFER} label="Bank Transfer" onClick={() => setFilter(TransactionType.BANK_TRANSFER)} />
          <FilterTab active={filter === TransactionType.BILL_PAY} label="Bills" onClick={() => setFilter(TransactionType.BILL_PAY)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
        {Object.keys(groupedTransactions).length > 0 ? (
          // Add explicit type assertion to Object.entries to fix "Property 'map' does not exist on type 'unknown'"
          (Object.entries(groupedTransactions) as [string, Transaction[]][]).map(([month, txs]) => (
            <div key={month} className="space-y-3">
              <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest sticky top-0 bg-[#F4F6F8]/95 backdrop-blur-sm py-1 z-0">{month}</h3>
              <div className="space-y-2">
                {txs.map((tx) => (
                  <div key={tx.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center active:scale-[0.99] transition-transform shadow-sm group">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${tx.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-[#00366B]'}`}>
                        {tx.receiverDetails.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-800">{tx.receiverDetails.name}</div>
                        <div className="text-slate-400 text-[9px] font-bold uppercase tracking-tighter">
                          {new Date(tx.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} • {tx.receiverDetails.type}
                        </div>
                        {tx.note && <div className="text-slate-500 text-[10px] mt-0.5 line-clamp-1 italic">"{tx.note}"</div>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-sm ${tx.amount < 0 ? 'text-[#E41B23]' : 'text-green-600'}`}>
                        {tx.amount < 0 ? '-' : '+'}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                      </div>
                      <div className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase mt-1 tracking-widest border ${tx.status === 'SUCCESS' ? 'border-green-100 text-green-600 bg-green-50/50' : 'border-red-100 text-red-600 bg-red-50/50'}`}>
                        {tx.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
            <svg className="w-16 h-16 opacity-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs font-bold uppercase tracking-widest">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FilterTab: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all whitespace-nowrap uppercase tracking-widest ${active ? 'bg-[#00366B] text-white shadow-md' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}
  >
    {label}
  </button>
);

export default History;
