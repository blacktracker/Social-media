import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { AppPhase, ImageData } from '../types';
import { editImage } from '../services/geminiService';
import Loader from './Loader';
import { MagicWandIcon, ImageIcon } from './icons/index';

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

const ImageEditingPhase: React.FC = () => {
    const appContext = useContext(AppContext);
    if (!appContext) return null;

    const { imageData, setImageData, setPhase, addActivity, setError, aiConfig, taskModelSelection } = appContext;

    const [editPrompt, setEditPrompt] = useState('');
    const [editedImage, setEditedImage] = useState<ImageData | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    if (!imageData) {
        return (
            <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-gray-400">No image selected.</h2>
                <p className="text-gray-500">Go to the "Create" phase to upload an image to edit.</p>
                 <button onClick={() => setPhase(AppPhase.UPLOAD)} className="mt-4 bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700">
                    Go to Create Hub
                </button>
            </div>
        );
    }
    
    const handleEdit = async () => {
        if (!editPrompt.trim()) {
            alert("Please enter an editing instruction.");
            return;
        }
        setIsEditing(true);
        setError(null);
        try {
            const newImageBase64 = await editImage(imageData, editPrompt, { aiConfig, taskModelSelection });
            const newImageDataUrl = `data:image/png;base64,${newImageBase64}`;
            const file = new File([await(await fetch(newImageDataUrl)).blob()], `edited-${imageData.file?.name}`, { type: 'image/png'});

            setEditedImage({
                file,
                base64: newImageBase64,
                prompt: editPrompt
            });
            addActivity(`Edited image with prompt: "${editPrompt}"`);
        } catch (e) {
            console.error("Failed to edit image:", e);
            setError("Failed to edit image. The model may not be able to fulfill this request.");
        } finally {
            setIsEditing(false);
        }
    };

    const handleUseImage = async () => {
        if (!editedImage) return;

        // Simulate generating content for the new image
        const tempVideoData: any = {
            title: `AI Art: ${editedImage.prompt}`,
            description: `An AI-generated image based on the prompt: "${editedImage.prompt}"`,
            tags: ['AIart', 'digitalart', 'generative'],
            contentType: 'Image Post'
        };

        const { generateContentAndSuggestions } = await import('../services/geminiService');
        try {
            appContext.setVideoData(tempVideoData); // Use videoData to pass metadata
            appContext.setImageData(editedImage);
            
            const { content } = await generateContentAndSuggestions(tempVideoData, { aiConfig, taskModelSelection });
            appContext.setGeneratedContent(content);
            appContext.setEditingSuggestions(null); // No video edits for an image
            appContext.setEdits(null); // No video edits for an image
            setPhase(AppPhase.GENERATION);
        } catch (e) {
            setError("Failed to generate content for the new image.");
            console.error(e);
        }
    }


    return (
        <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-2 text-indigo-400">AI Image Editor</h2>
            <p className="text-center text-gray-400 mb-8">Use text to magically edit your image.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
                    <h3 className="font-bold text-xl mb-4 text-white">Original Image</h3>
                    <img src={`data:${imageData.file?.type};base64,${imageData.base64}`} alt="Original" className="w-full rounded-lg" />
                </div>
                <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
                    <h3 className="font-bold text-xl mb-4 text-white">Edited Image</h3>
                    <div className="aspect-square bg-gray-900/50 rounded-lg flex items-center justify-center">
                        {isEditing ? (
                            <div className="text-center">
                                <Loader />
                                <p className="mt-2 text-sm text-gray-300">AI is working its magic...</p>
                            </div>
                        ) : editedImage ? (
                            <img src={`data:${editedImage.file?.type};base64,${editedImage.base64}`} alt="Edited" className="w-full h-full object-contain rounded-lg" />
                        ) : (
                             <div className="text-center text-gray-500 p-4">
                                <ImageIcon className="w-16 h-16 mx-auto"/>
                                <p>Your edited image will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-xl">
                 <div className="flex items-center gap-3 mb-4">
                    <MagicWandIcon className="w-6 h-6 text-indigo-400"/>
                    <h3 className="text-xl font-bold text-white">Editing Prompt</h3>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                     <input
                        type="text"
                        value={editPrompt}
                        onChange={e => setEditPrompt(e.target.value)}
                        placeholder="e.g., Add a retro filter, make the sky dramatic"
                        className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={isEditing}
                    />
                    <button onClick={handleEdit} disabled={isEditing || !editPrompt} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed">
                        {isEditing ? 'Generating...' : 'Apply Edit'}
                    </button>
                </div>
            </div>
             {editedImage && (
                <div className="mt-8 flex justify-end">
                    <button onClick={handleUseImage} className="bg-green-600 text-white font-bold py-3 px-6 rounded-md hover:bg-green-700 transition-colors text-lg">
                        Use This Image &rarr;
                    </button>
                </div>
            )}
        </div>
    );
};

export default ImageEditingPhase;