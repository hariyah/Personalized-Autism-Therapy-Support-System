import React, { useState, useRef } from 'react';

function AudioRecorder({ onSubmit, isLoading }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access denied. Please check permissions.');
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setRecordedBlob(file);
    }
  };

  const handleSubmit = () => {
    if (recordedBlob) {
      onSubmit(recordedBlob);
      setRecordedBlob(null);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 md:p-12 text-center bg-white/50">
      <div className="space-y-6">

        {/* Header */}
        <div>
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl mx-auto flex items-center justify-center mb-4 text-3xl">
            🎙️
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Voice Input</h2>
          <p className="text-slate-500 mt-1">Record a session or upload an audio file for analysis</p>
        </div>

        {/* Controls Container */}
        <div className="max-w-md mx-auto mt-8">
          {!recordedBlob ? (
            <div className="space-y-6 animate-fade-in">
              {!isRecording ? (
                <>
                  <button
                    onClick={startRecording}
                    disabled={isLoading}
                    className="group relative w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-indigo-200 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50/50 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                  >
                    <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform duration-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <span className="mt-4 text-lg font-semibold text-slate-700 group-hover:text-indigo-700">Tap to Record</span>
                    <span className="text-sm text-slate-400 mt-1">We recommend using a clear environment</span>
                  </button>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium uppercase tracking-wider">Or</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <label className="block w-full cursor-pointer">
                    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-center space-x-3 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span className="text-slate-600 font-medium">Upload Audio File</span>
                    </div>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                      className="hidden"
                    />
                  </label>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-3xl border border-red-100 animate-fade-in">
                  <div className="relative">
                    <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center z-10 relative shadow-xl shadow-red-200">
                      <div className="w-3 h-3 bg-white rounded-sm animate-pulse"></div>
                      <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <div className="text-3xl font-mono font-bold text-slate-800 mb-2">{formatTime(recordingTime)}</div>
                    <p className="text-red-600 animate-pulse font-medium">Recording in progress...</p>
                  </div>

                  <button
                    onClick={stopRecording}
                    className="mt-8 px-8 py-3 bg-white text-red-600 font-bold rounded-xl border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all shadow-sm flex items-center space-x-2"
                  >
                    <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
                    <span>Stop Recording</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 animate-fade-in-up">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold text-slate-800">Audio Captured</h3>
                  <p className="text-xs text-slate-500">{recordedBlob.size ? `${(recordedBlob.size / 1024).toFixed(1)} KB` : 'Ready to submit'}</p>
                </div>
                <button
                  onClick={() => {
                    setRecordedBlob(null);
                    setRecordingTime(0);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
                  title="Clear"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <span>Analyze Audio Now</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AudioRecorder;
