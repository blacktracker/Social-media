import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Platform, AIModel, AITask, TaskModelSelection, AIConfig } from '../types';
import { YouTubeIcon, InstagramIcon, TikTokIcon, FacebookIcon, PinterestIcon, ProfileIcon, KeyIcon, SaveIcon, LightbulbIcon } from './icons/index';

const platformDetails: Record<Platform, { icon: React.ReactNode, color: string }> = {
    YouTube: { icon: <YouTubeIcon className="w-8 h-8"/>, color: 'text-red-500' },
    Instagram: { icon: <InstagramIcon className="w-8 h-8"/>, color: 'text-pink-500' },
    TikTok: { icon: <TikTokIcon className="w-8 h-8"/>, color: 'text-white' },
    Facebook: { icon: <FacebookIcon className="w-8 h-8"/>, color: 'text-blue-600' },
    Pinterest: { icon: <PinterestIcon className="w-8 h-8"/>, color: 'text-red-700' },
};

const taskLabels: Record<AITask, string> = {
    metadataGeneration: "Initial Video Analysis",
    contentGeneration: "Main Content & Idea Generation",
    editingSuggestions: "Editing Suggestions",
    imageEditing: "AI Image Editing",
    postTimeSuggestion: "Best Time to Post Suggestion",
    commentAnalysis: "Comment Sentiment Analysis",
    analyticsGeneration: "Performance Analytics Generation"
};

const ProfilePhase: React.FC = () => {
    const appContext = useContext(AppContext);
    if (!appContext) return null;

    const { user, setUser, connectedPlatforms, setConnectedPlatforms, aiConfig, setAiConfig, taskModelSelection, setTaskModelSelection, addActivity } = appContext;

    const [activeTab, setActiveTab] = useState<'profile' | 'connections' | 'backend'>('profile');
    const [tempUsername, setTempUsername] = useState(user.name);
    const [tempAiConfig, setTempAiConfig] = useState<AIConfig>(aiConfig);
    const [tempTaskModels, setTempTaskModels] = useState<TaskModelSelection>(taskModelSelection);
    const [isConnecting, setIsConnecting] = useState<Platform | null>(null);

    const handleDisconnect = (platform: Platform) => {
        setConnectedPlatforms(prev => ({
            ...prev,
            [platform]: { connected: false, username: null }
        }));
        addActivity(`Disconnected ${platform} account.`);
    };
    
    const handleConnect = (platform: Platform) => {
        setIsConnecting(platform);
        const width = 600, height = 700;
        const left = (window.innerWidth / 2) - (width / 2);
        const top = (window.innerHeight / 2) - (height / 2);

        const authWindow = window.open('', '_blank', `width=${width},height=${height},top=${top},left=${left}`);

        if (authWindow) {
            authWindow.document.write(`
                <html>
                <head>
                    <title>Authenticate with ${platform}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body class="bg-gray-900 text-white flex items-center justify-center h-screen p-4">
                    <div class="bg-gray-800 p-8 rounded-lg shadow-xl text-center w-full max-w-sm">
                        <h1 class="text-2xl font-bold mb-4">AI Social Studio</h1>
                        <p class="text-gray-400 mb-6">is requesting permission to access your ${platform} account.</p>
                        <div class="bg-gray-700 p-4 rounded-lg mb-6">
                            <p class="font-semibold text-white">This will allow AI Social Studio to:</p>
                            <ul class="text-sm text-gray-300 list-disc list-inside mt-2 text-left">
                                <li>View your profile information</li>
                                <li>Publish posts and videos on your behalf</li>
                                <li>View post analytics and comments</li>
                            </ul>
                        </div>
                        <button id="grant" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors">Grant Access</button>
                        <button id="deny" class="w-full mt-2 text-gray-400 text-sm hover:text-white">Deny</button>
                    </div>
                    <script>
                        document.getElementById('grant').onclick = () => {
                            window.opener.postMessage({ type: 'auth-success', platform: '${platform}' }, '*');
                            window.close();
                        };
                        document.getElementById('deny').onclick = () => {
                            window.opener.postMessage({ type: 'auth-fail', platform: '${platform}' }, '*');
                            window.close();
                        };
                    </script>
                </body>
                </html>
            `);
        }

        const handleAuthMessage = (event: MessageEvent) => {
            if (event.source !== authWindow) return;

            if (event.data.type === 'auth-success' && event.data.platform === platform) {
                setConnectedPlatforms(prev => ({
                    ...prev,
                    [platform]: { connected: true, username: `creator_${platform.toLowerCase()}` }
                }));
                addActivity(`Successfully connected ${platform} account.`);
            } else if (event.data.type === 'auth-fail') {
                 addActivity(`Connection to ${platform} was denied.`);
            }
            setIsConnecting(null);
            window.removeEventListener('message', handleAuthMessage);
        };
        
        window.addEventListener('message', handleAuthMessage);

        const timer = setInterval(() => {
            if (authWindow && authWindow.closed) {
                setIsConnecting(null);
                window.removeEventListener('message', handleAuthMessage);
                clearInterval(timer);
            }
        }, 500);
    };

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        setUser(prev => ({...prev, name: tempUsername}));
        addActivity('Updated profile username.');
        alert('Profile saved!');
    };
    
    const handleBackendSave = (e: React.FormEvent) => {
        e.preventDefault();
        setAiConfig(tempAiConfig);
        setTaskModelSelection(tempTaskModels);
        addActivity(`Updated AI backend settings.`);
        alert('AI backend settings saved!');
    };
    
    const handleApiKeyChange = (model: AIModel, key: string) => {
        setTempAiConfig(prev => ({
            ...prev,
            [model]: { apiKey: key }
        }));
    };
    
    const handleTaskModelChange = (task: AITask, model: AIModel) => {
        setTempTaskModels(prev => ({
            ...prev,
            [task]: model
        }));
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <form onSubmit={handleProfileSave} className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-4xl flex-shrink-0">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="User Avatar" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    user.name.charAt(0)
                                )}
                            </div>
                            <div className="text-center sm:text-left">
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
                            const connection = connectedPlatforms[platform];
                            const details = platformDetails[platform];
                            return (
                                <div key={platform} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-700 rounded-lg gap-4">
                                    <div className="flex items-center gap-4">
                                        <span className={details.color}>{details.icon}</span>
                                        <div>
                                            <span className="text-xl font-semibold text-white">{platform}</span>
                                             {connection.connected && connection.username && (
                                                <p className="text-xs text-gray-300">as @{connection.username}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => connection.connected ? handleDisconnect(platform) : handleConnect(platform)} 
                                        disabled={isConnecting !== null}
                                        className={`font-bold py-2 px-6 rounded-md transition-colors w-full sm:w-36 text-center disabled:opacity-50 disabled:cursor-wait ${ 
                                            connection.connected 
                                            ? 'bg-red-600 hover:bg-red-700' 
                                            : 'bg-indigo-600 hover:bg-indigo-700'
                                        } text-white`}
                                    >
                                        {isConnecting === platform ? 'Connecting...' : (connection.connected ? 'Disconnect' : 'Connect')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                 );
            case 'backend':
                return (
                    <form onSubmit={handleBackendSave} className="space-y-8">
                        <div>
                             <div className="flex items-center gap-3 text-indigo-300 mb-4">
                                <KeyIcon className="w-5 h-5" />
                                <h3 className="text-lg font-semibold">API Key Management</h3>
                            </div>
                            <div className="space-y-4">
                                {Object.values(AIModel).map(model => (
                                    <div key={model}>
                                        <label htmlFor={`api-key-${model}`} className="block text-sm font-medium text-gray-300 mb-1">{model} API Key</label>
                                        <input 
                                            type="password" 
                                            id={`api-key-${model}`} 
                                            value={tempAiConfig[model].apiKey || ''} 
                                            onChange={e => handleApiKeyChange(model, e.target.value)} 
                                            placeholder={`Enter your ${model} API key`}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="border-t border-gray-700 my-8"></div>

                        <div>
                            <div className="flex items-center gap-3 text-indigo-300 mb-4">
                                <LightbulbIcon className="w-5 h-5" />
                                <h3 className="text-lg font-semibold">Task Model Assignment</h3>
                            </div>
                             <div className="space-y-4">
                                {(Object.keys(taskLabels) as AITask[]).map(task => (
                                    <div key={task} className="grid grid-cols-1 md:grid-cols-2 items-center gap-2 md:gap-4">
                                        <label htmlFor={`task-model-${task}`} className="text-sm font-medium text-gray-300">{taskLabels[task]}</label>
                                        <select 
                                            id={`task-model-${task}`} 
                                            value={tempTaskModels[task]} 
                                            onChange={e => handleTaskModelChange(task, e.target.value as AIModel)}
                                            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            {Object.values(AIModel).map(model => (
                                                <option key={model} value={model}>{model}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-4">Note: This is a simulation. All requests will currently use the Gemini API regardless of selection.</p>
                        </div>
                        
                         <div className="flex justify-end pt-4">
                            <button type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                <SaveIcon className="w-5 h-5"/> Save AI Settings
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
                    <nav className="flex space-x-1 p-2 overflow-x-auto" aria-label="Tabs">
                        <button onClick={() => setActiveTab('profile')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Profile</button>
                        <button onClick={() => setActiveTab('connections')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'connections' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Connections</button>
                        <button onClick={() => setActiveTab('backend')} className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap ${activeTab === 'backend' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>AI Backend</button>
                    </nav>
                </div>
                <div className="p-4 sm:p-8">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default ProfilePhase;