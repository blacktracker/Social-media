import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Platform, AIModel } from '../types';
import { YouTubeIcon, InstagramIcon, TikTokIcon, FacebookIcon, PinterestIcon, ProfileIcon, KeyIcon, SaveIcon } from './icons/index';

const platformDetails: Record<Platform, { icon: React.ReactNode, color: string }> = {
    YouTube: { icon: <YouTubeIcon className="w-8 h-8"/>, color: 'text-red-500' },
    Instagram: { icon: <InstagramIcon className="w-8 h-8"/>, color: 'text-pink-500' },
    TikTok: { icon: <TikTokIcon className="w-8 h-8"/>, color: 'text-white' },
    Facebook: { icon: <FacebookIcon className="w-8 h-8"/>, color: 'text-blue-600' },
    Pinterest: { icon: <PinterestIcon className="w-8 h-8"/>, color: 'text-red-700' },
};

const ProfilePhase: React.FC = () => {
    const appContext = useContext(AppContext);
    if (!appContext) return null;

    const { user, setUser, connectedPlatforms, setConnectedPlatforms, aiConfig, setAiConfig, addActivity } = appContext;

    const [activeTab, setActiveTab] = useState<'profile' | 'connections' | 'backend'>('profile');
    const [tempUsername, setTempUsername] = useState(user.name);
    const [tempApiKey, setTempApiKey] = useState(aiConfig.apiKey || '');
    const [tempModel, setTempModel] = useState(aiConfig.model);

    const toggleConnection = (platform: Platform) => {
        setConnectedPlatforms(prev => {
            const newStatus = !prev[platform];
            addActivity(`${newStatus ? 'Connected' : 'Disconnected'} ${platform} account.`);
            return { ...prev, [platform]: newStatus };
        });
    };

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        setUser(prev => ({...prev, name: tempUsername}));
        addActivity('Updated profile username.');
        alert('Profile saved!');
    };
    
    const handleBackendSave = (e: React.FormEvent) => {
        e.preventDefault();
        setAiConfig({ model: tempModel, apiKey: tempApiKey });
        addActivity(`Set AI backend to ${tempModel}.`);
        alert('AI backend settings saved!');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <form onSubmit={handleProfileSave} className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-4xl flex-shrink-0">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user.name.charAt(0)
                                )}
                            </div>
                            <div>
                                <label htmlFor="avatar-upload" className="block text-sm font-medium text-gray-300 mb-2">Profile Picture</label>
                                <button type="button" className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                                    Upload New Picture
                                </button>
                                <input type="file" id="avatar-upload" className="hidden" accept="image/*" />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                            <input type="text" id="username" value={tempUsername} onChange={e => setTempUsername(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div>
                            <label htmlFor="password"  className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                            <input type="password" id="password" placeholder="••••••••" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                <SaveIcon className="w-5 h-5"/> Save Profile
                            </button>
                        </div>
                    </form>
                );
            case 'connections':
                 return (
                    <div className="space-y-6">
                        {(Object.keys(platformDetails) as Platform[]).map(platform => {
                            const isConnected = connectedPlatforms[platform];
                            const details = platformDetails[platform];
                            return (
                                <div key={platform} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <span className={details.color}>{details.icon}</span>
                                        <span className="text-xl font-semibold text-white">{platform}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-gray-400'}`}>
                                            {isConnected ? 'Connected' : 'Not Connected'}
                                        </span>
                                        <button onClick={() => toggleConnection(platform)} className={`font-bold py-2 px-6 rounded-md transition-colors w-32 text-center ${ isConnected ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}>
                                            {isConnected ? 'Disconnect' : 'Connect'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 );
            case 'backend':
                return (
                    <form onSubmit={handleBackendSave} className="space-y-6">
                         <div className="flex items-center gap-3 text-indigo-300">
                             <KeyIcon className="w-5 h-5" />
                            <h3 className="text-lg font-semibold">AI Backend Configuration</h3>
                        </div>
                        <div>
                            <label htmlFor="ai-model" className="block text-sm font-medium text-gray-300 mb-1">AI Model</label>
                            <select id="ai-model" value={tempModel} onChange={e => setTempModel(e.target.value as AIModel)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {Object.values(AIModel).map(model => (
                                    <option key={model} value={model}>{model}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">Note: This is a simulation. All requests will use the Gemini API.</p>
                        </div>
                        <div>
                            <label htmlFor="api-key"  className="block text-sm font-medium text-gray-300 mb-1">API Key for {tempModel}</label>
                            <input type="password" id="api-key" value={tempApiKey} onChange={e => setTempApiKey(e.target.value)} placeholder="Enter your API key" className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
                        </div>
                         <div className="flex justify-end">
                            <button type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                <SaveIcon className="w-5 h-5"/> Save Settings
                            </button>
                        </div>
                    </form>
                );
            default: return null;
        }
    }


    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-2 text-indigo-400">Profile & Settings</h2>
            <p className="text-center text-gray-400 mb-10">Manage your account, connections, and AI preferences.</p>

            <div className="bg-gray-800 rounded-lg shadow-xl">
                <div className="border-b border-gray-700">
                    <nav className="flex space-x-1 p-2" aria-label="Tabs">
                        <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Profile</button>
                        <button onClick={() => setActiveTab('connections')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'connections' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Connections</button>
                        <button onClick={() => setActiveTab('backend')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'backend' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>AI Backend</button>
                    </nav>
                </div>
                <div className="p-8">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ProfilePhase;