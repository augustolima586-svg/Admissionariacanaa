
import React from 'react';
import { ViewType, Role } from '../types';
import { Button } from './Button';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onLogout: () => void;
  logoUrl: string;
  userRole: Role;
  customPermissions?: ViewType[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout, logoUrl, userRole, customPermissions }) => {
  const menuConfig = [
    { id: ViewType.DASHBOARD, label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', roles: ['Admin'] },
    { id: ViewType.HISTORIA, label: 'História', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', roles: ['Admin', 'Secretaria', 'Membro'] },
    { id: ViewType.SECRETARIA, label: 'Secretaria', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', roles: ['Admin', 'Secretaria'] },
    { id: ViewType.RECEPCAO, label: 'Recepção | Portaria', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', roles: ['Admin', 'Secretaria'] },
    { id: ViewType.EBD, label: 'EBD', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', roles: ['Admin', 'Secretaria', 'Membro'] },
    { id: ViewType.TESOURARIA, label: 'Tesouraria', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['Admin'] },
    { id: ViewType.CAMPO_MISSIONARIO, label: 'Missões', icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', roles: ['Admin', 'Secretaria'] },
    { id: ViewType.IA_ASSISTANT, label: 'IA Bíblica', icon: 'M13 10V3L4 14h7v7l9-11h-7z', roles: ['Admin', 'Secretaria', 'Membro'] },
    { id: ViewType.APP_MEMBRO, label: 'Área do Membro', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z', roles: ['Admin', 'Secretaria', 'Membro'] },
    { id: ViewType.SETTINGS, label: 'Configurações', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z', roles: ['Admin'] },
  ];

  const visibleItems = menuConfig.filter(item =>
    item.roles.includes(userRole) || customPermissions?.includes(item.id)
  );

  return (
    <aside className="hidden md:flex flex-col h-full w-72 bg-slate-900 border-r border-slate-800 z-50 transition-all shadow-2xl overflow-hidden shrink-0">
      <div className="p-8 flex flex-col items-center border-b border-white/5 bg-slate-900/50">
        {/* Container da Logo com Fundo Branco Limpo, sem borda vermelha */}
        <div className="w-16 h-16 mb-4 bg-white rounded-2xl flex items-center justify-center p-2 shadow-xl overflow-hidden border border-slate-100">
          <img
            src={logoUrl}
            alt="Logo"
            className="w-full h-full object-contain"
            onError={(e) => { e.currentTarget.src = "https://ui-avatars.com/api/?name=Canaa&background=ffffff&color=ef4444"; }}
          />
        </div>
        <h1 className="text-[11px] font-heading font-black text-white tracking-[0.3em] text-center uppercase leading-tight">
          AD MISSIONÁRIA <br />
          <span className="text-red-500 tracking-[0.4em]">CANAÃ</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
        {visibleItems.map((item) => (
          <Button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`flex items-center px-5 py-4 text-[10px] font-heading font-black uppercase tracking-widest rounded-2xl transition-all duration-300 ${currentView === item.id
              ? 'bg-red-600 text-white shadow-lg shadow-red-900/40 translate-x-1'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'}
              }`}
          >
            <svg className="w-5 h-5 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} />
            </svg>
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-5 py-4 text-[10px] font-black text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest"
        >
          <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 16l4-4m0 0l-4-4m4 4H7" strokeWidth={2.5} /></svg>
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
