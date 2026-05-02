import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import therapyApi from '../utils/therapyApi';
import { BASE } from '../routes';
import { FiSend, FiMessageSquare, FiActivity, FiPaperclip } from 'react-icons/fi';

const ChatBox = ({ childId, receiverId, receiverName }) => {
    const { user } = useAuth();
    const userId = user?._id;
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = (behavior = 'smooth') => {
        const container = messagesContainerRef.current;
        if (!container) return;

        container.scrollTo({
            top: container.scrollHeight,
            behavior
        });
    };

    useEffect(() => {
        if (!childId || !receiverId) return;
        const fetchMessages = async () => {
            try {
                const res = await therapyApi.get(`/api/messages/${childId}`);
                // Filter messages that belong to the current parent-doctor combination to emulate a private channel.
                let relevant = res.data.messages || [];
                relevant = relevant.filter(m =>
                    (m.sender?._id === userId && m.receiver === receiverId) ||
                    (m.sender?._id === receiverId && m.receiver === userId)
                );
                setMessages(relevant);
            } catch (error) { console.error('Chat error:', error); }
            finally { setLoading(false); }
        };
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [childId, receiverId, userId]);

    useEffect(() => {
        requestAnimationFrame(() => scrollToBottom(loading ? 'auto' : 'smooth'));
    }, [messages, loading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !receiverId) return;

        const originalMsg = newMessage;
        setNewMessage('');
        const optimisticMsg = { _id: Date.now(), sender: { _id: userId }, content: originalMsg, createdAt: new Date(), messageType: 'text' };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            await therapyApi.post('/api/messages', { receiverId, childId, content: originalMsg });
            // Refetch to get the persisted backend response
            const res = await therapyApi.get(`/api/messages/${childId}`);
            let relevant = res.data.messages || [];
            relevant = relevant.filter(m =>
                (m.sender?._id === userId && m.receiver === receiverId) ||
                (m.sender?._id === receiverId && m.receiver === userId)
            );
            setMessages(relevant);
        } catch (error) {
            console.error('Send message error:', error);
            setMessages(prev => prev.filter(m => m._id !== optimisticMsg._id));
            setNewMessage(originalMsg);
        }
    };

    const handleForward = (text) => {
        navigate(`${BASE}/doctor/new-analysis/${childId}`, { state: { prefillText: text } });
    };

    const handleForwardVoice = (audioDataUrl) => {
        navigate(`${BASE}/doctor/new-analysis/${childId}`, { state: { prefillAudio: audioDataUrl } });
    };

    const handleVoiceUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('audio', file);
        formData.append('childId', childId);
        formData.append('receiverId', receiverId);

        try {
            await therapyApi.post('/api/messages/voice', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Fetch messages directly after successful voice send
            const res = await therapyApi.get(`/api/messages/${childId}`);
            let relevant = res.data.messages || [];
            relevant = relevant.filter(m =>
                (m.sender?._id === userId && m.receiver === receiverId) ||
                (m.sender?._id === receiverId && m.receiver === userId)
            );
            setMessages(relevant);
        } catch (error) {
            console.error('Voice send error:', error);
        }
    };

    if (!receiverId) return null;

    return (
        <div className="tc-dark-panel flex flex-col h-[500px] bg-[#0d1220] rounded-2xl border border-white/[0.06] shadow-xl overflow-hidden shadow-black/40">
            {/* Header */}
            <div className="p-4 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md relative">
                        {receiverName?.[0]}
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#0d1220] rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-200">{receiverName}</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Connected | Secure</p>
                    </div>
                </div>
                <FiMessageSquare className="text-slate-600" />
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')]">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center px-4">
                        <div>
                            <div className="w-12 h-12 bg-white/[0.03] rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/[0.05]">
                                <FiMessageSquare className="text-slate-600" size={20} />
                            </div>
                            <p className="text-slate-400 text-sm font-medium">Session Initialized.</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Send a message to start.</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMe = msg.sender === userId || msg.sender?._id === userId;
                        return (
                            <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300 filter drop-shadow-md`}>
                                <div className={`max-w-[75%] px-5 py-3 rounded-2xl relative group ${isMe ? 'gradient-primary text-white rounded-br-sm' : 'bg-white/[0.06] border border-white/[0.08] text-slate-200 rounded-bl-sm'}`}>
                                    {msg.messageType === 'voice' ? (
                                        <div className="mb-2 w-full min-w-[220px]">
                                            <audio 
                                                src={msg.content} 
                                                controls 
                                                className="w-full h-10 rounded-lg" 
                                                preload="metadata"
                                            />
                                            <p className={`text-[10px] font-bold mt-2 tracking-widest uppercase ${isMe ? 'text-white/70' : 'text-slate-400'}`}>Voice Note</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                                    )}
                                    <p className={`text-[9px] mt-1.5 font-bold uppercase tracking-widest flex items-center gap-3 ${isMe ? 'text-white/60 justify-end' : 'text-slate-500'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {user?.role === 'doctor' && (
                                        <div className={`mt-3 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <button
                                                type="button"
                                                onClick={() => msg.messageType === 'voice' ? handleForwardVoice(msg.content) : handleForward(msg.content)}
                                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${msg.messageType === 'voice'
                                                    ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200 hover:bg-cyan-400/25 hover:text-white'
                                                    : 'border-teal-400/40 bg-teal-400/15 text-teal-100 hover:bg-teal-400/25 hover:text-white'
                                                    }`}
                                            >
                                                <FiActivity size={11} />
                                                {msg.messageType === 'voice' ? 'Forward Voice To Analysis' : 'Forward Text To Analysis'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 bg-white/[0.02] border-t border-white/[0.06] z-10">
                <div className="relative flex items-center gap-2">
                    <input type="file" accept="audio/*" ref={fileInputRef} onChange={handleVoiceUpload} className="hidden" />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-12 shrink-0 bg-white/[0.04] rounded-full flex items-center justify-center gap-2 px-4 text-slate-300 hover:text-white hover:bg-cyan-500/15 transition-all border border-white/[0.05] hover:border-cyan-400/40"
                        title="Upload Voice Note"
                    >
                        <FiPaperclip size={18} />
                        <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Voice</span>
                    </button>
                    <div className="relative flex-1">
                        <input
                            type="text"
                            className="input-dark !rounded-full !pr-14 !py-3.5 focus:bg-white/[0.07] transition-all w-full"
                            placeholder="Type a secure message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="absolute right-2 top-1.5 w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white shadow-md shadow-violet-500/20 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all outline-none"
                        >
                            <FiSend size={15} className="-ml-0.5 mt-0.5" />
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ChatBox;

