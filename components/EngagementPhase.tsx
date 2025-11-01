import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AppContext } from '../App';
import { Post, Comment, Platform, AppPhase } from '../types';
import { generateCommentsWithReplies } from '../services/geminiService';
import { YouTubeIcon, InstagramIcon, TikTokIcon, FacebookIcon, PinterestIcon } from './icons/index';
import Loader from './Loader';

const platformIcons: Record<Platform, React.ReactNode> = {
  YouTube: <YouTubeIcon className="w-5 h-5"/>,
  Instagram: <InstagramIcon className="w-5 h-5"/>,
  TikTok: <TikTokIcon className="w-5 h-5"/>,
  Facebook: <FacebookIcon className="w-5 h-5"/>,
  Pinterest: <PinterestIcon className="w-5 h-5"/>,
};

const EngagementPhase: React.FC = () => {
    const appContext = useContext(AppContext);
    if (!appContext) return null;
    const { posts, videoData, setPhase } = appContext;
    const [localPosts, setLocalPosts] = useState<Post[]>(posts);
    const [isLoading, setIsLoading] = useState(false);

    const processEngagement = useCallback(async (post: Post, index: number) => {
        if (!videoData) return;
        const fetchedComments = await generateCommentsWithReplies(post.title, videoData.description);
        
        const processedComments = fetchedComments.map((comment: Comment) => {
            if (comment.sentiment === 'positive') {
                return { ...comment, autoLiked: true };
            }
            return comment;
        });

        setLocalPosts(prev => {
            const newPosts = [...prev];
            newPosts[index].comments = processedComments;
            return newPosts;
        });
    }, [videoData]);

    useEffect(() => {
        const runEngagement = async () => {
            setIsLoading(true);
            const postsToProcess = posts.filter(p => p.comments.length === 0);
            await Promise.all(postsToProcess.map(async (post, idx) => {
                const originalIndex = posts.findIndex(p => p.platform === post.platform);
                await processEngagement(post, originalIndex);
            }));
            setIsLoading(false);
        };

        if (posts.length > 0 && posts.some(p => p.comments.length === 0)) {
            runEngagement();
        } else {
            setLocalPosts(posts);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [posts]);
    
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
            <h2 className="text-3xl font-bold text-center mb-2 text-indigo-400">Phase 4: Automated Engagement</h2>
            <p className="text-center text-gray-400 mb-8">AI monitors comments, auto-likes positive feedback, and drafts replies.</p>
            
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full mt-20">
                    <Loader />
                    <p className="mt-4 text-lg text-gray-300">AI is analyzing comments and engaging...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {localPosts.map(post => (
                        <div key={post.platform} className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
                            <div className="p-4 bg-gray-700/50 flex items-center gap-3 border-b border-gray-700">
                                {platformIcons[post.platform]}
                                <h3 className="font-bold text-lg">{post.platform} Post</h3>
                            </div>
                            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
                                <p className="text-sm font-semibold text-gray-300 line-clamp-2">"{post.title}"</p>
                                {post.comments.length === 0 && <p className="text-sm text-gray-500">No comments yet.</p>}
                                {post.comments.map((comment, i) => (
                                    <div key={i} className="bg-gray-900 p-3 rounded-md">
                                        <p className="font-semibold text-sm text-indigo-400">@{comment.author}</p>
                                        <p className="text-sm text-gray-300 my-1">"{comment.comment}"</p>
                                        <div className="flex items-center gap-4 text-xs mt-2">
                                            {comment.sentiment === 'positive' && <span className="text-green-400 bg-green-900/50 px-2 py-1 rounded">Positive</span>}
                                            {comment.sentiment === 'neutral' && <span className="text-yellow-400 bg-yellow-900/50 px-2 py-1 rounded">Neutral</span>}
                                            {comment.sentiment === 'negative' && <span className="text-red-400 bg-red-900/50 px-2 py-1 rounded">Needs Review</span>}
                                            {comment.autoLiked && <span className="text-blue-400">Auto-Liked 👍</span>}
                                        </div>
                                        {comment.autoReply && (
                                            <div className="mt-2 border-t border-gray-700 pt-2">
                                                <p className="text-xs font-bold text-gray-400">AI Suggested Reply:</p>
                                                <p className="text-sm text-gray-300 italic">"{comment.autoReply}"</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
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

export default EngagementPhase;