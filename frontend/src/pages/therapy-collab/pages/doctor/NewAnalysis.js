import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../../components/Sidebar';
import AnalysisCard from '../../components/AnalysisCard';
import DoctorReviewPanel from '../../components/DoctorReviewPanel';
import ResultsDisplay from '../../components/ResultsDisplay';
import { FiActivity, FiAlertCircle, FiCheckCircle, FiFileText, FiMic, FiSquare, FiUploadCloud, FiUser } from 'react-icons/fi';

const NewAnalysisDoctor = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);
    const resultsRef = useRef(null);

    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [analysisHistory, setAnalysisHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [latestAnalysis, setLatestAnalysis] = useState(null);

    const [inputType, setInputType] = useState(
        location.state?.prefillText ? 'text' :
        location.state?.prefillAudio ? 'audio' : 'audio'
    );
    const [textInput, setTextInput] = useState(location.state?.prefillText || '');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState(location.state?.prefillAudio || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        axios.get('/api/doctor/patients')
            .then(res => setPatients(res.data.patients || []))
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (selectedPatientId && patients.length > 0) {
            const found = patients.find(p => p._id === selectedPatientId);
            setSelectedPatient(found || null);
        } else {
            setSelectedPatient(null);
        }
    }, [selectedPatientId, patients]);

    useEffect(() => {
        const prefillAudio = location.state?.prefillAudio;
        if (prefillAudio && prefillAudio.startsWith('data:')) {
            fetch(prefillAudio)
                .then(res => res.blob())
                .then(blob => {
                    setAudioBlob(blob);
                    setAudioPreviewUrl(prefillAudio);
                })
                .catch(err => console.error('Failed to convert audio:', err));
        }
    }, [location.state?.prefillAudio]);

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => setRecordingTime(t => t + 1), 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    useEffect(() => {
        if (!selectedPatientId) {
            setAnalysisHistory([]);
            setLatestAnalysis(null);
            return;
        }

        let cancelled = false;
        setHistoryLoading(true);

        axios.get(`/api/doctor/patients/${selectedPatientId}/analyses`)
            .then(res => {
                if (!cancelled) setAnalysisHistory(res.data.analyses || []);
            })
            .catch(err => {
                if (!cancelled) console.error(err);
            })
            .finally(() => {
                if (!cancelled) setHistoryLoading(false);
            });

        setLatestAnalysis(null);
        setSuccess('');
        setError('');

        return () => {
            cancelled = true;
        };
    }, [selectedPatientId]);

    useEffect(() => {
        if (latestAnalysis && resultsRef.current) {
            resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [latestAnalysis]);

    useEffect(() => () => {
        if (audioPreviewUrl && audioPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(audioPreviewUrl);
        }
    }, [audioPreviewUrl]);

    const resetAudio = () => {
        if (audioPreviewUrl && audioPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(audioPreviewUrl);
        }
        setAudioBlob(null);
        setAudioPreviewUrl(null);
        setRecordingTime(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks = [];
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioPreviewUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(t => t.stop());
            };
            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);
            resetAudio();
        } catch (err) {
            setError('Microphone access denied or unavailable.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('audio/')) {
            setError('Please upload a valid audio file.');
            return;
        }

        if (audioPreviewUrl && audioPreviewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(audioPreviewUrl);
        }

        setAudioBlob(file);
        setAudioPreviewUrl(URL.createObjectURL(file));
        setRecordingTime(0);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            if (!selectedPatientId) throw new Error('Please select a patient first.');

            const formData = new FormData();
            formData.append('inputType', inputType);
            if (inputType === 'audio') {
                if (!audioBlob) throw new Error('Please record or upload audio first.');
                const fileName = audioBlob.name || 'recording.webm';
                formData.append('audio', audioBlob, fileName);
            } else {
                if (!textInput.trim()) throw new Error('Please enter text describing the symptoms.');
                formData.append('transcript', textInput);
            }

            const response = await axios.post(`/api/doctor/patients/${selectedPatientId}/analyses`, formData);
            const savedAnalysis = response.data.analysis;

            setLatestAnalysis(savedAnalysis);
            setAnalysisHistory(prev => [savedAnalysis, ...prev.filter(item => item._id !== savedAnalysis._id)]);
            setSuccess('Analysis processed, treatment suggestions generated, and the record was saved.');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleReviewSaved = (updatedAnalysis) => {
        setLatestAnalysis(updatedAnalysis);
        setAnalysisHistory(prev => prev.map(item => item._id === updatedAnalysis._id ? updatedAnalysis : item));
    };

    return (
        <div className="flex min-h-screen bg-app">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <div className="max-w-6xl mx-auto p-8 page-enter">
                    <div className="mb-10 text-center relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] px-4 py-2 rounded-full mb-6 relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-transparent rounded-full opacity-50 blur-sm" />
                            <span className="relative z-10 text-[10px] font-bold text-violet-300 uppercase tracking-widest flex items-center gap-2">
                                <span className={selectedPatient ? 'glow-dot' : 'glow-dot-rose'} />
                                Patient Connection: <span className="text-slate-100">{selectedPatient?.name || 'Select Patient'}</span>
                            </span>
                        </div>
                        <h1 className="text-4xl font-black text-slate-100 mb-2 tracking-tight">Clinical Record Analysis</h1>
                        <p className="text-slate-400 font-medium">Capture voice notes or text, then review the separate AI results and saved history below.</p>
                    </div>

                    <div className="card p-8 border-subtle card-glow relative overflow-hidden">
                        <div className="absolute -top-32 -left-32 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl opacity-50" />
                        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl opacity-50" />

                        <div className="mb-8 relative z-10">
                            <label className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <FiUser /> Select Patient
                            </label>
                            <select
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                                className="input-dark w-full cursor-pointer"
                                required
                            >
                                <option value="">-- Choose a patient --</option>
                                {patients.map(p => (
                                    <option key={p._id} value={p._id}>
                                        {p.name} (Age {p.age}, {p.gender})
                                    </option>
                                ))}
                            </select>
                        </div>

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

                        <form onSubmit={handleSubmit} className="relative z-10">
                            <div className="flex bg-white/[0.03] border border-white/[0.06] p-1.5 rounded-2xl mb-8 w-fit mx-auto shadow-inner">
                                <button type="button" onClick={() => setInputType('audio')} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${inputType === 'audio' ? 'bg-gradient-to-r from-violet-500/30 to-violet-500/10 text-violet-300 shadow-sm border border-violet-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'}`}>
                                    <FiMic size={14} /> Audio Input
                                </button>
                                <button type="button" onClick={() => setInputType('text')} className={`flex items-center gap-2 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${inputType === 'text' ? 'bg-white/[0.1] text-slate-200 shadow-sm border border-white/[0.1]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.05]'}`}>
                                    <FiFileText size={14} /> Text Input
                                </button>
                            </div>

                            {inputType === 'audio' && (
                                <div className="text-center py-10 bg-white/[0.01] rounded-2xl border border-dashed border-white/[0.1] mb-8">
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />

                                    <div className="mb-8">
                                        <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center transition-all duration-300 ${isRecording ? 'bg-rose-500/20 border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-pulse' : audioBlob ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-white/[0.03] border-2 border-white/[0.08]'}`}>
                                            <FiMic size={40} className={isRecording ? 'text-rose-400' : audioBlob ? 'text-emerald-400' : 'text-slate-600'} />
                                        </div>
                                    </div>

                                    <div className="text-4xl font-black text-slate-200 mb-8 font-mono tracking-wider tabular-nums">
                                        {formatTime(recordingTime)}
                                    </div>

                                    {!isRecording && !audioBlob ? (
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="flex items-center gap-4">
                                                <button type="button" onClick={startRecording} className="flex items-center gap-2 px-8 py-4 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full font-bold uppercase tracking-widest hover:bg-rose-500/20 hover:scale-[1.02] transition-all shadow-lg shadow-rose-500/20 text-xs">
                                                    <span className="w-2 h-2 rounded-full bg-rose-400" /> Start Recording
                                                </button>
                                                <span className="text-slate-500 text-xs font-bold">OR</span>
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-8 py-4 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full font-bold uppercase tracking-widest hover:bg-cyan-500/20 hover:scale-[1.02] transition-all shadow-lg shadow-cyan-500/20 text-xs">
                                                    <FiUploadCloud size={14} /> Upload File
                                                </button>
                                            </div>
                                            <p className="text-slate-500 text-xs mt-2">Supports MP3, WAV, M4A, WebM formats</p>
                                        </div>
                                    ) : isRecording ? (
                                        <button type="button" onClick={stopRecording} className="btn-danger mx-auto flex items-center gap-2 px-8 py-4 rounded-full font-bold uppercase tracking-widest hover:scale-[1.02] transition-all text-xs">
                                            <FiSquare size={12} fill="currentColor" /> Stop Recording
                                        </button>
                                    ) : (
                                        <div className="flex flex-col items-center gap-4">
                                            <audio src={audioPreviewUrl} controls className="h-12 w-full max-w-xs rounded-lg" />
                                            <div className="flex gap-3">
                                                <button type="button" onClick={resetAudio} className="btn-secondary text-xs">Record New</button>
                                                <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary text-xs flex items-center gap-1">
                                                    <FiUploadCloud size={12} /> Upload Different
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {inputType === 'text' && (
                                <div className="mb-8 relative">
                                    <label className="text-[10px] font-bold text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <FiFileText /> Clinical Notes & Behavioral Observations
                                    </label>
                                    <textarea
                                        className="input-dark min-h-[250px] resize-y p-6 text-sm leading-relaxed"
                                        placeholder="Enter detailed observations of patient behavior, triggers, emotional responses, or general updates here..."
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        required
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                        {textInput.length} chars
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || (inputType === 'audio' && !audioBlob) || (inputType === 'text' && !textInput.trim())}
                                className="w-full py-4 gradient-primary rounded-xl font-bold text-white text-sm shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 relative overflow-hidden"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                                        <span className="relative z-10 uppercase tracking-widest text-[10px]">Processing via AI...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiUploadCloud size={18} className="relative z-10" />
                                        <span className="relative z-10 uppercase tracking-widest text-[10px] font-black">Submit For Analysis</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {latestAnalysis && (
                        <section ref={resultsRef} className="mt-8 card p-8 border-subtle card-glow">
                            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-violet-300">Latest Result</p>
                                    <h2 className="mt-2 text-2xl font-black text-slate-100">Separate AI Results Panel</h2>
                                    <p className="mt-2 text-sm text-slate-400">This result has already been saved to the patient record history.</p>
                                </div>
                                <button onClick={() => navigate(`/doctor/patients/${selectedPatientId}?tab=analyses`)} className="btn-secondary flex items-center justify-center gap-2">
                                    <FiActivity size={14} />
                                    Open Full Patient History
                                </button>
                            </div>
                            <ResultsDisplay results={latestAnalysis} />
                            <div className="mt-8">
                                <DoctorReviewPanel analysis={latestAnalysis} onSaved={handleReviewSaved} />
                            </div>
                        </section>
                    )}

                    <section className="mt-8">
                        <div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Saved Records</p>
                                <h2 className="mt-2 text-2xl font-black text-slate-100">Analysis History</h2>
                            </div>
                            <p className="text-sm text-slate-500">Each analysis, result summary, and suggested treatment is stored in the system for this patient.</p>
                        </div>

                        {!selectedPatientId ? (
                            <div className="card p-10 border-dashed border-white/[0.1] text-center text-slate-500 text-sm font-medium">
                                Select a patient to load saved analysis history.
                            </div>
                        ) : historyLoading ? (
                            <div className="card p-10 flex items-center justify-center">
                                <div className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                            </div>
                        ) : analysisHistory.length === 0 ? (
                            <div className="card p-10 border-dashed border-white/[0.1] text-center text-slate-500 text-sm font-medium">
                                No saved analyses yet for this patient.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {analysisHistory.map(analysis => (
                                    <AnalysisCard key={analysis._id} analysis={analysis} isDoctorView />
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default NewAnalysisDoctor;
