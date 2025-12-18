
import React from 'react';
import { User } from '../types';
import { db } from '../database';

interface NotificationsProps {
  user: User | null;
}

const Notifications: React.FC<NotificationsProps> = ({ user }) => {
  if (!user) return null;

  const notifications = db.getNotifications(user.id);

  const getTypeStyles = (type: string) => {
    switch(type) {
      case 'SUCCESS': return 'bg-green-100 text-green-600';
      case 'ALERT': return 'bg-orange-100 text-orange-600';
      case 'ERROR': return 'bg-red-100 text-red-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-500">
      <h2 className="text-xl font-bold text-[#00366B] mb-2">Notifications</h2>
      {notifications.length > 0 ? (
        notifications.map((n) => (
          <div 
            key={n.id} 
            className={`p-4 rounded-xl border flex gap-4 transition-all ${n.isRead ? 'bg-white border-slate-100' : 'bg-blue-50/50 border-blue-100 ring-1 ring-blue-100'}`}
            onClick={() => db.markNotificationRead(n.id)}
          >
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${getTypeStyles(n.type)}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-sm text-slate-800">{n.title}</h4>
                <span className="text-[10px] text-slate-400">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
            </div>
          </div>
        ))
      ) : (
        <div className="py-20 text-center text-slate-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p>No new notifications</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;
