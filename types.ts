import type { Dispatch, SetStateAction } from 'react';

export enum AppPhase {
  DASHBOARD = 'DASHBOARD',
  UPLOAD = 'UPLOAD',
  EDITING = 'EDITING',
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

export interface EditingSuggestions {
    general: string[];
    trimming: { startTime: number; endTime: number; reason: string; } | null;
    overlays: {
        text: string;
        timestamp: number;
        style: string;
        position: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right';
        animation: 'fade-in' | 'slide-up' | 'none';
    }[];
    filter: { name: string; reason: string; } | null;
    transition: { type: 'cross-fade' | 'zoom-in'; timestamp: number; reason: string; } | null;
    visualEffect: { type: 'glitch' | 'slow-motion'; timestamp: number; duration: number; reason: string; } | null;
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
    overlays: number[];
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

export interface AIConfig {
    model: AIModel;
    apiKey: string | null;
}

export interface User {
    name: string;
    avatar: string | null;
}

export interface Activity {
    id: number;
    text: string;
    timestamp: string;
}

export interface AppContextType {
  phase: AppPhase;
  setPhase: Dispatch<SetStateAction<AppPhase>>;
  videoData: VideoData | null;
  setVideoData: Dispatch<SetStateAction<VideoData | null>>;
  videoUrl: string | null;
  setVideoUrl: Dispatch<SetStateAction<string | null>>;
  generatedContent: GeneratedContent | null;
  setGeneratedContent: Dispatch<SetStateAction<GeneratedContent | null>>;
  editingSuggestions: EditingSuggestions | null;
  setEditingSuggestions: Dispatch<SetStateAction<EditingSuggestions | null>>;
  posts: Post[];
  setPosts: Dispatch<SetStateAction<Post[]>>;
  connectedPlatforms: Record<Platform, boolean>;
  setConnectedPlatforms: Dispatch<SetStateAction<Record<Platform, boolean>>>;
  edits: EditState | null;
  setEdits: Dispatch<SetStateAction<EditState | null>>;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  user: User;
  setUser: Dispatch<SetStateAction<User>>;
  aiConfig: AIConfig;
  setAiConfig: Dispatch<SetStateAction<AIConfig>>;
  activityLog: Activity[];
  addActivity: (text: string) => void;
}