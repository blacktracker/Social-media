import React, { useState } from 'react';
import { VideoData } from '../types';
import { generateInitialMetadata } from '../services/geminiService';
import Loader from './Loader';
import { UploadIcon, LightbulbIcon } from './icons/index';

interface UploadPhaseProps {
    onGenerateFromUpload: (data: VideoData) => void;
    onGenerateFromIdea: (idea: string) => void;
}

const StartPhase: React.FC<UploadPhaseProps> = ({ onGenerateFromUpload, onGenerateFromIdea }) => {
    const [videoData, setVideoData] = useState<VideoData>({
        file: null,
        title: '',
        description: '',
        tags: [],
        contentType: 'Tutorial',
    });
    const [idea, setIdea] = useState('');
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileName(file.name);
            setVideoData(prev => ({ ...prev, file }));
            setIsLoadingMetadata(true);
            try {
                const metadata = await generateInitialMetadata(file.name);
                setVideoData(prev => ({
                    ...prev,
                    title: metadata.title,
                    description: metadata.description,
                    tags: metadata.tags,
                    contentType: metadata.contentType,
                }));
            } catch (error) {
                console.error("Failed to generate metadata:", error);
                // Set some defaults if API fails
                setVideoData(prev => ({
                    ...prev,
                    title: file.name.split('.').slice(0, -1).join(' '),
                    description: '',
                    tags: [],
                    contentType: 'General',
                }));
            } finally {
                setIsLoadingMetadata(false);
            }
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'tags') {
            setVideoData(prev => ({ ...prev, tags: value.split(',').map(tag => tag.trim()) }));
        } else {
            setVideoData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (videoData.file && videoData.title) {
            onGenerateFromUpload(videoData);
        } else {
            alert('Please select a file and provide a title.');
        }
    };

    const handleIdeaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (idea.trim()) {
            onGenerateFromIdea(idea);
        } else {
            alert('Please enter an idea.');
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-2 text-indigo-400">Phase 1: Create Content</h2>
            <p className="text-center text-gray-400 mb-10">Start by uploading a video or brainstorming a new idea with AI.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Video Section */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <UploadIcon className="w-8 h-8 text-indigo-400"/>
                        <h3 className="text-2xl font-bold text-white">Upload a Video</h3>
                    </div>
                    <form onSubmit={handleUploadSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="video-upload" className="block text-sm font-medium text-gray-300 mb-1">Video File</label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <div className="flex text-sm text-gray-400">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-indigo-500 px-1">
                                            <span>Upload a file</span>
                                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="video/*" />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">{fileName || 'MP4, MOV, AVI up to 500MB'}</p>
                                </div>
                            </div>
                        </div>

                        {isLoadingMetadata && <div className="flex items-center justify-center"><Loader /> <span className="ml-3 text-gray-300">AI is analyzing your file...</span></div>}

                        {(videoData.file || isLoadingMetadata) && (
                            <>
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                                    <input type="text" name="title" id="title" value={videoData.title} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" required />
                                </div>
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                                    <textarea name="description" id="description" value={videoData.description} onChange={handleInputChange} rows={4} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1">Tags (comma-separated)</label>
                                    <input type="text" name="tags" id="tags" value={videoData.tags.join(', ')} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                 <div>
                                    <label htmlFor="contentType" className="block text-sm font-medium text-gray-300 mb-1">Content Type (AI Suggested)</label>
                                    <input type="text" name="contentType" id="contentType" value={videoData.contentType} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                </div>
                                <button type="submit" disabled={isLoadingMetadata} className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed">
                                    Generate Multi-Platform Content
                                </button>
                            </>
                        )}
                    </form>
                </div>

                {/* Start with Idea Section */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <LightbulbIcon className="w-8 h-8 text-yellow-400"/>
                        <h3 className="text-2xl font-bold text-white">Start with an Idea</h3>
                    </div>
                     <form onSubmit={handleIdeaSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="idea" className="block text-sm font-medium text-gray-300 mb-1">Describe your video idea</label>
                            <textarea
                                id="idea"
                                name="idea"
                                rows={8}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g., A funny cooking tutorial for a giant pizza"
                                value={idea}
                                onChange={e => setIdea(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-md hover:bg-green-700 transition-colors">
                            Brainstorm with AI
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StartPhase;