import React, { useState, useEffect, createContext } from 'react';
import { AppPhase, VideoData, GeneratedContent, Post, Platform, AppContextType, EditState, EditingSuggestions, User, AIConfig, AIModel, Activity, Connection, ImageData, TaskModelSelection } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import UploadPhase from './components/UploadPhase';
import EditingPhase from './components/EditingPhase';
import ImageEditingPhase from './components/ImageEditingPhase';
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [videoData, setVideoData] = useState<VideoData | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [imageData, setImageData] = useState<ImageData | null>(null);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [edits, setEdits] = useState<EditState | null>(null);
    const [editingSuggestions, setEditingSuggestions] = useState<EditingSuggestions | null>(null);
    const [connectedPlatforms, setConnectedPlatforms] = useState<Record<Platform, Connection>>({
        YouTube: { connected: true, username: 'creator_youtube' },
        Instagram: { connected: true, username: 'creator_ig' },
        TikTok: { connected: true, username: 'creator_tt' },
        Facebook: { connected: false, username: null },
        Pinterest: { connected: false, username: null },
    });
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<User>({ name: 'Content Creator', avatar: null });
    const [aiConfig, setAiConfig] = useState<AIConfig>({
        [AIModel.GEMINI]: { apiKey: null },
        [AIModel.GPT]: { apiKey: null },
        [AIModel.DEEPSEEK]: { apiKey: null },
        [AIModel.QWEN]: { apiKey: null },
        [AIModel.KIMI]: { apiKey: null },
        [AIModel.HUGGINGFACE]: { apiKey: null },
    });
    const [taskModelSelection, setTaskModelSelection] = useState<TaskModelSelection>({
        contentGeneration: AIModel.GEMINI,
        editingSuggestions: AIModel.GEMINI,
        commentAnalysis: AIModel.GEMINI,
        analyticsGeneration: AIModel.GEMINI,
        postTimeSuggestion: AIModel.GEMINI,
        metadataGeneration: AIModel.GEMINI,
        imageEditing: AIModel.GEMINI
    });
    const [activityLog, setActivityLog] = useState<Activity[]>([]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generationProgress, setGenerationProgress] = useState<string | null>(null);


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

    const resetForNewContent = () => {
        setVideoData(null);
        setVideoUrl(null);
        setImageData(null);
        setError(null);
        setEdits(null);
        setGeneratedContent(null);
        setEditingSuggestions(null);
    }

    const handleGenerateFromUpload = async (data: VideoData) => {
        resetForNewContent();
        setVideoData(data);
        setPhase(AppPhase.EDITING);
        addActivity(`Uploaded video: "${data.file?.name}"`);
        try {
            const { content, suggestions } = await generateContentAndSuggestions(data, { aiConfig, taskModelSelection });
            setGeneratedContent(content);
            setEditingSuggestions(suggestions);
            addActivity(`Generated content for "${data.title}"`);
        } catch (e) {
            setError('Failed to generate content. Please check your API key and try again.');
            console.error(e);
            setPhase(AppPhase.UPLOAD);
        }
    };

    const handleGenerateFromIdea = async (idea: string) => {
        resetForNewContent();
        setPhase(AppPhase.EDITING);
        addActivity(`Brainstorming from idea: "${idea}"`);
        try {
            const { videoData: newVideoData, generatedContent: newGeneratedContent, suggestions } = await generateContentFromIdea(idea, { aiConfig, taskModelSelection });
            setVideoData(newVideoData);
            setGeneratedContent(newGeneratedContent);
            setEditingSuggestions(suggestions);
            addActivity(`Generated concept: "${newVideoData.title}"`);
        } catch (e) {
            setError('Failed to generate content from idea. Please check your API key and try again.');
            console.error(e);
            setPhase(AppPhase.UPLOAD);
        }
    };

    const handleImageEditNav = (data: ImageData) => {
        resetForNewContent();
        setImageData(data);
        setPhase(AppPhase.IMAGE_EDITING);
        addActivity(`Editing image: "${data.file?.name}"`);
    };

    const renderPhase = () => {
        switch (phase) {
            case AppPhase.DASHBOARD:
                return <Dashboard />;
            case AppPhase.UPLOAD:
                return <UploadPhase onGenerateFromUpload={handleGenerateFromUpload} onGenerateFromIdea={handleGenerateFromIdea} onImageEditNav={handleImageEditNav}/>;
            case AppPhase.EDITING:
                return <EditingPhase />;
            case AppPhase.IMAGE_EDITING:
                return <ImageEditingPhase />;
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

    const contextValue: AppContextType = {
        phase, setPhase,
        videoData, setVideoData,
        videoUrl, setVideoUrl,
        imageData, setImageData,
        generatedContent, setGeneratedContent,
        posts, setPosts,
        edits, setEdits,
        editingSuggestions, setEditingSuggestions,
        connectedPlatforms, setConnectedPlatforms,
        error, setError,
        user, setUser,
        aiConfig, setAiConfig,
        taskModelSelection, setTaskModelSelection,
        activityLog, addActivity,
        isGenerating, setIsGenerating,
        generationProgress, setGenerationProgress
    };

    return (
        <AppContext.Provider value={contextValue}>
            <div className="flex h-screen bg-gray-900 text-white">
                <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div className="flex flex-col flex-1 w-full lg:w-[calc(100%-16rem)]">
                    <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                        {renderPhase()}
                    </main>
                </div>
            </div>
        </AppContext.Provider>
    );
};

export default App;