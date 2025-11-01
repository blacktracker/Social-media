import React, { useContext } from 'react';
import { AppContext } from '../App';
import { AppPhase, Platform, Activity } from '../types';
import { CreateIcon, CalendarIcon, EngagementIcon, AnalyticsIcon, YouTubeIcon, InstagramIcon, TikTokIcon, FacebookIcon, PinterestIcon } from './icons/index';

const platformIcons: Record<Platform, React.FC<{className?: string}>> = {
  YouTube: YouTubeIcon,
  Instagram: InstagramIcon,
  TikTok: TikTokIcon,
  Facebook: FacebookIcon,
  Pinterest: PinterestIcon,
};

const Dashboard: React.FC = () => {
    const appContext = useContext(AppContext);
    if (!appContext) return null;

    const { setPhase, connectedPlatforms, posts, activityLog } = appContext;
    const connectedCount = Object.values(connectedPlatforms).filter(Boolean).length;

    const now = new Date();
    const upcomingPosts = posts
        .filter(p => new Date(p.scheduledAt) > now)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 3);
        
    const pastPostsCount = posts.filter(p => new Date(p.scheduledAt) <= now).length;

    const navCards = [
        {
            phase: AppPhase.UPLOAD,
            title: 'Create Content',
            description: 'Upload a video or generate a new concept from an idea.',
            icon: <CreateIcon className="w-10 h-10 text-indigo-400"/>,
            color: 'border-indigo-500'
        },
        {
            phase: AppPhase.CALENDAR,
            title: 'Content Calendar',
            description: 'View and manage your past and future scheduled posts.',
            icon: <CalendarIcon className="w-10 h-10 text-green-400"/>,
            color: 'border-green-500'
        },
        {
            phase: AppPhase.ENGAGEMENT,
            title: 'Check Engagement',
            description: 'Let AI monitor comments and suggest replies for your posts.',
            icon: <EngagementIcon className="w-10 h-10 text-blue-400"/>,
            color: 'border-blue-500'
        },
        {
            phase: AppPhase.ANALYTICS,
            title: 'Analyze Performance',
            description: 'Track key metrics to understand your content\'s impact.',
            icon: <AnalyticsIcon className="w-10 h-10 text-yellow-400"/>,
            color: 'border-yellow-500'
        }
    ];
    
    const timeAgo = (timestamp: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    }

    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">Dashboard</h2>
            <p className="text-gray-400 mb-8 text-lg">Here's a snapshot of your social media activity.</p>

            {/* Stats & Upcoming */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                <div className="lg:col-span-1 grid grid-rows-2 gap-6">
                     <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <p className="text-gray-400 text-sm font-medium">Scheduled / Past Posts</p>
                        <p className="text-4xl font-bold text-white">{posts.length - pastPostsCount} / {pastPostsCount}</p>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <p className="text-gray-400 text-sm font-medium">Connected Accounts</p>
                        <p className="text-4xl font-bold text-white">{connectedCount} / 5</p>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4">Upcoming Posts</h3>
                    {upcomingPosts.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingPosts.map(post => {
                                const Icon = platformIcons[post.platform];
                                const postDate = new Date(post.scheduledAt);
                                return (
                                    <div key={post.id} className="bg-gray-700/50 p-3 rounded-lg flex items-center gap-4">
                                        <Icon className="w-8 h-8 flex-shrink-0 text-indigo-400" />
                                        <div className="flex-grow">
                                            <p className="font-bold truncate text-white">{post.title}</p>
                                            <p className="text-sm text-gray-400">{post.platform}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-semibold text-gray-300">{postDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                                            <p className="text-sm text-gray-400">{postDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-gray-500">
                            <p>No upcoming posts. <br/> Click 'Create Content' to get started!</p>
                        </div>
                    )}
                </div>
            </div>
            
             <h3 className="text-2xl font-bold text-white mb-4 mt-10">Workflow</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {navCards.map(card => (
                    <button
                        key={card.phase}
                        onClick={() => setPhase(card.phase)}
                        className={`bg-gray-800 p-6 rounded-lg shadow-lg text-left border-l-4 ${card.color} hover:bg-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                    >
                        <div className="mb-4">{card.icon}</div>
                        <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                        <p className="text-gray-400 text-sm">{card.description}</p>
                    </button>
                ))}
            </div>

            {/* Recent Activity */}
            <div className="mt-10">
                <h3 className="text-2xl font-bold text-white mb-4">Recent Activity</h3>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    {activityLog.length > 0 ? (
                        <ul className="space-y-3">
                            {activityLog.map((activity: Activity) => (
                                <li key={activity.id} className="flex justify-between items-center text-sm text-gray-300 border-b border-gray-700/50 pb-2">
                                    <span>{activity.text}</span>
                                    <span className="text-xs text-gray-500">{timeAgo(activity.timestamp)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                         <div className="text-center text-gray-500 py-4">
                            <p>No recent activity. Get started by creating some content!</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Dashboard;