// src/components/ResponsiveNav.tsx
import React from 'react';
import MobileNav from './MobileNav';
import Sidebar from './Sidebar';
import { ViewType, Role } from '../types';

interface ResponsiveNavProps {
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    userRole: Role;
    logoUrl?: string;
    onLogout?: () => void;
    customPermissions?: ViewType[];
}

const ResponsiveNav: React.FC<ResponsiveNavProps> = ({
    currentView,
    onViewChange,
    userRole,
    logoUrl,
    onLogout,
    customPermissions
}) => {
    const [width, setWidth] = React.useState(window.innerWidth);

    React.useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = width < 768;
    if (isMobile) {
        return (
            <MobileNav currentView={currentView} onViewChange={onViewChange} userRole={userRole} customPermissions={customPermissions} />
        );
    }
    return (
        <Sidebar
            currentView={currentView}
            onViewChange={onViewChange}
            onLogout={onLogout}
            logoUrl={logoUrl ?? ''}
            userRole={userRole}
            customPermissions={customPermissions}
        />
    );
};

export default ResponsiveNav;
