import { GoogleGenAI, Type } from "@google/genai";
import { VideoData, GeneratedContent, Platform, Comment, EditingSuggestions, Post } from '../types';

// In a real multi-model application, this function would act as a factory,
// returning the appropriate client based on the user's selection.
// For this simulation, it always returns the Gemini client.
const getAiClient = () => {
    // NOTE: This assumes process.env.API_KEY is the Gemini key.
    // A real app would fetch the user-provided key from context/state.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
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


export const generateInitialMetadata = async (fileName: string): Promise<Omit<VideoData, 'file'>> => {
    const ai = getAiClient();
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


export const generateContentAndSuggestions = async (videoData: VideoData): Promise<{ content: GeneratedContent, suggestions: EditingSuggestions }> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-pro';
    const prompt = `
        Based on the video information below, perform two tasks:
        Video Title: "${videoData.title}"
        Video Description: "${videoData.description}"
        Video Tags: ${videoData.tags.join(', ')}
        Content Type: ${videoData.contentType}

        TASK 1: Create tailored content for platforms: ${platforms.join(', ')}.
        For each platform, provide a title, description/caption, and 3-5 relevant hashtags. Keep in mind the style and audience of each platform.

        TASK 2: Provide detailed editing suggestions for a 60-second video. The suggestions should include:
        1. "general": An array of 2 actionable suggestions.
        2. "trimming": An object with "startTime", "endTime", and "reason". Suggest an engaging clip between 15-30 seconds. Can be null.
        3. "overlays": An array of exactly 2 objects, each with "text", "timestamp", "style" ('Title' or 'Call-to-Action'), "position" (e.g., 'bottom-center'), and "animation" ('fade-in' or 'slide-up').
        4. "filter": An object with "name" from ['Vibrant', 'Cinematic', 'Vintage', 'Black & White'] and a "reason". Can be null.
        5. "transition": An object with a "type" from ['cross-fade', 'zoom-in'], a "timestamp", and a "reason". Can be null.
        6. "visualEffect": An object with a "type" from ['glitch', 'slow-motion'], a "timestamp", a "duration", and a "reason". Can be null.

        Return a single JSON object with two top-level keys: "platformContent" and "editingSuggestions", matching the structures described in Task 1 and Task 2.
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

export const generateContentFromIdea = async (idea: string): Promise<{ videoData: VideoData, generatedContent: GeneratedContent, suggestions: EditingSuggestions }> => {
    const ai = getAiClient();
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


export const generateBestPostTimes = async (platforms: Platform[], contentType: string): Promise<Record<Platform, { bestTimeISO: string }>> => {
    const ai = getAiClient();
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


export const generateCommentsWithReplies = async (title: string, description: string): Promise<Comment[]> => {
    const ai = getAiClient();
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

export const generateAnalyticsForPost = async (post: Post): Promise<Post['analytics']> => {
    const ai = getAiClient();
    const model = 'gemini-2.5-flash';
    const prompt = `
        A video titled "${post.title}" was posted on ${post.platform}.
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