import React, { useContext } from 'react';
import { AppContext } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Platform, AppPhase } from '../types';

const AnalyticsPhase: React.FC = () => {
    const appContext = useContext(AppContext);
    if (!appContext) return null;
    const { posts, setPhase } = appContext;

    if (posts.length === 0) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-gray-400">No data to analyze.</h2>
                <p className="text-gray-500">Schedule some posts in the "Generate" phase to see analytics.</p>
            </div>
        );
    }
    
    const chartData = posts.map(post => ({
        name: post.platform,
        views: post.analytics.views,
        likes: post.analytics.likes,
        shares: post.analytics.shares,
    }));
    
    const totalViews = posts.reduce((sum, p) => sum + p.analytics.views, 0);
    const totalLikes = posts.reduce((sum, p) => sum + p.analytics.likes, 0);
    const totalShares = posts.reduce((sum, p) => sum + p.analytics.shares, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.analytics.comments, 0);

    const platformPerformance = posts.reduce((acc, post) => {
        if (!acc[post.platform]) {
            acc[post.platform] = { totalLikes: 0, count: 0 };
        }
        acc[post.platform].totalLikes += post.analytics.likes;
        acc[post.platform].count += 1;
        return acc;
    }, {} as Record<Platform, { totalLikes: number; count: number }>);

    let bestPlatform: Platform | 'N/A' = 'N/A';
    let maxAvgLikes = -1;

    for (const p in platformPerformance) {
        const platform = p as Platform;
        const avgLikes = platformPerformance[platform].totalLikes / platformPerformance[platform].count;
        if (avgLikes > maxAvgLikes) {
            maxAvgLikes = avgLikes;
            bestPlatform = platform;
        }
    }


    return (
        <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-2 text-indigo-400">Phase 5: Performance Analytics</h2>
            <p className="text-center text-gray-400 mb-8">Track key metrics across platforms to refine your strategy.</p>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center">
                    <h3 className="text-gray-400 text-sm font-medium">Total Views</h3>
                    <p className="text-3xl font-bold text-white">{totalViews.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center">
                    <h3 className="text-gray-400 text-sm font-medium">Total Likes</h3>
                    <p className="text-3xl font-bold text-white">{totalLikes.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center">
                    <h3 className="text-gray-400 text-sm font-medium">Total Shares</h3>
                    <p className="text-3xl font-bold text-white">{totalShares.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-center">
                    <h3 className="text-gray-400 text-sm font-medium">Total Comments</h3>
                    <p className="text-3xl font-bold text-white">{totalComments.toLocaleString()}</p>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-white">Performance by Platform</h3>
                <div style={{ width: '100%', height: 400 }}>
                    <ResponsiveContainer>
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 5, right: 30, left: 20, bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                            <XAxis dataKey="name" stroke="#A0AEC0" />
                            <YAxis stroke="#A0AEC0" />
                            <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                            <Legend wrapperStyle={{ color: '#E2E8F0' }} />
                            <Bar dataKey="views" fill="#818CF8" />
                            <Bar dataKey="likes" fill="#34D399" />
                            <Bar dataKey="shares" fill="#FBBF24" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
             {/* Insights */}
             <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-xl">
                <h3 className="text-xl font-bold text-white mb-2">AI Insights</h3>
                <p className="text-gray-300">
                    {bestPlatform !== 'N/A' ? 
                    <>Based on average likes, your best performing platform is <span className="font-bold text-green-400">{bestPlatform}</span>. Consider creating more content tailored for its audience.</>
                    : 'Not enough data to generate insights.'}
                </p>
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

export default AnalyticsPhase;