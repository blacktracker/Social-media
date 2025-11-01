import React, { useContext, useState, useEffect, useMemo, FC } from 'react';
import { AppContext } from '../App';
import { AppPhase, Platform, Post, PlatformContent, EditState } from '../types';
import { generateBestPostTimes } from '../services/geminiService';
import { YouTubeIcon, InstagramIcon, TikTokIcon, FacebookIcon, PinterestIcon } from './icons/index';
import Loader from './Loader';

const platformIcons: Record<Platform, React.ReactNode> = {
  YouTube: <YouTubeIcon className="w-6 h-6"/>,
  Instagram: <InstagramIcon className="w-6 h-6"/>,
  TikTok: <TikTokIcon className="w-6 h-6"/>,
  Facebook: <FacebookIcon className="w-6 h-6"/>,
  Pinterest: <PinterestIcon className="w-6 h-6"/>,
};

const filterMap: Record<string, string> = {
    'Vibrant': 'saturate(1.5) contrast(1.1)',
    'Cinematic': 'contrast(1.2) saturate(1.1)',
    'Vintage': 'sepia(0.6)',
    'Black & White': 'grayscale(1)',
};

// Platform-specific aspect ratios
const platformCrops: Record<Platform, string> = {
    YouTube: 'aspect-video',
    Instagram: 'aspect-square',
    TikTok: 'aspect-[9/16]',
    Facebook: 'aspect-square',
    Pinterest: 'aspect-[2/3]',
};

interface PlatformCardProps {
    platform: Platform;
    content: PlatformContent;
    mediaUrl: string | null;
    mediaType: 'video' | 'image';
    edits: EditState | null;
    onContentChange: (platform: Platform, field: 'title' | 'description' | 'hashtags', value: string) => void;
    onSchedule: (platform: Platform, scheduleTime: string) => void;
    isSuggestingTime: boolean;
    suggestedTime?: string;
}

const PlatformScheduleCard: FC<PlatformCardProps> = ({ platform, content, mediaUrl, mediaType, edits, onContentChange, onSchedule, isSuggestingTime, suggestedTime }) => {
    const [scheduleDateTime, setScheduleDateTime] = useState('');
    const appContext = useContext(AppContext);

    useEffect(() => {
        if (content.scheduledAt) {
            setScheduleDateTime(new Date(content.scheduledAt).toISOString().substring(0, 16));
        } else if (suggestedTime) {
            setScheduleDateTime(suggestedTime);
        } else if (!isSuggestingTime) {
            const fallbackTime = new Date(Date.now() + 60 * 60 * 1000).toISOString().substring(0, 16);
            setScheduleDateTime(fallbackTime);
        }
    }, [content.scheduledAt, suggestedTime, isSuggestingTime]);
    
    const mediaSrc = useMemo(() => {
        if (!mediaUrl) return '';
        if (mediaType === 'video' && edits?.trim) {
            return `${mediaUrl}#t=${edits.trim.start},${edits.trim.end}`;
        }
        return mediaUrl;
    }, [mediaUrl, edits?.trim, mediaType]);

    const cropClass = platformCrops[platform] || 'aspect-video';

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl flex flex-col overflow-hidden">
            <div className="p-4 flex items-center gap-3 border-b border-gray-700 bg-gray-700/50">
                {platformIcons[platform]}
                <h3 className="font-bold text-lg">{platform}</h3>
                {content.scheduledAt && <span className="text-xs font-bold text-green-400 bg-green-900/50 px-2 py-0.5 rounded-full">Scheduled</span>}
            </div>

            <div className="p-4 space-y-3 overflow-y-auto">
                <div className={`relative w-full bg-black rounded-lg mx-auto ${cropClass}`}>
                    {mediaUrl && mediaType === 'video' ? (
                         <video 
                            key={mediaSrc} 
                            muted
                            loop
                            playsInline
                            className="w-full h-full object-cover"
                            style={{ filter: edits?.filter && filterMap[edits.filter] ? filterMap[edits.filter] : 'none' }}
                        >
                            <source src={mediaSrc} type={appContext?.videoData?.file?.type || 'video/mp4'} />
                        </video>
                    ) : mediaUrl && mediaType === 'image' ? (
                        <img src={mediaUrl} alt="Generated Content" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-center p-2">
                             <p className="text-gray-400 text-sm">No media available.</p>
                        </div>
                    )}
                </div>
                 <div>
                    <label className="text-xs font-semibold text-gray-400">Title</label>
                    <input type="text" value={content.title} onChange={e => onContentChange(platform, 'title', e.target.value)} className="w-full text-sm bg-gray-700 border border-gray-600 rounded-md px-2 py-1 mt-1 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-400">Description</label>
                    <textarea rows={3} value={content.description} onChange={e => onContentChange(platform, 'description', e.target.value)} className="w-full text-sm bg-gray-700 border border-gray-600 rounded-md px-2 py-1 mt-1 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-400">Hashtags</label>
                    <input type="text" value={content.hashtags.join(', ')} onChange={e => onContentChange(platform, 'hashtags', e.target.value)} className="w-full text-sm bg-gray-700 border border-gray-600 rounded-md px-2 py-1 mt-1 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
            </div>
            <div className="p-4 mt-auto border-t border-gray-700 bg-gray-800">
                <label className="block text-xs font-medium text-gray-300 mb-1">
                    Schedule Time {isSuggestingTime && <span className="text-xs text-yellow-400 ml-2">(AI is suggesting...)</span>}
                </label>
                <div className="flex gap-2">
                    <input 
                        type="datetime-local" 
                        value={scheduleDateTime}
                        onChange={e => setScheduleDateTime(e.target.value)}
                        className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-2 py-1.5 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={isSuggestingTime || !!content.scheduledAt}
                    />
                    <button onClick={() => onSchedule(platform, scheduleDateTime)} disabled={isSuggestingTime || !!content.scheduledAt || !scheduleDateTime} className="bg-green-600 text-white font-bold py-1 px-3 text-sm rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {content.scheduledAt ? 'Scheduled' : 'Set'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const GenerationPhase: React.FC = () => {
    const appContext = useContext(AppContext);
    if (!appContext) return null;

    const { generatedContent, setGeneratedContent, videoData, videoUrl, imageData, setPhase, posts, setPosts, connectedPlatforms, edits, addActivity, aiConfig, taskModelSelection } = appContext;
    
    const [isSuggestingTimes, setIsSuggestingTimes] = useState(false);
    const [suggestedTimes, setSuggestedTimes] = useState<Partial<Record<Platform, string>>>({});
    
    const mediaUrl = videoUrl || imageData?.base64;
    const mediaType = videoUrl ? 'video' : 'image';
    const contentType = videoData?.contentType || (imageData ? 'Image Post' : 'General');


    const connectedAndGeneratedPlatforms = useMemo(() => {
        if (!generatedContent) return [];
        return (Object.keys(generatedContent) as Platform[]).filter(p => connectedPlatforms[p].connected);
    }, [generatedContent, connectedPlatforms]);
    
    const allScheduled = useMemo(() => {
        if (connectedAndGeneratedPlatforms.length === 0) return true;
        return connectedAndGeneratedPlatforms.every(p => generatedContent?.[p]?.scheduledAt);
    }, [connectedAndGeneratedPlatforms, generatedContent]);

    useEffect(() => {
        const fetchAllBestTimes = async () => {
            if (contentType && connectedAndGeneratedPlatforms.length > 0 && Object.keys(suggestedTimes).length === 0) {
                setIsSuggestingTimes(true);
                try {
                    const times = await generateBestPostTimes(connectedAndGeneratedPlatforms, contentType, { aiConfig, taskModelSelection });
                    const formattedTimes: Partial<Record<Platform, string>> = {};
                    for (const platform of connectedAndGeneratedPlatforms) {
                        if(times[platform]) {
                           formattedTimes[platform] = times[platform].bestTimeISO.substring(0, 16);
                        }
                    }
                    setSuggestedTimes(formattedTimes);
                } catch (error) {
                    console.error('Failed to fetch suggested times:', error);
                } finally {
                    setIsSuggestingTimes(false);
                }
            }
        };

        fetchAllBestTimes();
    }, [contentType, connectedAndGeneratedPlatforms, suggestedTimes, aiConfig, taskModelSelection]);


    if (!generatedContent || !mediaUrl) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-gray-400">No content to schedule.</h2>
                <p className="text-gray-500">Go to the "Create" phase first.</p>
            </div>
        );
    }

    const handleContentChange = (platform: Platform, field: 'title' | 'description' | 'hashtags', value: string) => {
        const platformContent = generatedContent[platform];
        if (!platformContent) return;
        
        const newContent = { ...platformContent };
        if (field === 'hashtags') {
            newContent[field] = value.split(',').map(tag => tag.trim());
        } else {
            newContent[field] = value;
        }

        setGeneratedContent(prev => prev ? {
            ...prev,
            [platform]: newContent
        } : null);
    };

    const handleSchedule = (platform: Platform, scheduleDateTime: string) => {
        if (!scheduleDateTime) {
            alert('Please select a date and time to schedule.');
            return;
        }

        const selectedContent = generatedContent[platform];
        if (!selectedContent) return;
        
        const scheduledAtISO = new Date(scheduleDateTime).toISOString();

        const newPost: Post = {
            id: `${platform}-${scheduledAtISO}`,
            platform: platform,
            title: selectedContent.title,
            description: selectedContent.description,
            hashtags: selectedContent.hashtags,
            scheduledAt: scheduledAtISO,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            analytics: { views: 0, likes: 0, shares: 0, comments: 0 },
            comments: []
        };
        
        const wasEmpty = posts.length === 0;

        setPosts(prevPosts => [...prevPosts.filter(p => p.id !== newPost.id), newPost]);

        setGeneratedContent(prev => prev ? {
            ...prev,
            [platform]: { ...selectedContent, scheduledAt: scheduledAtISO }
        } : null);
        
        addActivity(`Scheduled post for ${platform}: "${selectedContent.title}"`);

        if(wasEmpty) {
            setPhase(AppPhase.CALENDAR);
        }
    };
    
    const handleScheduleAll = () => {
        if (!generatedContent) return;
        
        const platformsToSchedule = connectedAndGeneratedPlatforms.filter(p => !generatedContent[p]?.scheduledAt);
        if (platformsToSchedule.length === 0) return;

        const newPosts: Post[] = [];
        const newGeneratedContent = { ...generatedContent };

        platformsToSchedule.forEach(platform => {
            const selectedContent = generatedContent[platform];
            if (!selectedContent) return;

            const scheduleDateTime = suggestedTimes[platform] || new Date(Date.now() + 60 * 60 * 1000).toISOString().substring(0, 16);
            const scheduledAtISO = new Date(scheduleDateTime).toISOString();

            const newPost: Post = {
                id: `${platform}-${scheduledAtISO}`,
                platform: platform,
                title: selectedContent.title,
                description: selectedContent.description,
                hashtags: selectedContent.hashtags,
                scheduledAt: scheduledAtISO,
                mediaUrl: mediaUrl,
                mediaType: mediaType,
                analytics: { views: 0, likes: 0, shares: 0, comments: 0 },
                comments: []
            };
            newPosts.push(newPost);
            newGeneratedContent[platform] = { ...selectedContent, scheduledAt: scheduledAtISO };
            addActivity(`Scheduled post for ${platform}: "${selectedContent.title}"`);
        });

        setPosts(prevPosts => [...prevPosts, ...newPosts]);
        setGeneratedContent(newGeneratedContent);
        setPhase(AppPhase.CALENDAR);
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <div>
                    <h2 className="text-3xl font-bold text-indigo-400">Phase 3: Review & Schedule</h2>
                    <p className="text-gray-400">Finalize content for each platform and schedule your posts.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleScheduleAll}
                        disabled={allScheduled}
                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        Schedule All
                    </button>
                    <button 
                        onClick={() => setPhase(AppPhase.CALENDAR)} 
                        disabled={posts.length === 0}
                        className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed"
                    >
                        View Calendar &rarr;
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {connectedAndGeneratedPlatforms.map(platform => (
                    <PlatformScheduleCard
                        key={platform}
                        platform={platform}
                        content={generatedContent[platform]}
                        mediaUrl={mediaUrl}
                        mediaType={mediaType}
                        edits={edits}
                        onContentChange={handleContentChange}
                        onSchedule={handleSchedule}
                        isSuggestingTime={isSuggestingTimes}
                        suggestedTime={suggestedTimes[platform]}
                    />
                 ))}
            </div>
        </div>
    );
};

export default GenerationPhase;