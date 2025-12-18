
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { User, VirtualAccount } from './types';
import { db } from './database';

// Screens
import Login from './screens/Login';
import Onboarding from './screens/Onboarding';
import Dashboard from './screens/Dashboard';
import ScanAndPay from './screens/ScanAndPay';
import Transfer from './screens/Transfer';
import History from './screens/History';
import Notifications from './screens/Notifications';
import Profile from './screens/Profile';
import Invest from './screens/Invest';
import Borrow from './screens/Borrow';

// Components
import Sidebar from './components/Sidebar';

export const HDFCLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({ size = 'md' }) => {
  const dimensions = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };
  return (
    <div className={`${dimensions[size]} bg-[#00366B] relative flex items-center justify-center rounded-[2px] overflow-hidden flex-shrink-0 border-[1.5px] border-[#00366B]`}>
       <div className="absolute w-[80%] h-[15%] bg-[#E41B23]"></div>
       <div className="absolute w-[15%] h-[80%] bg-[#E41B23]"></div>
    </div>
  );
}

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeAccount, setActiveAccount] = useState<VirtualAccount | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentUser = JSON.parse(sessionStorage.getItem('active_user') || 'null');
    if (currentUser) {
      setUser(currentUser);
      const accounts = db.getAccounts().filter(a => a.userId === currentUser.id);
      if (accounts.length > 0) setActiveAccount(accounts[0]);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('active_user');
    setUser(null);
    setIsSidebarOpen(false);
    navigate('/');
  };

  const isPublicRoute = ['/', '/onboard'].includes(location.pathname);

  if (!user && !isPublicRoute) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-[#F4F6F8] overflow-hidden select-none">
      {user && !isPublicRoute && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          user={user} 
          onLogout={handleLogout} 
        />
      )}

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {user && !isPublicRoute && (
          <header className="bg-[#00366B] text-white px-4 py-3 flex items-center justify-between shadow-md z-10 safe-top">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 active:opacity-60 transition-opacity"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <HDFCLogo size="sm" />
              <div className="text-lg font-bold tracking-tight">HDFC Bank</div>
            </div>
            <button 
              onClick={() => navigate('/notifications')}
              className="p-1 relative active:opacity-60 transition-opacity"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {user && db.getNotifications(user.id).some(n => !n.isRead) && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-[#E41B23] ring-2 ring-[#00366B]" />
              )}
            </button>
          </header>
        )}

        <main className="flex-1 overflow-y-auto no-scrollbar pb-20">
          <Routes>
            <Route path="/" element={<Login onLogin={(u) => { setUser(u); navigate('/dashboard'); }} />} />
            <Route path="/onboard" element={<Onboarding onComplete={(u) => { setUser(u); navigate('/dashboard'); }} />} />
            <Route path="/dashboard" element={<Dashboard user={user} account={activeAccount} />} />
            <Route path="/scan" element={<ScanAndPay account={activeAccount} />} />
            <Route path="/transfer" element={<Transfer account={activeAccount} />} />
            <Route path="/history" element={<History user={user} account={activeAccount} />} />
            <Route path="/notifications" element={<Notifications user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/invest" element={<Invest user={user} />} />
            <Route path="/borrow" element={<Borrow user={user} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {user && !isPublicRoute && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center py-2 px-4 shadow-lg safe-bottom z-20">
            <NavItem icon="home" label="Home" active={location.pathname === '/dashboard'} onClick={() => navigate('/dashboard')} />
            <NavItem icon="pay" label="Pay" active={location.pathname === '/transfer'} onClick={() => navigate('/transfer')} />
            <div 
               onClick={() => navigate('/scan')}
               className="bg-[#E41B23] p-4 rounded-full -mt-10 shadow-lg ring-4 ring-[#F4F6F8] cursor-pointer active:scale-95 transition-transform"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v-4m6 0h2m-6 0h-2m10 5V7a2 2 0 00-2-2h-3m-6 0H7a2 2 0 00-2 2v3m14 6v3a2 2 0 01-2 2h-3m-6 0H7a2 2 0 01-2-2v-3" />
              </svg>
            </div>
            <NavItem icon="history" label="History" active={location.pathname === '/history'} onClick={() => navigate('/history')} />
            <NavItem icon="profile" label="Profile" active={location.pathname === '/profile'} onClick={() => navigate('/profile')} />
          </nav>
        )}
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => {
  const icons: Record<string, React.ReactElement> = {
    home: <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
    pay: <path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
    history: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
    profile: <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  };

  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 transition-colors ${active ? 'text-[#00366B]' : 'text-slate-400'}`}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        {icons[icon]}
      </svg>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
};

const App: React.FC = () => (
  <HashRouter>
    <AppContent />
  </HashRouter>
);

export default App;
