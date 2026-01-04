
import React from 'react';
import { ViewType, Role } from '../types';
import {
    LayoutDashboard,
    History,
    Users,
    GraduationCap,
    Wallet,
    Globe,
    Sparkles,
    UserCircle
} from 'lucide-react';

interface MobileNavProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    userRole: Role;
    customPermissions?: ViewType[];
}

const MobileNav: React.FC<MobileNavProps> = ({ currentView, onViewChange, userRole, customPermissions }) => {
    const menuConfig = [
        { id: ViewType.DASHBOARD, label: 'Início', icon: LayoutDashboard, roles: ['Admin'] },
        { id: ViewType.HISTORIA, label: 'Nossa História', icon: History, roles: ['Admin', 'Secretaria', 'Membro'] },
        { id: ViewType.SECRETARIA, label: 'Sec.', icon: Users, roles: ['Admin', 'Secretaria'] },
        { id: ViewType.RECEPCAO, label: 'Rec.', icon: UserCircle, roles: ['Admin', 'Secretaria'] },
        { id: ViewType.EBD, label: 'Escola Bíblica - EBD', icon: GraduationCap, roles: ['Admin', 'Secretaria', 'Membro'] },
        { id: ViewType.TESOURARIA, label: 'Fin.', icon: Wallet, roles: ['Admin'] },
        { id: ViewType.CAMPO_MISSIONARIO, label: 'DP Missões', icon: Globe, roles: ['Admin', 'Secretaria'] },
        { id: ViewType.IA_ASSISTANT, label: 'IA', icon: Sparkles, roles: ['Admin', 'Secretaria', 'Membro'] },
        { id: ViewType.APP_MEMBRO, label: 'Membro', icon: UserCircle, roles: ['Admin', 'Secretaria', 'Membro'] },
        { id: ViewType.SETTINGS, label: 'Config.', icon: Globe, roles: ['Admin'] },
    ];

    const visibleItems = menuConfig.filter(item =>
        item.roles.includes(userRole) || customPermissions?.includes(item.id)
    );

    return (
        <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t border-slate-200 z-50 md:hidden pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center overflow-x-auto px-4 py-2 gap-2 no-scrollbar scroll-smooth">
                {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`flex flex-col items-center justify-center min-w-[72px] h-[64px] rounded-2xl transition-all duration-300 snap-center ${isActive
                                ? 'text-primary bg-primary-light shadow-sm ring-1 ring-primary/20'
                                : 'text-slate-400 hover:text-slate-600 active:scale-95 hover:bg-slate-50'
                                }`}
                        >
                            <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`text-[10px] font-heading font-black mt-1 transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-70'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileNav;
