import React, { useState, useRef } from 'react';
import therapyApi from '../../utils/therapyApi';
import { FiCamera, FiMic, FiCheckCircle, FiAlertCircle, FiCameraOff, FiUploadCloud } from 'react-icons/fi';

const EmotionCapture = ({ childId, onCapture }) => {
    const [mode, setMode] = useState('camera'); // 'camera' or 'manual'
    const [status, setStatus] = useState('idle'); // idle, capturing, processing, success, error
    const [loadingMsg, setLoadingMsg] = useState('');
    const [manualEmotion, setManualEmotion] = useState('calm');

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
            setStream(mediaStream);
            setStatus('ready');
        } catch (err) {
            setStatus('error');
            setLoadingMsg('Camera access denied or unavailable.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            if (videoRef.current) videoRef.current.srcObject = null;
        }
        setStatus('idle');
    };

    const captureImage = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        setStatus('processing');
        setLoadingMsg('Analyzing biometric response...');

        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);

        const imageData = canvasRef.current.toDataURL('image/jpeg');
        const blob = await (await fetch(imageData)).blob();

        const formData = new FormData();
        formData.append('image', blob, 'capture.jpg');

        try {
            const res = await therapyApi.post(`/api/emotion/recognize/${childId}`, formData);
            setStatus('success');
            onCapture(res.data.child.emotionHistory[res.data.child.emotionHistory.length - 1]);
            setTimeout(() => { stopCamera(); setStatus('idle'); }, 2000);
        } catch (err) {
            setStatus('error');
            setLoadingMsg('Analysis failed. Please try again.');
        }
    };

    const submitManual = async () => {
        setStatus('processing');
        setLoadingMsg('Updating behavioral state...');
        try {
            const res = await therapyApi.post(`/api/emotion/update/${childId}`, { emotion: manualEmotion });
            setStatus('success');
            onCapture(res.data.child.emotionHistory[res.data.child.emotionHistory.length - 1]);
            setTimeout(() => setStatus('idle'), 2000);
        } catch (err) {
            setStatus('error');
            setLoadingMsg('Failed to sync. Please try again.');
            setTimeout(() => setStatus('idle'), 2000);
        }
    };

    return (
        <div className="card p-1 border-subtle overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-violet-500/5 transition-opacity opacity-0 group-hover:opacity-100" />

            <div className="p-6 relative z-10 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.01]">
                <div>
                    <h2 className="text-xl font-black text-slate-100 mb-1 flex items-center gap-2"><FiMic className="text-teal-400" /> Determine State</h2>
                    <p className="text-xs text-slate-500 font-medium tracking-wide">AI-powered facial tracking or explicit input.</p>
                </div>
                <div className="flex bg-white/[0.04] rounded-lg p-1 border border-white/[0.06]">
                    <button onClick={() => { setMode('camera'); stopCamera(); }} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'camera' ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-300 border border-teal-500/20 shadow-sm' : 'text-slate-500'}`}>Visual AI</button>
                    <button onClick={() => { setMode('manual'); stopCamera(); }} className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'manual' ? 'bg-white/[0.1] text-slate-200 border border-white/[0.1] shadow-sm' : 'text-slate-500'}`}>Manual</button>
                </div>
            </div>

            <div className="p-6 relative z-10 bg-[#0d1220]">
                {status === 'processing' && (
                    <div className="absolute inset-0 bg-[#0d1220]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                        <div className="w-12 h-12 border-4 border-teal-500/30 border-t-teal-400 rounded-full animate-spin shadow-[0_0_15px_rgba(45,212,191,0.5)]"></div>
                        <p className="mt-4 text-xs font-bold text-teal-300 uppercase tracking-[0.2em]">{loadingMsg}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-md flex flex-col items-center justify-center z-20 border border-emerald-500/20 rounded-xl m-4">
                        <FiCheckCircle size={48} className="text-emerald-400 mb-3 shadow-glow rounded-full" />
                        <p className="text-sm font-black text-emerald-300 uppercase tracking-[0.2em]">State Synchronized</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold flex items-center gap-3">
                        <FiAlertCircle size={16} className="shrink-0" /> {loadingMsg}
                    </div>
                )}

                {mode === 'camera' ? (
                    <div>
                        <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-white/[0.1] mb-6 shadow-xl w-full max-w-lg mx-auto flex items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-90" />
                            <canvas ref={canvasRef} className="hidden" />
                            {(!stream && status !== 'error') && (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-3 border border-white/[0.1]">
                                        <FiCameraOff className="text-slate-600" size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Awaiting Video Input</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center gap-4">
                            {!stream ? (
                                <button onClick={startCamera} className="w-full max-w-[200px] py-3.5 gradient-primary rounded-xl font-black uppercase tracking-[0.1em] text-white text-[10px] shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all outline-none">
                                    <FiCamera size={14} /> Initialize Camera
                                </button>
                            ) : (
                                <>
                                    <button onClick={captureImage} className="w-full max-w-[200px] py-3.5 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-xl font-black uppercase tracking-[0.1em] text-white text-[10px] shadow-lg shadow-teal-500/25 flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all outline-none">
                                        <FiUploadCloud size={14} /> Scan Biometrics
                                    </button>
                                    <button onClick={stopCamera} className="w-full max-w-[200px] py-3.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl font-black uppercase tracking-[0.1em] text-[10px] flex items-center justify-center gap-2 hover:bg-rose-500/20 transition-all outline-none">
                                        End Session
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="py-6">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 block text-center">Override Detected State</label>
                        <select
                            className="bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-4 w-full max-w-sm mx-auto block text-slate-200 font-bold text-sm outline-none focus:border-teal-500/40 text-center tracking-wide shadow-inner cursor-pointer"
                            value={manualEmotion}
                            onChange={(e) => setManualEmotion(e.target.value)}
                        >
                            <option value="calm" className="bg-slate-900">😌 Calm / Regulated</option>
                            <option value="happy" className="bg-slate-900">😄 Happy / Engaged</option>
                            <option value="frustrated" className="bg-slate-900">😫 Frustrated / Stressed</option>
                            <option value="anxious" className="bg-slate-900">😰 Anxious / Overwhelmed</option>
                            <option value="excited" className="bg-slate-900">🤩 Excited / Hyper</option>
                        </select>
                        <button onClick={submitManual} className="w-full max-w-sm mx-auto block mt-6 py-4 bg-white/10 text-white border border-white/20 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/20 transition-all shadow-lg active:scale-95 outline-none">
                            Sync State Manual
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmotionCapture;
