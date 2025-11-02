import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { Post, Platform, AppPhase, AppContextType } from '../types';
import { generateAnalyticsForPost } from '../services/geminiService';
import { YouTubeIcon, InstagramIcon, TikTokIcon, FacebookIcon, PinterestIcon, CloseIcon, TrashIcon, AnalyticsIcon, ResetIcon } from './icons/index';
import Loader from './Loader';

const platformIcons: Record<Platform, React.FC<{className?: string}>> = {
  YouTube: YouTubeIcon,
  Instagram: InstagramIcon,
  TikTok: TikTokIcon,
  Facebook: FacebookIcon,
  Pinterest: PinterestIcon,
};

const PreviewModal: React.FC<{ post: Post; onClose: () => void; onCancel: (post: Post) => void; onUpdateAnalytics: (postId: string, newAnalytics: Post['analytics']) => void }> = ({ post, onClose, onCancel, onUpdateAnalytics }) => {
    const appContext = useContext(AppContext as React.Context<AppContextType>);
    const Icon = platformIcons[post.platform];
    const isPastPost = new Date(post.scheduledAt) < new Date();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefreshAnalytics = async () => {
        setIsRefreshing(true);
        try {
            const { aiConfig, taskModelSelection } = appContext;
            const newAnalytics = await generateAnalyticsForPost(post, { aiConfig, taskModelSelection });
            onUpdateAnalytics(post.id, newAnalytics);
        } catch (error) {
            console.error("Failed to refresh analytics:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg m-4 border border-gray-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <Icon className="w-6 h-6 text-indigo-400"/>
                        <h3 className="text-xl font-bold text-white">{post.platform} {isPastPost ? 'Report' : 'Preview'}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><CloseIcon className="w-6 h-6"/></button>
                </div>
                <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {post.mediaType === 'video' ? (
                        <video src={post.mediaUrl} controls muted className="w-full rounded-lg bg-black" />
                    ) : (
                        <img src={post.mediaUrl} alt={post.title} className="w-full rounded-lg bg-black" />
                    )}
                    {isPastPost && (
                        <div>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                                <h4 className="text-lg font-bold text-gray-100">Post Performance</h4>
                                <button onClick={handleRefreshAnalytics} disabled={isRefreshing} className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 text-white font-semibold py-1 px-3 rounded-lg transition-colors disabled:opacity-50">
                                    {isRefreshing ? <><Loader /> Refreshing...</> : <><ResetIcon className="w-4 h-4" /> Refresh</>}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="bg-gray-700 p-3 rounded-lg">
                                    <p className="text-sm text-gray-400">Views</p>
                                    <p className="text-xl sm:text-2xl font-bold text-white">{post.analytics.views.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-700 p-3 rounded-lg">
                                    <p className="text-sm text-gray-400">Likes</p>
                                    <p className="text-xl sm:text-2xl font-bold text-white">{post.analytics.likes.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-700 p-3 rounded-lg">
                                    <p className="text-sm text-gray-400">Shares</p>
                                    <p className="text-xl sm:text-2xl font-bold text-white">{post.analytics.shares.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-700 p-3 rounded-lg">
                                    <p className="text-sm text-gray-400">Comments</p>
                                    <p className="text-xl sm:text-2xl font-bold text-white">{post.analytics.comments.toLocaleString()}</p>
                                </div>
                            </div>
                            <hr className="my-4 border-gray-600" />
                        </div>
                    )}
                    <h4 className="text-lg font-bold text-gray-100">{post.title}</h4>
                    <p className="text-gray-300 whitespace-pre-wrap">{post.description}</p>
                    <div className="flex flex-wrap gap-2">
                        {post.hashtags.map(tag => (
                            <span key={tag} className="text-sm text-indigo-300 bg-indigo-900/50 px-2 py-1 rounded">#{tag}</span>
                        ))}
                    </div>
                </div>
                {!isPastPost && (
                    <div className="p-4 bg-gray-900/50 border-t border-gray-700 flex justify-end">
                        <button 
                            onClick={() => onCancel(post)}
                            className="flex items-center gap-2 bg-red-600 text-white font-bold py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                        >
                            <TrashIcon className="w-5 h-5" />
                            Cancel Schedule
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const CalendarPhase: React.FC = () => {
    const appContext = useContext(AppContext);
    if (!appContext) return null;
    const { posts, setPosts, setGeneratedContent, setPhase, addActivity } = appContext;

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'list'>('list');
    const [previewPost, setPreviewPost] = useState<Post | null>(null);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay(); // 0 = Sunday, 1 = Monday, ...
    const daysInMonth = endOfMonth.getDate();
    
    const days = Array.from({ length: startDay }, (_, i) => null).concat(
        Array.from({ length: daysInMonth }, (_, i) => i + 1)
    );

    const postsByDate: { [key: string]: Post[] } = {};
    posts.forEach(post => {
        const postDate = new Date(post.scheduledAt);
        if (postDate.getFullYear() === currentDate.getFullYear() && postDate.getMonth() === currentDate.getMonth()) {
            const day = postDate.getDate();
            if (!postsByDate[day]) {
                postsByDate[day] = [];
            }
            postsByDate[day].push(post);
        }
    });

    const changeMonth = (offset: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    };
    
    const handleCancelSchedule = (postToCancel: Post) => {
        setPosts(prevPosts => prevPosts.filter(p => p.id !== postToCancel.id));
        setGeneratedContent(prev => {
            if (!prev) return null;
            const newContent = { ...prev };
            if (newContent[postToCancel.platform]) {
                newContent[postToCancel.platform].scheduledAt = null;
            }
            return newContent;
        });
        addActivity(`Cancelled post for ${postToCancel.platform}: "${postToCancel.title}"`);
        setPreviewPost(null); 
    };
    
    const handleUpdateAnalytics = (postId: string, newAnalytics: Post['analytics']) => {
        setPosts(prevPosts => prevPosts.map(p => p.id === postId ? { ...p, analytics: newAnalytics } : p));
        setPreviewPost(prev => prev ? { ...prev, analytics: newAnalytics } : null);
        addActivity(`Refreshed analytics for post: "${posts.find(p=>p.id===postId)?.title}"`);
    }

    const sortedPosts = [...posts].sort((a,b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    
    if (posts.length === 0) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-gray-400">No posts scheduled yet.</h2>
                <p className="text-gray-500">Go to the "Generate" phase to schedule some posts first.</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {previewPost && <PreviewModal post={previewPost} onClose={() => setPreviewPost(null)} onCancel={handleCancelSchedule} onUpdateAnalytics={handleUpdateAnalytics} />}
            <h2 className="text-3xl font-bold text-center mb-2 text-indigo-400">Content Calendar</h2>
            <p className="text-center text-gray-400 mb-8">View your scheduled posts across all platforms.</p>
            
            <div className="bg-gray-800 p-2 sm:p-6 rounded-lg shadow-xl">
                 <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                    <div className="flex items-center gap-2">
                         <h3 className="text-xl font-bold">{viewMode === 'month' ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }) : 'All Scheduled Posts'}</h3>
                         {viewMode === 'month' && (
                             <>
                                <button onClick={() => changeMonth(-1)} className="bg-gray-700 hover:bg-indigo-600 px-3 py-1 rounded-md transition-colors text-sm">&larr;</button>
                                <button onClick={() => changeMonth(1)} className="bg-gray-700 hover:bg-indigo-600 px-3 py-1 rounded-md transition-colors text-sm">&rarr;</button>
                            </>
                         )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <div className="flex gap-2 bg-gray-700 p-1 rounded-lg">
                            <button onClick={() => setViewMode('month')} className={`px-3 py-1 text-sm font-semibold rounded-md ${viewMode === 'month' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Month</button>
                            <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm font-semibold rounded-md ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>List</button>
                        </div>
                        <button onClick={() => setPhase(AppPhase.ANALYTICS)} className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                            <AnalyticsIcon className="w-4 h-4"/> Full Report
                        </button>
                    </div>
                </div>

                {viewMode === 'month' ? (
                    <>
                        <div className="grid grid-cols-7 gap-1 text-center font-bold text-gray-400 mb-2 text-xs sm:text-base">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day}>{day}</div>)}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((day, index) => {
                                const dayPosts = day ? postsByDate[day] : [];
                                const isPast = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day + 1) < new Date() : false;
                                return (
                                    <div key={index} className={`h-24 md:h-32 lg:h-36 bg-gray-900/50 rounded-md p-1.5 border border-gray-700/50 ${day ? '' : 'opacity-50'} ${isPast ? 'bg-gray-900/80' : ''}`}>
                                        {day && (
                                            <>
                                                <div className={`font-bold text-xs sm:text-sm text-right pr-1 ${isPast ? 'text-gray-500': ''}`}>{day}</div>
                                                <div className="space-y-1 overflow-y-auto max-h-28">
                                                    {dayPosts?.map(post => {
                                                        const Icon = platformIcons[post.platform];
                                                        return (
                                                            <div key={post.id} onClick={() => setPreviewPost(post)} className="bg-gray-700 p-1 rounded text-left flex items-center gap-1.5 text-xs cursor-pointer hover:bg-indigo-800" title={post.title}>
                                                                <Icon className="w-4 h-4 flex-shrink-0"/>
                                                                <span className="truncate text-gray-200 hidden sm:inline">{post.title}</span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </>
                ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {sortedPosts.map(post => {
                             const Icon = platformIcons[post.platform];
                             const postDate = new Date(post.scheduledAt);
                             const isPast = postDate < new Date();
                             return (
                                 <div key={post.id} onClick={() => setPreviewPost(post)} className={`p-4 rounded-lg flex items-center gap-4 cursor-pointer transition-colors ${isPast ? 'bg-gray-900/50 hover:bg-gray-700/70' : 'bg-gray-900/70 hover:bg-gray-700'}`}>
                                     <Icon className={`w-8 h-8 flex-shrink-0 ${isPast ? 'text-gray-500' : 'text-indigo-400'}`}/>
                                     <div className="flex-grow min-w-0">
                                        <p className={`font-bold truncate ${isPast ? 'text-gray-400' : 'text-white'}`}>{post.title}</p>
                                        <p className="text-sm text-gray-400">{post.platform}</p>
                                     </div>
                                     <div className="text-right flex-shrink-0">
                                        <p className={`font-semibold ${isPast ? 'text-gray-500' : 'text-gray-300'}`}>{postDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                                        <p className="text-sm text-gray-400">{postDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p>
                                     </div>
                                 </div>
                             );
                        })}
                    </div>
                )}
            </div>

            <div className="mt-8 flex justify-start">
                <button
                    onClick={() => setPhase(AppPhase.DASHBOARD)}
                    className="bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                    &larr; Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default CalendarPhase;