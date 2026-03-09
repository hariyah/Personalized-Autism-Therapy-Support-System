import React, { useState } from 'react';

function TextInput({ onSubmit, isLoading }) {
    const [text, setText] = useState('');

    const handleSubmit = () => {
        if (text.trim()) {
            onSubmit(text);
            setText('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="p-8 md:p-12 text-center bg-white/50">
            <div className="space-y-6">

                {/* Header */}
                <div>
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl mx-auto flex items-center justify-center mb-4 text-3xl">
                        ✍️
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Text Input</h2>
                    <p className="text-slate-500 mt-1">Type your thoughts or conversation for analysis</p>
                </div>

                {/* Input Container */}
                <div className="max-w-md mx-auto mt-8">
                    <div className="space-y-6 animate-fade-in">
                        <div className="relative">
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                placeholder="Type here... (e.g., 'I feel overwhelmed when there are loud noises')"
                                className="w-full h-48 p-4 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 text-slate-700 placeholder:text-slate-400 resize-none transition-all shadow-sm text-lg"
                            />
                            <div className="absolute bottom-4 right-4 text-xs text-slate-400 font-medium">
                                {text.length} chars
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || !text.trim()}
                            className={`w-full py-4 text-white rounded-xl font-bold shadow-lg transform transition-all duration-200 flex items-center justify-center space-x-2
                ${text.trim() && !isLoading
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5'
                                    : 'bg-slate-300 cursor-not-allowed'
                                }`}
                        >
                            <span>Analyze Text Now</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TextInput;
