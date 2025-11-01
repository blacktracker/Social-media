import type { Dispatch, SetStateAction } from 'react';

export enum AppPhase {
  DASHBOARD = 'DASHBOARD',
  UPLOAD = 'UPLOAD',
  EDITING = 'EDITING',
  IMAGE_EDITING = 'IMAGE_EDITING',
  GENERATION = 'GENERATION',
  CALENDAR = 'CALENDAR',
  ENGAGEMENT = 'ENGAGEMENT',
  ANALYTICS = 'ANALYTICS',
  PROFILE = 'PROFILE',
}

export interface VideoData {
  file: File | null;
  title: string;
  description: string;
  tags: string[];
  contentType: string;
}

export interface ImageData {
    file: File | null;
    base64: string;
    prompt: string;
}

export type OverlayPosition =
  | 'top-left' | 'top-center' | 'top-right'
  | 'center-left' | 'center' | 'center-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

// FIX: Define a reusable Overlay interface to fix the extension error.
export interface Overlay {
    text: string;
    timestamp: number;
    style: string;
    position: OverlayPosition;
    animation: 'fade-in' | 'slide-up' | 'none';
}

export interface EditingSuggestions {
    general: string[];
    trimming: { startTime: number; endTime: number; reason: string; } | null;
    overlays: Overlay[];
    filter: { name: string; reason: string; } | null;
    transition: { type: 'cross-fade' | 'zoom-in'; timestamp: number; reason: string; } | null;
    visualEffect: { type: 'glitch' | 'slow-motion'; timestamp: number; duration: number; reason: string; } | null;
}

export interface AppliedOverlay extends Overlay {
    suggestionIndex: number;
}

export type Platform = 'YouTube' | 'Instagram' | 'TikTok' | 'Facebook' | 'Pinterest';

export interface PlatformContent {
  title: string;
  description: string;
  hashtags: string[];
  scheduledAt: string | null;
}

export type GeneratedContent = Record<Platform, PlatformContent>;

export interface Comment {
    author: string;
    comment: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    autoLiked?: boolean;
    autoReply?: string;
}

export interface Post {
    id: string;
    platform: Platform;
    title: string;
    description:string;
    hashtags: string[];
    scheduledAt: string;
    mediaUrl: string; // Can be video or image URL
    mediaType: 'video' | 'image';
    analytics: {
        views: number;
        likes: number;
        shares: number;
        comments: number;
    };
    comments: Comment[];
}

export interface EditState {
    trim: { start: number; end: number } | null;
    overlays: AppliedOverlay[];
    filter: string | null;
    transition: { type: string; timestamp: number; reason: string; } | null;
    effect: { type: string; timestamp: number; duration: number; reason: string; } | null;
    crop: '16:9' | '9:16' | '1:1' | '4:5';
}

export enum AIModel {
    GEMINI = 'Gemini',
    GPT = 'GPT',
    DEEPSEEK = 'DeepSeek',
    QWEN = 'Qwen',
    KIMI = 'Kimi',
    HUGGINGFACE = 'HuggingFace'
}

export type AIConfig = Record<AIModel, { apiKey: string | null }>;

export type AITask = 'contentGeneration' | 'editingSuggestions' | 'commentAnalysis' | 'analyticsGeneration' | 'postTimeSuggestion' | 'metadataGeneration' | 'imageEditing';
export type TaskModelSelection = Record<AITask, AIModel>;


export interface User {
    name: string;
    avatar: string | null;
}

export interface Activity {
    id: number;
    text: string;
    timestamp: string;
}

export interface Connection {
    connected: boolean;
    username: string | null;
}

export interface AppContextType {
  phase: AppPhase;
  setPhase: Dispatch<SetStateAction<AppPhase>>;
  videoData: VideoData | null;
  setVideoData: Dispatch<SetStateAction<VideoData | null>>;
  videoUrl: string | null;
  setVideoUrl: Dispatch<SetStateAction<string | null>>;
  imageData: ImageData | null;
  setImageData: Dispatch<SetStateAction<ImageData | null>>;
  generatedContent: GeneratedContent | null;
  setGeneratedContent: Dispatch<SetStateAction<GeneratedContent | null>>;
  editingSuggestions: EditingSuggestions | null;
  setEditingSuggestions: Dispatch<SetStateAction<EditingSuggestions | null>>;
  posts: Post[];
  setPosts: Dispatch<SetStateAction<Post[]>>;
  connectedPlatforms: Record<Platform, Connection>;
  setConnectedPlatforms: Dispatch<SetStateAction<Record<Platform, Connection>>>;
  edits: EditState | null;
  setEdits: Dispatch<SetStateAction<EditState | null>>;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  user: User;
  setUser: Dispatch<SetStateAction<User>>;
  aiConfig: AIConfig;
  setAiConfig: Dispatch<SetStateAction<AIConfig>>;
  taskModelSelection: TaskModelSelection;
  setTaskModelSelection: Dispatch<SetStateAction<TaskModelSelection>>;
  activityLog: Activity[];
  addActivity: (text: string) => void;
  isGenerating: boolean;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  generationProgress: string | null;
  setGenerationProgress: Dispatch<SetStateAction<string | null>>;
}