import React, { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from '../App';
import { AppPhase, EditState } from '../types';
import { LightbulbIcon, CutIcon, TextIcon, FilterIcon, TransitionIcon, SparklesIcon, ResetIcon, UndoIcon } from './icons/index';
import Loader from './Loader';

const initialEditState: EditState = {
    trim: null,
    overlays: [],
    filter: null,
    transition: null,
    effect: null,
    crop: '16:9'
};

const EditingPhase: React.FC = () => {
    const appContext = useContext(AppContext);
    if (!appContext) return null;

    const { videoData, videoUrl, setPhase, edits, setEdits, editingSuggestions } = appContext;
    
    const [editHistory, setEditHistory] = useState<EditState[]>([]);

    useEffect(() => {
        if (!edits) {
            setEdits(initialEditState);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyEdit = (newEdit: Partial<EditState>) => {
        if (!edits) return;
        setEditHistory(prev => [...prev, edits]);
        setEdits(prev => ({ ...prev, ...newEdit }));
    };

    const handleUndo = () => {
        if (editHistory.length === 0) return;
        const lastState = editHistory[editHistory.length - 1];
        setEdits(lastState);
        setEditHistory(prev => prev.slice(0, -1));
    };

    const resetAllEdits = () => {
        setEdits(initialEditState);
        setEditHistory([]);
    };

    const filterMap: Record<string, string> = {
        'Vibrant': 'saturate(1.5) contrast(1.1)',
        'Cinematic': 'contrast(1.2) saturate(1.1)',
        'Vintage': 'sepia(0.6)',
        'Black & White': 'grayscale(1)',
    };
    
    const positionClasses: Record<string, string> = {
        'top-left': 'top-4 left-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'top-right': 'top-4 right-4 text-right',
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center',
        'bottom-left': 'bottom-4 left-4',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 text-center',
        'bottom-right': 'bottom-4 right-4 text-right',
    };

    const animationClasses: Record<string, string> = {
        'fade-in': 'animate-fade-in',
        'slide-up': 'animate-slide-up',
        'none': '',
    };
    
    const suggestions = editingSuggestions;

    const recommendedCrop = useMemo(() => {
        const contentType = videoData?.contentType.toLowerCase() || '';
        if (contentType.includes('skit') || contentType.includes('vlog') || contentType.includes('routine')) return '9:16';
        if (contentType.includes('tutorial')) return '16:9';
        if (contentType.includes('review')) return '1:1';
        return '16:9';
    }, [videoData]);

    useEffect(() => {
        if (edits && edits.crop === '16:9' && !editHistory.some(e => e.crop !== '16:9')) { // only set initial if it hasn't been changed
             applyEdit({ crop: recommendedCrop });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recommendedCrop]);

    const cropClasses = {
        '16:9': 'aspect-video',
        '9:16': 'aspect-[9/16] w-auto h-full max-w-full',
        '1:1': 'aspect-square h-full w-auto max-w-full',
        '4:5': 'aspect-[4/5] h-full w-auto max-w-full',
    };
    
    const videoSrc = useMemo(() => {
        if (!videoUrl || !edits) return '';
        if (edits.trim) {
            return `${videoUrl}#t=${edits.trim.start},${edits.trim.end}`;
        }
        return videoUrl;
    }, [videoUrl, edits]);

    if (!edits || !appContext.generatedContent) {
        return <div className="flex flex-col items-center justify-center h-full"><Loader/><p className="mt-4">AI is generating content & suggestions...</p></div>
    }

    return (
        <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-2 text-indigo-400">Phase 2: AI-Enhanced Editing</h2>
            <p className="text-center text-gray-400 mb-8">Apply AI-powered suggestions to trim, crop, and enhance your video for maximum impact.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Center Column: Video Player & Tools */}
                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-xl">
                    <div className="relative w-full bg-black rounded-lg mb-4 flex items-center justify-center aspect-video overflow-hidden">
                        {videoUrl ? (
                            <div className={`relative h-full transition-all duration-300 ${cropClasses[edits.crop]}`}>
                                <video 
                                    key={videoSrc} 
                                    controls 
                                    className={`w-full h-full object-contain`}
                                    style={{ filter: edits.filter && filterMap[edits.filter] ? filterMap[edits.filter] : 'none' }}
                                >
                                    <source src={videoSrc} type={videoData?.file?.type} />
                                    Your browser does not support the video tag.
                                </video>
                                {suggestions?.overlays.map((overlay, i) =>
                                    edits.overlays.includes(i) && (
                                        <div
                                            key={i}
                                            className={`absolute text-white font-bold p-2 bg-black bg-opacity-60 rounded-lg pointer-events-none w-11/12
                                                ${positionClasses[overlay.position] || 'bottom-4 left-1/2 -translate-x-1/2'}
                                                ${animationClasses[overlay.animation] || ''}
                                                ${overlay.position.includes('center') ? 'animate-slide-up-center' : 'animate-slide-up'}`
                                            }
                                            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}
                                        >
                                            {overlay.text}
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-4">
                                <LightbulbIcon className="w-16 h-16 text-yellow-400 mb-4" />
                                <h3 className="font-bold text-white">AI-Generated Video Concept</h3>
                            </div>
                        )}
                    </div>
                     {/* Timeline */}
                     <div title="Timeline of applied edits" className="w-full h-8 bg-gray-700 rounded-lg mt-4 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 h-full w-full border border-gray-600 rounded-lg"></div>
                        {edits.trim && suggestions?.trimming && (
                            <div className="absolute h-full bg-indigo-500/50 border-x-2 border-indigo-300" title={`Trimmed: ${suggestions.trimming.startTime}s - ${suggestions.trimming.endTime}s`}
                                style={{ left: `${(suggestions.trimming.startTime / 60) * 100}%`, width: `${((suggestions.trimming.endTime - suggestions.trimming.startTime) / 60) * 100}%` }}>
                            </div>
                        )}
                        {suggestions?.overlays.map((overlay, i) => edits.overlays.includes(i) && (
                            <div key={`ol-tl-${i}`} className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full" title={`Overlay: "${overlay.text}" at ${overlay.timestamp}s`}
                                style={{ left: `${(overlay.timestamp / 60) * 100}%` }}>
                            </div>
                        ))}
                        {edits.transition && (
                             <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-green-400 rounded-full" title={`Transition: ${edits.transition.type} at ${edits.transition.timestamp}s`}
                                style={{ left: `${(edits.transition.timestamp / 60) * 100}%` }}>
                            </div>
                        )}
                         {edits.effect && (
                             <div className="absolute top-0 h-full bg-red-500/50" title={`Effect: ${edits.effect.type} at ${edits.effect.timestamp}s for ${edits.effect.duration}s`}
                                style={{ left: `${(edits.effect.timestamp / 60) * 100}%`, width: `${(edits.effect.duration / 60) * 100}%` }}>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                             <h3 className="text-lg font-semibold mb-2 text-white">Smart Crop (Aspect Ratio)</h3>
                             <div className="flex flex-wrap items-center gap-2">
                                {(['16:9', '9:16', '1:1', '4:5'] as const).map(ratio => (
                                    <button key={ratio} onClick={() => applyEdit({ crop: ratio })} className={`relative py-2 px-4 rounded-lg transition-colors text-sm font-semibold ${edits.crop === ratio ? 'bg-indigo-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}`}>
                                        {ratio === recommendedCrop && <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full">AI</span>}
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 md:mt-0">
                            <button onClick={handleUndo} disabled={editHistory.length === 0} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                               <UndoIcon className="w-4 h-4" /> Undo
                            </button>
                            <button onClick={resetAllEdits} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                               <ResetIcon className="w-4 h-4" /> Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Suggestions */}
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                    <div className="flex items-center gap-3 mb-4">
                        <LightbulbIcon className="w-6 h-6 text-yellow-400" />
                        <h3 className="text-xl font-bold text-white">AI Editing Suite</h3>
                    </div>
                    {suggestions ? (
                        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
                             <div className="bg-gray-900/70 p-3 rounded-md">
                                <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2"><CutIcon className="w-4 h-4"/> Smart Trim</h4>
                                {suggestions.trimming ? (
                                     <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-300">Clip: <b className="text-white">{suggestions.trimming.startTime}s - {suggestions.trimming.endTime}s</b>.<br/><i>{suggestions.trimming.reason}</i></p>
                                        <button onClick={() => applyEdit({ trim: suggestions.trimming! })} disabled={JSON.stringify(edits.trim) === JSON.stringify(suggestions.trimming)} className="text-xs font-semibold py-1 px-3 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-green-600 disabled:cursor-not-allowed transition-colors ml-2 flex-shrink-0">
                                           {JSON.stringify(edits.trim) === JSON.stringify(suggestions.trimming) ? '✓ Applied' : 'Apply'}
                                        </button>
                                    </div>
                                ) : <p className="text-sm text-gray-400 italic">No trim needed.</p>}
                            </div>

                             <div className="bg-gray-900/70 p-3 rounded-md">
                                <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2"><TextIcon className="w-4 h-4"/> Text Overlays</h4>
                                <ul className="space-y-2">
                                    {suggestions.overlays.map((overlay, i) => (
                                        <li key={i} className="text-sm text-gray-300 flex justify-between items-center">
                                            <span>At <b className="text-white">{overlay.timestamp}s</b>: <i className="text-white">"{overlay.text}"</i></span>
                                            <button onClick={() => applyEdit({ overlays: [...edits.overlays, i] })} disabled={edits.overlays.includes(i)} className="text-xs font-semibold py-1 px-3 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-green-600 disabled:cursor-not-allowed transition-colors flex-shrink-0 ml-2">
                                                {edits.overlays.includes(i) ? '✓ Added' : 'Add'}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="bg-gray-900/70 p-3 rounded-md">
                                <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2"><FilterIcon className="w-4 h-4"/> Suggested Filter</h4>
                                {suggestions.filter ? (
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-300">Use <b className="text-white">{suggestions.filter.name}</b> filter. <br/><i>{suggestions.filter.reason}</i></p>
                                        <button onClick={() => applyEdit({ filter: suggestions.filter!.name })} disabled={edits.filter === suggestions.filter.name} className="text-xs font-semibold py-1 px-3 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-green-600 disabled:cursor-not-allowed transition-colors ml-2 flex-shrink-0">
                                            {edits.filter === suggestions.filter.name ? '✓ Applied' : 'Apply'}
                                        </button>
                                    </div>
                                ) : <p className="text-sm text-gray-400 italic">No filter recommended.</p>}
                            </div>

                            <div className="bg-gray-900/70 p-3 rounded-md">
                                <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2"><TransitionIcon className="w-4 h-4"/> Transition Effect</h4>
                                {suggestions.transition ? (
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-300">Add <b className="text-white">{suggestions.transition.type}</b> at {suggestions.transition.timestamp}s.<br/><i>{suggestions.transition.reason}</i></p>
                                        <button onClick={() => applyEdit({ transition: suggestions.transition })} disabled={JSON.stringify(edits.transition) === JSON.stringify(suggestions.transition)} className="text-xs font-semibold py-1 px-3 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-green-600 disabled:cursor-not-allowed transition-colors ml-2 flex-shrink-0">
                                            {JSON.stringify(edits.transition) === JSON.stringify(suggestions.transition) ? '✓ Applied' : 'Apply'}
                                        </button>
                                    </div>
                                ) : <p className="text-sm text-gray-400 italic">No transition suggested.</p>}
                            </div>

                            <div className="bg-gray-900/70 p-3 rounded-md">
                                <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2"><SparklesIcon className="w-4 h-4"/> Visual Effect</h4>
                                {suggestions.visualEffect ? (
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-300"><b className="text-white">{suggestions.visualEffect.type}</b> effect at {suggestions.visualEffect.timestamp}s.<br/><i>{suggestions.visualEffect.reason}</i></p>
                                        <button onClick={() => applyEdit({ effect: suggestions.visualEffect })} disabled={JSON.stringify(edits.effect) === JSON.stringify(suggestions.visualEffect)} className="text-xs font-semibold py-1 px-3 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-green-600 disabled:cursor-not-allowed transition-colors ml-2 flex-shrink-0">
                                            {JSON.stringify(edits.effect) === JSON.stringify(suggestions.visualEffect) ? '✓ Applied' : 'Apply'}
                                        </button>
                                    </div>
                                ) : <p className="text-sm text-gray-400 italic">No special effects recommended.</p>}
                            </div>
                        </div>
                    ) : <div className="flex flex-col items-center justify-center h-full"><Loader /><p className="mt-2 text-sm text-gray-400">Loading AI suggestions...</p></div>}
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={() => setPhase(AppPhase.GENERATION)}
                    className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-md hover:bg-indigo-700 transition-colors text-lg"
                >
                    Next: Review & Schedule &rarr;
                </button>
            </div>
        </div>
    );
};

export default EditingPhase;