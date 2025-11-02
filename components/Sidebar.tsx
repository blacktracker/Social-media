import React, { useContext } from 'react';
import { AppContext } from '../App';
import { AppPhase } from '../types';
import { DashboardIcon, CreateIcon, CutIcon, CalendarIcon, EngagementIcon, AnalyticsIcon, ProfileIcon, LightbulbIcon } from './icons';

interface SidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const appContext = useContext(AppContext);
    
    const navItems = [
        { phase: AppPhase.DASHBOARD, label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5"/>, disabled: false },
        { phase: AppPhase.UPLOAD, label: 'Create', icon: <CreateIcon className="w-5 h-5"/>, disabled: false },
        { phase: AppPhase.EDITING, label: 'Edit', icon: <CutIcon className="w-5 h-5"/>, disabled: !appContext?.videoData && !appContext?.imageData },
        { phase: AppPhase.GENERATION, label: 'Schedule', icon: <LightbulbIcon className="w-5 h-5"/>, disabled: !appContext?.generatedContent },
        { phase: AppPhase.CALENDAR, label: 'Calendar', icon: <CalendarIcon className="w-5 h-5"/>, disabled: appContext?.posts.length === 0 },
        { phase: AppPhase.ENGAGEMENT, label: 'Engagement', icon: <EngagementIcon className="w-5 h-5"/>, disabled: appContext?.posts.length === 0 },
        { phase: AppPhase.ANALYTICS, label: 'Analytics', icon: <AnalyticsIcon className="w-5 h-5"/>, disabled: appContext?.posts.length === 0 },
        { phase: AppPhase.PROFILE, label: 'Profile & Settings', icon: <ProfileIcon className="w-5 h-5"/>, disabled: false },
    ];

    const handleNavClick = (phase: AppPhase, disabled: boolean) => {
        if (!disabled && appContext) {
            appContext.setPhase(phase);
            setIsSidebarOpen(false); // Close sidebar on nav click in mobile
        }
    };
    
    return (
        <>
            {/* Overlay for mobile */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsSidebarOpen(false)}
            ></div>

            <aside className={`w-64 bg-gray-800 shadow-md flex-shrink-0 flex flex-col fixed inset-y-0 left-0 z-40 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-20 flex items-center justify-center border-b border-gray-700 px-4">
                    <h1 className="text-2xl font-bold text-white text-center">AI Social Studio</h1>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.label}
                            onClick={() => handleNavClick(item.phase, item.disabled)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                                ${appContext?.phase === item.phase ? 'bg-indigo-600 text-white' : 'text-gray-300'}
                                ${item.disabled 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'hover:bg-gray-700 hover:text-white'
                                }`
                            }
                            disabled={item.disabled}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold flex-shrink-0">
                            {appContext?.user.avatar ? (
                                <img src={appContext.user.avatar} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                appContext?.user.name.charAt(0)
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-white text-sm truncate">{appContext?.user.name}</p>
                            <p className="text-xs text-gray-400">Pro Plan</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;