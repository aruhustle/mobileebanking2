
import React from 'react';
import { User } from '../types';

const Profile: React.FC<{ user: User | null }> = ({ user }) => {
  if (!user) return null;

  return (
    <div className="p-4 space-y-6 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-[#00366B] flex items-center justify-center text-3xl font-bold text-white mb-4 relative">
          {user.name.charAt(0)}
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 border-4 border-white rounded-full flex items-center justify-center">
             <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
        </div>
        <h2 className="text-xl font-bold text-slate-800">{user.name}</h2>
        <p className="text-slate-400 text-sm">{user.mobile}</p>
        <div className="mt-4 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
          KYC Verified
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <ProfileItem icon="device" label="Linked Devices" value="iPhone 15 Pro" />
        <ProfileItem icon="security" label="Login Security" value="Biometric Enabled" />
        <ProfileItem icon="privacy" label="Privacy Settings" value="Optimized" />
        <ProfileItem icon="support" label="Help & Support" />
        <ProfileItem icon="legal" label="Legal & Terms" />
      </div>

      <div className="text-center p-8 text-slate-400">
        <p className="text-[10px] uppercase font-bold tracking-widest mb-1">NeoBank Global Ltd</p>
        <p className="text-[10px]">Securely encrypted at 256-bit AES level.</p>
      </div>
    </div>
  );
};

const ProfileItem = ({ icon, label, value }: any) => {
  const icons: any = {
    device: <path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />,
    security: <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    privacy: <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
    support: <path d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />,
    legal: <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-slate-50 last:border-0 active:bg-slate-50 transition-colors cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="text-[#00366B]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            {icons[icon]}
          </svg>
        </div>
        <div className="text-sm font-semibold text-slate-700">{label}</div>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs text-slate-400">{value}</span>}
        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default Profile;
