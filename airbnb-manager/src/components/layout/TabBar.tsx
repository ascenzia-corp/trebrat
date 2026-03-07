import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, CheckSquare, ShoppingCart, Users, ClipboardList, AlertTriangle } from 'lucide-react';
import { useRole } from '../../stores/authStore';
import type { UserRole } from '../../types';

interface TabItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const tabsByRole: Record<UserRole, TabItem[]> = {
  owner: [
    { path: '/reservations', label: 'Réservations', icon: <Calendar size={24} /> },
    { path: '/tasks', label: 'Tâches', icon: <CheckSquare size={24} /> },
    { path: '/purchases', label: 'Achats', icon: <ShoppingCart size={24} /> },
    { path: '/team', label: 'Équipe', icon: <Users size={24} /> },
  ],
  cleaning: [
    { path: '/tasks', label: 'Mes tâches', icon: <CheckSquare size={24} /> },
    { path: '/inspection', label: 'État des lieux', icon: <ClipboardList size={24} /> },
    { path: '/report', label: 'Signaler', icon: <AlertTriangle size={24} /> },
  ],
  maintenance: [
    { path: '/purchases', label: 'Achats', icon: <ShoppingCart size={24} /> },
    { path: '/tasks', label: 'Mes tâches', icon: <CheckSquare size={24} /> },
  ],
};

export default function TabBar() {
  const role = useRole();
  const location = useLocation();
  const navigate = useNavigate();

  if (!role) return null;
  const tabs = tabsByRole[role];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-ios-separator/30 z-40"
      style={{ paddingBottom: 'var(--sab, 0px)' }}
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around h-[49px] max-w-[430px] mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] gap-0.5 transition-colors ${
                isActive ? 'text-ios-primary' : 'text-ios-text-secondary'
              }`}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
