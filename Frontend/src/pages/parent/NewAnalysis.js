import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import { FiMic, FiSquare, FiFileText, FiUploadCloud, FiAlertCircle, FiCheckCircle, FiUser } from 'react-icons/fi';

const NewAnalysisParent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const preselectedChildId = queryParams.get('childId');

    const [children, setChildren] = useState([]);
    const [selectedChild, setSelectedChild] = useState(preselectedChildId || '');
    const [inputType, setInputType] = useState('audio');
    const [textInput, setTextInput] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        axios.get('/api/parent/children')
            .then(res => {
                const kids = res.data.children || [];
                setChildren(kids);
                if (!selectedChild && kids.length > 0) setSelectedChild(kids[0]._id);
                setLoading(false);
            })
            .catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => setRecordingTime(t => t + 1), 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(t => t.stop());
            };
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);
            setAudioBlob(null);
        } catch (err) {
            setError('Microphone access denied.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setProcessing(true);

        try {
            const formData = new FormData();
            formData.append('inputType', inputType);
            if (inputType === 'audio') {
                if (!audioBlob) throw new Error('Please record audio first.');
                formData.append('audio', audioBlob, 'recording.webm');
            } else {
                if (!textInput.trim()) throw new Error('Please enter text.');
                formData.append('transcript', textInput);
            }

            await axios.post(`/api/parent/children/${selectedChild}/analyses`, formData);
            setSuccess('Analysis completed perfectly! Specialist has been notified.');
            setTimeout(() => navigate(`/parent/children/${selectedChild}`), 2500);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Analysis failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (loading) return (
        <div className="flex min-h-screen bg-app"><Sidebar />
            <div className="flex-1 flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-app">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="max-w-4xl mx-auto p-8 page-enter">
                    {/* Header */}
                    <div className="mb-10 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full mb-6 relative mt-4">
                            <span className="text-[10px] font-bold text-violet-300 uppercase tracking-widest flex items-center gap-2">
                                <span className={children.length > 0 ? 'glow-dot' : 'glow-dot-rose'} /> Parent Submission Portal
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-100 mb-2 tracking-tight">Record New Progress</h1>
                        <p className="text-slate-400 font-medium">Capture daily progress or behavior for specialist review.</p>
                    </div>

                    <div className="card p-8 border-subtle card-glow relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] opacity-50" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] opacity-40" />

                        {error && (
                            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-bold flex items-center gap-3 animate-shake">
                                <FiAlertCircle size={18} className="shrink-0" /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-6 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-center font-bold animate-in zoom-in-95 duration-200">
                                <FiCheckCircle size={32} className="mx-auto mb-2 text-emerald-500 shadow-glow rounded-full" />
                                {success}
                            </div>
                        )}

                        {children.length === 0 ? (
                            <div className="text-center py-10 relative z-10">
                                <div className="w-16 h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/[0.05]">
                                    <FiUser className="text-slate-600" size={24} />
                                </div>
                                <h3 className="text-slate-300 font-bold mb-2">No Profiles Available</h3>
                                <p className="text-slate-500 text-sm mb-6">You need to register a family member first.</p>
                                <button onClick={() => navigate('/parent/children')} className="btn-primary">Register Child Profile</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="relative z-10">
                                {/* Profile Select */}
                                <div className="mb-8 max-w-sm mx-auto">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block text-center">
                                        Select Child Profile
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-5 py-4 text-slate-200 font-bold text-sm outline-none focus:border-violet-500/30 focus:ring-4 focus:ring-violet-500/10 appearance-none text-center shadow-inner cursor-pointer"
                                            value={selectedChild}
                                            onChange={(e) => setSelectedChild(e.target.value)}
                                            required
                                        >
                                            {children.map(c => (
                                                <option key={c._id} value={c._id} className="bg-slate-900 text-slate-200">{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Input Type Toggle */}
                                <div className="flex bg-white/[0.03] border border-white/[0.06] p-1.5 rounded-2xl mb-8 w-fit mx-auto shadow-inner">
                                    <button type="button" onClick={() => setInputType('audio')} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${inputType === 'audio' ? 'bg-gradient-to-r from-violet-500/30 to-violet-500/10 text-violet-300 shadow-sm border border-violet-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'}`}>
                                        <FiMic size={14} /> Voice Note
                                    </button>
                                    <button type="button" onClick={() => setInputType('text')} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${inputType === 'text' ? 'bg-white/[0.1] text-slate-200 shadow-sm border border-white/[0.1]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'}`}>
                                        <FiFileText size={14} /> Text Input
                                    </button>
                                </div>

                                {/* Audio Mode */}
                                {inputType === 'audio' && (
                                    <div className="text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/[0.1] mb-8">
                                        <div className="mb-8">
                                            <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center transition-all duration-300 relative z-10 ${isRecording ? 'bg-rose-500/20 border-2 border-rose-500 shadow-[0_0_40px_rgba(244,63,94,0.4)] animate-pulse' : audioBlob ? 'bg-emerald-500/20 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-white/[0.03] border-2 border-white/[0.08]'}`}>
                                                <FiMic size={40} className={isRecording ? 'text-rose-400' : audioBlob ? 'text-emerald-400' : 'text-slate-600'} />
                                            </div>
                                        </div>
                                        <div className="text-5xl font-black text-slate-200 mb-8 font-mono tracking-wider tabular-nums">
                                            {formatTime(recordingTime)}
                                        </div>
                                        {!isRecording && !audioBlob ? (
                                            <button type="button" onClick={startRecording} className="mx-auto flex items-center gap-2 px-10 py-5 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full font-black uppercase tracking-[0.2em] hover:bg-rose-500/20 hover:scale-[1.02] transition-all shadow-xl shadow-rose-500/20 text-xs">
                                                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse" /> Begin Recording
                                            </button>
                                        ) : isRecording ? (
                                            <button type="button" onClick={stopRecording} className="btn-danger mx-auto flex items-center gap-2 px-10 py-5 rounded-full text-xs uppercase font-black tracking-[0.2em]">
                                                <FiSquare size={14} fill="currentColor" /> Stop Recording
                                            </button>
                                        ) : (
                                            <div className="flex flex-col sm:flex-row justify-center gap-4 items-center">
                                                <button type="button" onClick={() => setAudioBlob(null)} className="btn-secondary !rounded-full !py-4 text-xs">Retake Audio</button>
                                                <div className="p-2 border border-white/[0.06] rounded-full bg-white/[0.02]">
                                                    <audio src={URL.createObjectURL(audioBlob)} controls className="h-10 opacity-80 filter invert-[0.8] mix-blend-screen" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Text Mode */}
                                {inputType === 'text' && (
                                    <div className="mb-8">
                                        <label className="text-[10px] font-bold text-violet-400 uppercase tracking-[0.2em] mb-3 block flex items-center gap-2">
                                            <FiFileText /> Enter daily journal notes
                                        </label>
                                        <textarea
                                            className="input-dark min-h-[300px] resize-y p-6 text-sm leading-relaxed"
                                            placeholder="Example: Tommy had a great day today. He played with his toys quietly and showed interest in a new puzzle..."
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={processing || (inputType === 'audio' && !audioBlob) || (inputType === 'text' && !textInput.trim())}
                                    className="w-full max-w-md mx-auto py-5 gradient-primary rounded-2xl font-black uppercase tracking-[0.2em] text-white text-[10px] shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 relative overflow-hidden"
                                >
                                    {processing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                                            <span className="relative z-10">Running Secure AI Analysis...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiUploadCloud size={20} className="relative z-10" />
                                            <span className="relative z-10">Upload for Analysis</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewAnalysisParent;
