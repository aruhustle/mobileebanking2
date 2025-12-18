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
import Receipt from './screens/Receipt';

// Components
import Sidebar from './components/Sidebar';

export const HDFCLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string; color?: string }> = ({ size = 'md', className = "", color = "#004c8f" }) => {
  const dimensions = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };
  
  // Use the specific GitHub URL for the icon
  const logoUrl = "https://raw.githubusercontent.com/armaanthakkar/HDFC-Mobile-Banking-App/main/icon.png";

  return (
    <div className={`${dimensions[size]} ${className} flex-shrink-0 flex items-center justify-center overflow-hidden rounded-sm bg-white p-0.5`}>
      <img 
        src={logoUrl} 
        alt="HDFC Bank" 
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback reconstruction if GitHub fetch fails
          const target = e.target as HTMLElement;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            const svgNamespace = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNamespace, "svg");
            svg.setAttribute("viewBox", "0 0 100 100");
            svg.setAttribute("class", "w-full h-full");
            
            const rect = document.createElementNS(svgNamespace, "rect");
            rect.setAttribute("width", "100");
            rect.setAttribute("height", "100");
            rect.setAttribute("rx", "4");
            rect.setAttribute("fill", color);
            
            const p1 = document.createElementNS(svgNamespace, "rect");
            p1.setAttribute("x", "18"); p1.setAttribute("y", "24"); p1.setAttribute("width", "14"); p1.setAttribute("height", "52"); p1.setAttribute("fill", "white");
            
            const p2 = document.createElementNS(svgNamespace, "rect");
            p2.setAttribute("x", "68"); p2.setAttribute("y", "24"); p2.setAttribute("width", "14"); p2.setAttribute("height", "52"); p2.setAttribute("fill", "white");
            
            const p3 = document.createElementNS(svgNamespace, "rect");
            p3.setAttribute("x", "32"); p3.setAttribute("y", "42"); p3.setAttribute("width", "36"); p3.setAttribute("height", "16"); p3.setAttribute("fill", "white");
            
            svg.appendChild(rect);
            svg.appendChild(p1);
            svg.appendChild(p2);
            svg.appendChild(p3);
            parent.appendChild(svg);
          }
        }}
      />
    </div>
  );
}

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('active_user');
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeAccount, setActiveAccount] = useState<VirtualAccount | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const accounts = db.getAccounts().filter(a => a.userId === user.id);
      if (accounts.length > 0) setActiveAccount(accounts[0]);
    }
  }, [user]);

  const handleLogout = () => {
    sessionStorage.removeItem('active_user');
    setUser(null);
    setIsSidebarOpen(false);
    navigate('/', { replace: true });
  };

  const isPublicRoute = ['/', '/onboard'].includes(location.pathname);

  useEffect(() => {
    if (user && isPublicRoute) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isPublicRoute, navigate]);

  if (!user && !isPublicRoute) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#F4F6F8] overflow-hidden select-none font-inter safe-top safe-bottom">
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
          <header className="bg-[#004c8f] text-white px-4 py-4 flex items-center justify-between shadow-lg z-10 flex-shrink-0">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 active:opacity-60 transition-opacity"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <HDFCLogo size="sm" />
              <div className="text-xl font-bold tracking-tight">HDFC Bank</div>
            </div>
            <button 
              onClick={() => navigate('/notifications')}
              className="p-1 relative active:opacity-60 transition-opacity"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {user && db.getNotifications(user.id).some(n => !n.isRead) && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-[#ed1c24] ring-2 ring-[#004c8f]" />
              )}
            </button>
          </header>
        )}

        <main className="flex-1 overflow-y-auto no-scrollbar relative">
          <Routes>
            <Route path="/" element={<Login onLogin={(u) => setUser(u)} />} />
            <Route path="/onboard" element={<Onboarding onComplete={(u) => setUser(u)} />} />
            <Route path="/dashboard" element={<Dashboard user={user} account={activeAccount} />} />
            <Route path="/scan" element={<ScanAndPay account={activeAccount} />} />
            <Route path="/transfer" element={<Transfer account={activeAccount} />} />
            <Route path="/history" element={<History user={user} account={activeAccount} />} />
            <Route path="/notifications" element={<Notifications user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
            <Route path="/invest" element={<Invest user={user} />} />
            <Route path="/borrow" element={<Borrow user={user} />} />
            <Route path="/receipt/:id" element={<Receipt />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        {user && !isPublicRoute && (
          <nav className="bg-white border-t border-slate-200 flex justify-around items-center pt-3 pb-8 px-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20 flex-shrink-0">
            <NavItem icon="home" label="Home" active={location.pathname === '/dashboard'} onClick={() => navigate('/dashboard')} />
            <NavItem icon="pay" label="Pay" active={location.pathname === '/transfer'} onClick={() => navigate('/transfer')} />
            <div 
               onClick={() => navigate('/scan')}
               className="bg-[#ed1c24] p-4 rounded-full -mt-12 shadow-xl ring-4 ring-[#F4F6F8] cursor-pointer active:scale-90 transition-transform"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v-4m6 0h2m-6 0h-2m10 5V7a2 2 0 00-2-2h-3m-6 0H7a2 2 0 00-2 2v3m14 6v3a2 2 0 01-2 2h-3m-6 0H7a2 2 0 01-2-2v-3" />
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
    <button onClick={onClick} className={`flex flex-col items-center gap-0.5 transition-all active:scale-95 ${active ? 'text-[#004c8f]' : 'text-slate-400'}`}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        {icons[icon]}
      </svg>
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
};

const App: React.FC = () => (
  <HashRouter>
    <AppContent />
  </HashRouter>
);

export default App;