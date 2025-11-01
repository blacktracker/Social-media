import { GoogleGenAI, Type, Modality } from "@google/genai";
import { VideoData, GeneratedContent, Platform, Comment, EditingSuggestions, Post, ImageData, AITask, AIConfig, TaskModelSelection } from '../types';

interface AIProvider {
    aiConfig: AIConfig;
    taskModelSelection: TaskModelSelection;
}

// In a real multi-model application, this function would act as a factory,
// returning the appropriate client based on the user's selection.
// For this simulation, it always returns the Gemini client but uses the
// API key configured for the selected model.
const getAiClient = (task: AITask, aiProvider: AIProvider) => {
    const selectedModel = aiProvider.taskModelSelection[task];
    const apiKey = aiProvider.aiConfig[selectedModel].apiKey || process.env.API_KEY;

    if (!apiKey) {
        // In a real app, you'd throw a more user-friendly error.
        throw new Error(`API Key for model ${selectedModel} is not configured.`);
    }
    
    // NOTE: This always returns a Gemini client, as per the simulation requirement.
    // A real app would have a switch/case here to instantiate the correct SDK
    // (e.g., new OpenAI({ apiKey }), etc.)
    return new GoogleGenAI({ apiKey });
};

const platforms: Platform[] = ['YouTube', 'Instagram', 'TikTok', 'Facebook', 'Pinterest'];

const platformSchema: Record<string, any> = {};
platforms.forEach(platform => {
    platformSchema[platform] = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['title', 'description', 'hashtags']
    };
});

const editingSuggestionsSchema = {
    type: Type.OBJECT,
    properties: {
        general: { type: Type.ARRAY, items: { type: Type.STRING } },
        trimming: {
            type: Type.OBJECT, properties: { startTime: { type: Type.NUMBER }, endTime: { type: Type.NUMBER }, reason: { type: Type.STRING } },
            required: ['startTime', 'endTime', 'reason'], nullable: true,
        },
        overlays: {
            type: Type.ARRAY, items: {
                type: Type.OBJECT, properties: { text: { type: Type.STRING }, timestamp: { type: Type.NUMBER }, style: { type: Type.STRING }, position: { type: Type.STRING }, animation: { type: Type.STRING } },
                required: ['text', 'timestamp', 'style', 'position', 'animation']
            }
        },
        filter: {
            type: Type.OBJECT, properties: { name: { type: Type.STRING }, reason: { type: Type.STRING } },
            required: ['name', 'reason'], nullable: true,
        },
        transition: {
            type: Type.OBJECT, properties: { type: { type: Type.STRING }, timestamp: { type: Type.NUMBER }, reason: { type: Type.STRING } },
            required: ['type', 'timestamp', 'reason'], nullable: true,
        },
        visualEffect: {
            type: Type.OBJECT, properties: { type: { type: Type.STRING }, timestamp: { type: Type.NUMBER }, duration: { type: Type.NUMBER }, reason: { type: Type.STRING } },
            required: ['type', 'timestamp', 'duration', 'reason'], nullable: true,
        }
    },
    required: ['general', 'trimming', 'overlays', 'filter', 'transition', 'visualEffect']
};


export const generateInitialMetadata = async (fileName: string, aiProvider: AIProvider): Promise<Omit<VideoData, 'file'>> => {
    const ai = getAiClient('metadataGeneration', aiProvider);
    const model = 'gemini-2.5-flash';
    const prompt = `
        Based on the video filename "${fileName}", generate a catchy title, a short description (2-3 sentences), 5 relevant tags, and suggest the most fitting content type.
        Choose the content type from a comprehensive list like: 'DIY Tutorial', 'Tech Review', 'Comedy Skit', 'Travel Vlog', 'Gaming Walkthrough', 'Educational Explainer', 'Unboxing Video', 'Music Cover', 'Fitness Routine', 'Cooking Recipe'.
        Return a single JSON object with keys "title", "description", "tags" (an array of strings), and "contentType".`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                    contentType: { type: Type.STRING }
                },
                required: ['title', 'description', 'tags', 'contentType']
            }
        }
    });

    return JSON.parse(response.text);
};


export const generateContentAndSuggestions = async (videoData: VideoData, aiProvider: AIProvider): Promise<{ content: GeneratedContent, suggestions: EditingSuggestions }> => {
    const ai = getAiClient('contentGeneration', aiProvider);
    const model = 'gemini-2.5-pro'; // Upgraded to Pro model
    const prompt = `
        As an expert video editor and social media strategist, analyze the following video's metadata and concept to provide top-tier recommendations.
        Video Title: "${videoData.title}"
        Video Description: "${videoData.description}"
        Video Tags: ${videoData.tags.join(', ')}
        Content Type: ${videoData.contentType}

        TASK 1: Create tailored content for platforms: ${platforms.join(', ')}.
        For each platform, provide a compelling title, an engaging description/caption, and 5 highly relevant hashtags. Optimize for each platform's unique audience and algorithm.

        TASK 2: Provide detailed, creative editing suggestions for a 60-second video. The suggestions must be professional-grade:
        1. "general": An array of 2 insightful, actionable suggestions to improve overall impact.
        2. "trimming": An object with "startTime", "endTime", and "reason". Identify the most viral-worthy clip, between 15-30 seconds. Can be null if the full video is best.
        3. "overlays": An array of exactly 2 objects, each with "text", "timestamp", "style" ('Title' or 'Call-to-Action'), "position" from ['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'], and "animation" ('fade-in' or 'slide-up'). Make them punchy and value-driven.
        4. "filter": An object with "name" from ['Vibrant', 'Cinematic', 'Vintage', 'Black & White'] and a "reason" explaining the mood it creates. Can be null.
        5. "transition": An object with a "type" from ['cross-fade', 'zoom-in'], a "timestamp", and a "reason" for its placement. Can be null.
        6. "visualEffect": An object with a "type" from ['glitch', 'slow-motion'], a "timestamp", a "duration", and a "reason" explaining how it enhances the story. Can be null.

        Return a single JSON object with two top-level keys: "platformContent" and "editingSuggestions", matching the precise structures described.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    platformContent: { type: Type.OBJECT, properties: platformSchema },
                    editingSuggestions: editingSuggestionsSchema
                },
                required: ['platformContent', 'editingSuggestions']
            }
        }
    });

    const result = JSON.parse(response.text);

    const finalContent: GeneratedContent = {} as GeneratedContent;
    for (const platform in result.platformContent) {
        finalContent[platform as Platform] = {
            ...result.platformContent[platform],
            scheduledAt: null
        };
    }

    return { content: finalContent, suggestions: result.editingSuggestions };
};

export const generateContentFromIdea = async (idea: string, aiProvider: AIProvider): Promise<{ videoData: VideoData, generatedContent: GeneratedContent, suggestions: EditingSuggestions }> => {
    const ai = getAiClient('contentGeneration', aiProvider);
    const model = 'gemini-2.5-pro';
    const prompt = `
        Video Idea: "${idea}"

        Part 1: Flesh out this idea. Generate a video title, a short description (2-3 sentences), 5 relevant tags, and suggest a content type from this list: ["Tutorial", "Vlog", "Short Skit", "Product Review", "Gaming", "News", "Music Video"].
        
        Part 2: Based on the fleshed-out idea, create tailored content for the following platforms: ${platforms.join(', ')}. For each platform, provide a suitable title, a description/caption, and 3-5 relevant hashtags.
        
        Part 3: Provide detailed editing suggestions for a 60-second video based on this idea. The suggestions should include: "general" (2 suggestions), "trimming" (can be null), "overlays" (2 overlays), "filter" (can be null), "transition" (can be null), and "visualEffect" (can be null).

        Return a single JSON object with three top-level keys:
        1. "videoMetadata": an object with "title", "description", "tags", and "contentType".
        2. "platformContent": an object where each key is a platform name and the value is an object with "title", "description", and "hashtags".
        3. "editingSuggestions": an object matching the structure from Part 3.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    videoMetadata: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                            contentType: { type: Type.STRING }
                        },
                        required: ['title', 'description', 'tags', 'contentType']
                    },
                    platformContent: {
                        type: Type.OBJECT,
                        properties: platformSchema
                    },
                    editingSuggestions: editingSuggestionsSchema
                },
                required: ['videoMetadata', 'platformContent', 'editingSuggestions']
            }
        }
    });

    const result = JSON.parse(response.text);

    const newVideoData: VideoData = {
        file: null, // No file for an idea
        ...result.videoMetadata
    };

    const newGeneratedContent: GeneratedContent = {} as GeneratedContent;
    for (const platform in result.platformContent) {
        newGeneratedContent[platform as Platform] = {
            ...result.platformContent[platform],
            scheduledAt: null
        };
    }

    return { videoData: newVideoData, generatedContent: newGeneratedContent, suggestions: result.editingSuggestions };
};

export const generateVideo = async (
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    setProgress: (status: string) => void,
    aiProvider: AIProvider,
    image?: { imageBytes: string; mimeType: string; }
): Promise<string> => {
    const ai = getAiClient('contentGeneration', aiProvider);
    const model = 'veo-3.1-fast-generate-preview';
    
    setProgress("Initializing video generation...");

    const requestPayload: any = {
        model,
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    };

    if (image) {
        requestPayload.image = image;
    }

    let operation = await ai.models.generateVideos(requestPayload);

    setProgress("AI is directing your video...");
    
    const progressMessages = [
        "Casting digital actors...",
        "Setting up virtual cameras...",
        "Rendering the first scenes...",
        "Adding special effects...",
        "Finalizing the soundtrack...",
        "Applying post-production polish..."
    ];
    let messageIndex = 0;

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        setProgress(progressMessages[messageIndex % progressMessages.length]);
        messageIndex++;
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    setProgress("Video generation complete!");

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed, no download link found.");
    }
    
    setProgress("Downloading video...");
    const apiKey = aiProvider.aiConfig.Gemini.apiKey || process.env.API_KEY;
    const response = await fetch(`${downloadLink}&key=${apiKey}`);
    const videoBlob = await response.blob();
    
    return URL.createObjectURL(videoBlob);
};

export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4', aiProvider: AIProvider): Promise<string> => {
    const ai = getAiClient('contentGeneration', aiProvider);
    const model = 'imagen-4.0-generate-001';

    const response = await ai.models.generateImages({
        model,
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio,
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
};

export const editImage = async (imageData: ImageData, editPrompt: string, aiProvider: AIProvider): Promise<string> => {
    const ai = getAiClient('imageEditing', aiProvider);
    const model = 'gemini-2.5-flash-image';
    
    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                {
                    inlineData: {
                        data: imageData.base64,
                        mimeType: imageData.file!.type,
                    },
                },
                {
                    text: editPrompt,
                },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }
    throw new Error("Image editing failed to produce an image.");
};

export const generateBestPostTimes = async (platforms: Platform[], contentType: string, aiProvider: AIProvider): Promise<Record<Platform, { bestTimeISO: string }>> => {
    const ai = getAiClient('postTimeSuggestion', aiProvider);
    const model = 'gemini-2.5-flash';
    const prompt = `
        You are an expert social media strategist. For a "${contentType}" video, what is the absolute best time to post on each of the following platforms in the upcoming week for maximum engagement: ${platforms.join(', ')}?
        Base your decision on the current date being ${new Date().toISOString()}.
        Respond with a single JSON object where each key is a platform name ("${platforms.join('", "')}") and the value is an object with a single key "bestTimeISO". The value for "bestTimeISO" must be a future date and time in ISO 8601 format (e.g., "YYYY-MM-DDTHH:mm:ss.sssZ").
    `;

    const postTimePlatformSchema: Record<string, any> = {};
    platforms.forEach(platform => {
        postTimePlatformSchema[platform] = {
            type: Type.OBJECT,
            properties: {
                bestTimeISO: { type: Type.STRING }
            },
            required: ['bestTimeISO']
        };
    });

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: postTimePlatformSchema
            }
        }
    });

    return JSON.parse(response.text);
}


export const generateCommentsWithReplies = async (title: string, description: string, aiProvider: AIProvider): Promise<Comment[]> => {
    const ai = getAiClient('commentAnalysis', aiProvider);
    const model = 'gemini-2.5-flash';
    const prompt = `
        A video titled "${title}" with description "${description}" has been posted.
        Generate 5 realistic comments for this video. For each comment, provide the author's username, the comment text, and a sentiment analysis ('positive', 'neutral', 'negative').
        Vary the sentiments.
        For any comments with a 'positive' sentiment, ALSO generate a friendly and appreciative suggested reply (1-2 sentences).
        
        Return a single JSON object with a "comments" key, which is an array of objects. Each object must have "author", "comment", and "sentiment" keys. For positive comments, it should also include an "autoReply" key.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    comments: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                author: { type: Type.STRING },
                                comment: { type: Type.STRING },
                                sentiment: { type: Type.STRING },
                                autoReply: { type: Type.STRING }
                            },
                            required: ['author', 'comment', 'sentiment']
                        }
                    }
                },
                required: ['comments']
            }
        }
    });

    const result = JSON.parse(response.text);
    return result.comments;
};

export const generateAnalyticsForPost = async (post: Post, aiProvider: AIProvider): Promise<Post['analytics']> => {
    const ai = getAiClient('analyticsGeneration', aiProvider);
    const model = 'gemini-2.5-flash';
    const prompt = `
        A ${post.mediaType} titled "${post.title}" was posted on ${post.platform}.
        The description was: "${post.description}".
        The hashtags were: ${post.hashtags.join(', ')}.

        Based on this information, generate realistic but impressive performance analytics for this post after 1 week.
        Consider the platform's typical engagement patterns. For example, YouTube might have high views but lower shares, while TikTok might have high shares and likes.
        
        Return a single JSON object with the keys "views", "likes", "shares", and "comments". All values must be numbers.
        For example: { "views": 52345, "likes": 3123, "shares": 456, "comments": 189 }.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    views: { type: Type.NUMBER },
                    likes: { type: Type.NUMBER },
                    shares: { type: Type.NUMBER },
                    comments: { type: Type.NUMBER },
                },
                required: ['views', 'likes', 'shares', 'comments']
            }
        }
    });
    
    return JSON.parse(response.text);
};