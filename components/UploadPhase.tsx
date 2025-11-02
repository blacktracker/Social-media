import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { AppPhase, VideoData, ImageData } from '../types';
import { generateInitialMetadata, generateVideo, generateImage } from '../services/geminiService';
import Loader from './Loader';
// FIX: Import SparklesIcon to be used in the component.
import { UploadIcon, LightbulbIcon, VideoIcon, ImageIcon, MagicWandIcon, MicrophoneIcon, SparklesIcon } from './icons/index';

interface UploadPhaseProps {
    onGenerateFromUpload: (data: VideoData) => void;
    onGenerateFromIdea: (idea: string) => void;
    onImageEditNav: (data: ImageData) => void;
}

type CreationMode = 'upload' | 'generateVideo' | 'generateImage' | 'imageToVideo' | 'editImage';

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const GenerationModal: React.FC = () => {
    const appContext = useContext(AppContext);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-center">
                <Loader />
                <h3 className="text-xl font-bold mt-4 text-white">AI is Creating...</h3>
                <p className="text-gray-300 mt-2">{appContext?.generationProgress || 'Please wait...'}</p>
            </div>
        </div>
    );
};

const StartPhase: React.FC<UploadPhaseProps> = ({ onGenerateFromUpload, onGenerateFromIdea, onImageEditNav }) => {
    const appContext = useContext(AppContext);
    const [mode, setMode] = useState<CreationMode>('upload');
    const [videoData, setVideoData] = useState<VideoData>({ file: null, title: '', description: '', tags: [], contentType: 'Tutorial' });
    const [idea, setIdea] = useState('');
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
    const [fileName, setFileName] = useState('');
    const [isRecording, setIsRecording] = useState(false);

    // State for generative forms
    const [genPrompt, setGenPrompt] = useState('');
    const [genAspectRatio, setGenAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3' | '3:4'>('16:9');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [veoKeySelected, setVeoKeySelected] = useState(false);

    const checkVeoKey = async () => {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setVeoKeySelected(hasKey);
        return hasKey;
    };

    const handleSelectVeoKey = async () => {
        await window.aistudio.openSelectKey();
        // Assume success after opening dialog to avoid race conditions
        setVeoKeySelected(true);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && appContext) {
            setFileName(file.name);
            setVideoData(prev => ({ ...prev, file }));
            setIsLoadingMetadata(true);
            try {
                const { aiConfig, taskModelSelection } = appContext;
                const metadata = await generateInitialMetadata(file.name, { aiConfig, taskModelSelection });
                setVideoData(prev => ({ ...prev, title: metadata.title, description: metadata.description, tags: metadata.tags, contentType: metadata.contentType }));
            } catch (error) {
                console.error("Failed to generate metadata:", error);
                setVideoData(prev => ({ ...prev, title: file.name.split('.').slice(0, -1).join(' '), description: '', tags: [], contentType: 'General' }));
            } finally {
                setIsLoadingMetadata(false);
            }
        }
    };
    
    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
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
    
    const handleTranscription = () => {
        setIsRecording(true);
        // This is a simulation as direct browser audio transcription via Gemini generateContent isn't supported.
        setTimeout(() => {
            setIdea(prev => prev + (prev ? ' ' : '') + "a high-energy video about the benefits of vertical farming, showcasing innovative techniques and delicious results.");
            setIsRecording(false);
        }, 2000);
    };

    const handleUploadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (videoData.file && videoData.title) {
            onGenerateFromUpload(videoData);
        }
    };

    const handleIdeaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (idea.trim()) {
            onGenerateFromIdea(idea);
        }
    };

    const handleGenerationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!genPrompt.trim() || !appContext) return;
        
        appContext.setIsGenerating(true);
        const { aiConfig, taskModelSelection } = appContext;

        try {
            if (mode === 'generateVideo' || mode === 'imageToVideo') {
                 if (!veoKeySelected) {
                    const hasKey = await checkVeoKey();
                    if (!hasKey) {
                        alert("Please select an API key to generate videos.");
                        appContext.setIsGenerating(false);
                        return;
                    }
                }
                let imagePayload;
                if (mode === 'imageToVideo' && imageFile) {
                    const base64 = await blobToBase64(imageFile);
                    imagePayload = { imageBytes: base64, mimeType: imageFile.type };
                }
                const newVideoUrl = await generateVideo(genPrompt, genAspectRatio as '16:9' | '9:16', appContext.setGenerationProgress, { aiConfig, taskModelSelection }, imagePayload);
                const file = new File([await (await fetch(newVideoUrl)).blob()], "ai-generated-video.mp4", { type: "video/mp4" });
                onGenerateFromUpload({ file, title: genPrompt, description: '', tags: [], contentType: 'AI Generated' });
            
            } else if (mode === 'generateImage') {
                appContext.setGenerationProgress("AI is painting your vision...");
                const newImageUrl = await generateImage(genPrompt, genAspectRatio, { aiConfig, taskModelSelection });
                const file = new File([await (await fetch(newImageUrl)).blob()], "ai-generated-image.png", { type: "image/png" });
                const base64 = await blobToBase64(file);
                appContext.setImageData({ file, base64, prompt: genPrompt });
                appContext.setPhase(AppPhase.GENERATION);
                appContext.addActivity(`Generated image: "${genPrompt}"`);
            }
        } catch (error: any) {
            console.error(`Failed to generate ${mode}:`, error);
            appContext.setError(error.message || 'An unknown error occurred during generation.');
            if (error.message?.includes("entity was not found")) {
                 setVeoKeySelected(false); // Reset key state on failure
                 alert("Your API key is invalid. Please select a valid key.");
            }
        } finally {
            appContext.setIsGenerating(false);
            appContext.setGenerationProgress(null);
        }
    };

    const handleImageEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageFile) return;
        const base64 = await blobToBase64(imageFile);
        onImageEditNav({ file: imageFile, base64, prompt: '' });
    };

    const renderTabs = () => {
        const tabs: {id: CreationMode, name: string, icon: React.ReactNode}[] = [
            { id: 'upload', name: 'Upload Video', icon: <UploadIcon className="w-5 h-5"/> },
            { id: 'generateVideo', name: 'Generate Video', icon: <VideoIcon className="w-5 h-5"/> },
            { id: 'generateImage', name: 'Generate Image', icon: <ImageIcon className="w-5 h-5"/> },
            { id: 'imageToVideo', name: 'Image to Video', icon: <SparklesIcon className="w-5 h-5"/> },
            { id: 'editImage', name: 'Edit Image', icon: <MagicWandIcon className="w-5 h-5"/> },
        ];
        return (
            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setMode(tab.id)}
                            className={`${mode === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}
                            flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}>
                            {tab.icon} {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto">
            {appContext?.isGenerating && <GenerationModal />}
            <h2 className="text-3xl font-bold text-center mb-2 text-indigo-400">Phase 1: Create Content</h2>
            <p className="text-center text-gray-400 mb-10">Upload existing media or generate something new with AI.</p>

            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
                {renderTabs()}
                
                {mode === 'upload' && (
                    <form onSubmit={handleUploadSubmit} className="space-y-4 animate-fade-in">
                         <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <VideoIcon className="mx-auto h-12 w-12 text-gray-500" />
                                <div className="flex text-sm text-gray-400">
                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-700 rounded-md font-medium text-indigo-400 hover:text-indigo-300 px-1">
                                        <span>Upload a video</span>
                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="video/*" />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs text-gray-500">{fileName || 'MP4, MOV, AVI up to 500MB'}</p>
                            </div>
                        </div>

                        {isLoadingMetadata && <div className="flex items-center justify-center"><Loader /> <span className="ml-3 text-gray-300">AI is analyzing your file...</span></div>}

                        {(videoData.file || isLoadingMetadata) && (
                            <>
                                <input type="text" name="title" placeholder="Title" value={videoData.title} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" required />
                                <textarea name="description" placeholder="Description" value={videoData.description} onChange={handleInputChange} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                <input type="text" name="tags" placeholder="Tags (comma-separated)" value={videoData.tags.join(', ')} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                <input type="text" name="contentType" placeholder="Content Type (AI Suggested)" value={videoData.contentType} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" />
                                <button type="submit" disabled={isLoadingMetadata} className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed">
                                    Analyze & Continue to Editing
                                </button>
                            </>
                        )}
                    </form>
                )}
                
                {(mode === 'generateVideo' || mode === 'generateImage' || mode === 'imageToVideo') && (
                     <form onSubmit={handleGenerationSubmit} className="space-y-4 animate-fade-in">
                        { (mode === 'imageToVideo') &&
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Source Image</label>
                                <div className="mt-1 flex items-center gap-4">
                                    <div className="w-32 h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                                        {imagePreview ? <img src={imagePreview} alt="Preview" className="h-full w-full object-cover rounded-lg" /> : <ImageIcon className="w-10 h-10 text-gray-500" />}
                                    </div>
                                    <label htmlFor="image-gen-upload" className="cursor-pointer bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                                        <span>Upload Image</span>
                                        <input id="image-gen-upload" type="file" className="sr-only" onChange={handleImageFileChange} accept="image/*" />
                                    </label>
                                </div>
                            </div>
                        }
                        <textarea value={genPrompt} onChange={e => setGenPrompt(e.target.value)} rows={4} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder={mode.includes('Video') ? "e.g., A cinematic shot of a robot surfing on a giant wave" : "e.g., A photorealistic portrait of an astronaut drinking coffee"} required />
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
                            <select value={genAspectRatio} onChange={e => setGenAspectRatio(e.target.value as any)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500">
                                {mode.includes('Video') ? <> <option value="16:9">16:9 (Landscape)</option><option value="9:16">9:16 (Portrait)</option> </> : <> <option value="1:1">1:1 (Square)</option><option value="16:9">16:9 (Widescreen)</option><option value="9:16">9:16 (Vertical)</option><option value="4:3">4:3 (Standard)</option><option value="3:4">3:4 (Portrait)</option> </> }
                            </select>
                        </div>
                        {mode.includes('Video') && !veoKeySelected && (
                            <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 text-sm p-3 rounded-lg">
                                Video generation with Veo requires selecting an API key. This is a one-time setup. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-bold">Learn about billing.</a>
                                <button type="button" onClick={handleSelectVeoKey} className="mt-2 w-full bg-yellow-500 text-black font-bold py-2 px-4 rounded-md hover:bg-yellow-600">
                                    Select API Key
                                </button>
                            </div>
                        )}
                         <button type="submit" className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-md hover:bg-green-700 transition-colors">
                            Generate with AI
                        </button>
                    </form>
                )}

                {mode === 'editImage' && (
                    <form onSubmit={handleImageEditSubmit} className="space-y-4 animate-fade-in">
                        <div className="mt-1 flex flex-col sm:flex-row items-center gap-4">
                            <div className="w-48 h-48 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                {imagePreview ? <img src={imagePreview} alt="Preview" className="h-full w-full object-cover rounded-lg" /> : <ImageIcon className="w-16 h-16 text-gray-500" />}
                            </div>
                            <div className="space-y-2 text-center sm:text-left">
                                <label htmlFor="image-edit-upload" className="cursor-pointer bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm inline-block">
                                    <span>Upload Image to Edit</span>
                                    <input id="image-edit-upload" type="file" className="sr-only" onChange={handleImageFileChange} accept="image/*" />
                                </label>
                                <p className="text-xs text-gray-400">Select an image to start editing with text prompts.</p>
                            </div>
                        </div>
                        <button type="submit" disabled={!imageFile} className="w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed">
                            Continue to Image Editor
                        </button>
                    </form>
                )}
            </div>

            <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl mt-8">
                <div className="flex items-center gap-4 mb-4">
                    <LightbulbIcon className="w-8 h-8 text-yellow-400"/>
                    <h3 className="text-2xl font-bold text-white">Start with an Idea</h3>
                </div>
                 <form onSubmit={handleIdeaSubmit} className="space-y-4">
                    <div className="relative">
                        <textarea id="idea" name="idea" rows={5} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 pr-12 focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., A funny cooking tutorial for a giant pizza" value={idea} onChange={e => setIdea(e.target.value)} />
                        <button type="button" onClick={handleTranscription} title="Transcribe from microphone" className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-600 hover:bg-gray-500'}`}>
                            <MicrophoneIcon className="w-5 h-5 text-white" />
                        </button>
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-md hover:bg-green-700 transition-colors">
                        Brainstorm with AI
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StartPhase;