import React, { useState, useEffect, createContext } from 'react';
import { AppPhase, VideoData, GeneratedContent, Post, Platform, AppContextType, EditState, EditingSuggestions, User, AIConfig, AIModel, Activity } from './types';
import Sidebar from './components/Sidebar';
import StartPhase from './components/UploadPhase';
import EditingPhase from './components/EditingPhase';
import GenerationPhase from './components/GenerationPhase';
import EngagementPhase from './components/EngagementPhase';
import AnalyticsPhase from './components/AnalyticsPhase';
import Dashboard from './components/Dashboard';
import CalendarPhase from './components/CalendarPhase';
import ProfilePhase from './components/ProfilePhase';
import { generateContentAndSuggestions, generateContentFromIdea } from './services/geminiService';

export const AppContext = createContext<AppContextType | null>(null);

const App: React.FC = () => {
    const [phase, setPhase] = useState<AppPhase>(AppPhase.DASHBOARD);
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [edits, setEdits] = useState<EditState | null>(null);
    const [editingSuggestions, setEditingSuggestions] = useState<EditingSuggestions | null>(null);
    const [connectedPlatforms, setConnectedPlatforms] = useState<Record<Platform, boolean>>({
        YouTube: true,
        Instagram: true,
        TikTok: true,
        Facebook: false,
        Pinterest: false,
    });
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User>({ name: 'Content Creator', avatar: null });
    const [aiConfig, setAiConfig] = useState<AIConfig>({ model: AIModel.GEMINI, apiKey: null });
    const [activityLog, setActivityLog] = useState<Activity[]>([]);

    useEffect(() => {
        if (videoData?.file) {
            const url = URL.createObjectURL(videoData.file);
            setVideoUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [videoData?.file]);

    const addActivity = (text: string) => {
        const newActivity: Activity = {
            id: Date.now(),
            text,
            timestamp: new Date().toISOString(),
        };
        setActivityLog(prev => [newActivity, ...prev].slice(0, 10)); // Keep last 10 activities
    };

    const handleGenerateFromUpload = async (data: VideoData) => {
        setVideoData(data);
        setError(null);
        setEdits(null);
        setGeneratedContent(null);
        setEditingSuggestions(null);
        setPhase(AppPhase.EDITING); // Navigate immediately
        addActivity(`Uploaded video: "${data.file?.name}"`);
        try {
            const { content, suggestions } = await generateContentAndSuggestions(data);
            setGeneratedContent(content);
            setEditingSuggestions(suggestions);
            addActivity(`Generated content for "${data.title}"`);
        } catch (e) {
            setError('Failed to generate content. Please check your API key and try again.');
            console.error(e);
            setPhase(AppPhase.UPLOAD); // Go back if it fails
        }
    };

    const handleGenerateFromIdea = async (idea: string) => {
        setVideoData(null);
        setVideoUrl(null);
        setError(null);
        setEdits(null);
        setGeneratedContent(null);
        setEditingSuggestions(null);
        setPhase(AppPhase.EDITING); // Navigate immediately
        addActivity(`Brainstorming from idea: "${idea}"`);
        try {
            const { videoData: newVideoData, generatedContent: newGeneratedContent, suggestions } = await generateContentFromIdea(idea);
            setVideoData(newVideoData);
            setGeneratedContent(newGeneratedContent);
            setEditingSuggestions(suggestions);
            addActivity(`Generated concept: "${newVideoData.title}"`);
        } catch (e) {
            setError('Failed to generate content from idea. Please check your API key and try again.');
            console.error(e);
            setPhase(AppPhase.UPLOAD); // Go back if it fails
        }
    };

    const appContextValue: AppContextType = {
        phase, setPhase, videoData, setVideoData, videoUrl, setVideoUrl,
        generatedContent, setGeneratedContent, posts, setPosts,
        connectedPlatforms, setConnectedPlatforms, edits, setEdits, 
        editingSuggestions, setEditingSuggestions, error, setError,
        user, setUser, aiConfig, setAiConfig, activityLog, addActivity
    };
    
    const renderPhase = () => {
        switch (phase) {
            case AppPhase.DASHBOARD:
                return <Dashboard />;
            case AppPhase.UPLOAD:
                return <StartPhase onGenerateFromUpload={handleGenerateFromUpload} onGenerateFromIdea={handleGenerateFromIdea} />;
            case AppPhase.EDITING:
                return <EditingPhase />;
            case AppPhase.GENERATION:
                return <GenerationPhase />;
            case AppPhase.CALENDAR:
                return <CalendarPhase />;
            case AppPhase.ENGAGEMENT:
                return <EngagementPhase />;
            case AppPhase.ANALYTICS:
                return <AnalyticsPhase />;
            case AppPhase.PROFILE:
                return <ProfilePhase />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <AppContext.Provider value={appContextValue}>
            <div className="bg-gray-900 text-white min-h-screen flex">
                <Sidebar />
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {error && <div className="bg-red-500 text-white p-4 rounded-md mb-4">{error}</div>}
                    {renderPhase()}
                </main>
            </div>
        </AppContext.Provider>
    );
};

export default App;