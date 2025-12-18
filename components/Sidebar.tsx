
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { HDFCLogo } from '../App';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user, onLogout }) => {
  const navigate = useNavigate();

  const menuItems = [
    { label: 'Pay & Transfer', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z', route: '/transfer' },
    { label: 'Save & Deposits', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', route: '/dashboard' },
    { label: 'Invest & Insure', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', route: '/invest' },
    { label: 'Borrow / Loans', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', route: '/borrow' },
    { label: 'My Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', route: '/profile' },
    { label: 'Security Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z', route: '/profile' },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div 
        className={`fixed top-0 left-0 h-full w-4/5 max-w-[300px] bg-white z-50 transform transition-transform duration-300 ease-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="bg-[#004c8f] p-6 text-white safe-top">
          <div className="flex items-center gap-4 mb-6">
            <HDFCLogo size="sm" className="rounded-sm shadow-sm" />
            <div className="font-bold text-lg tracking-tight">HDFC Bank</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold uppercase ring-2 ring-white/20">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-base leading-tight">{user.name}</div>
              <div className="text-white/60 text-[10px] font-mono mt-1">CU-ID: {user.id.slice(0,8).toUpperCase()}</div>
              <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-[#ed1c24] text-[9px] font-bold uppercase tracking-widest">
                Official User
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-1">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => { navigate(item.route); onClose(); }}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors text-slate-700 font-semibold text-sm"
            >
              <svg className="w-5 h-5 text-[#004c8f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
          <div className="h-px bg-slate-100 my-4" />
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-red-50 active:bg-red-100 transition-colors text-[#ed1c24] font-bold text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Secure Logout
          </button>
        </div>

        <div className="absolute bottom-6 left-6 right-6 text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
          © 2025 HDFC Bank Ltd.<br/>
          Secure Banking Experience v4.1.2
        </div>
      </div>
    </>
  );
};

export default Sidebar;
