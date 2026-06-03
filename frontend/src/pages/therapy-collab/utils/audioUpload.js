const writeAscii = (view, offset, value) => {
    for (let index = 0; index < value.length; index += 1) {
        view.setUint8(offset + index, value.charCodeAt(index));
    }
};

const interleaveChannels = (audioBuffer) => {
    const channelCount = audioBuffer.numberOfChannels;
    const frameCount = audioBuffer.length;
    const interleaved = new Float32Array(frameCount * channelCount);

    let writeIndex = 0;
    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
        for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
            interleaved[writeIndex] = audioBuffer.getChannelData(channelIndex)[frameIndex];
            writeIndex += 1;
        }
    }

    return interleaved;
};

const audioBufferToWavBlob = (audioBuffer) => {
    const interleaved = interleaveChannels(audioBuffer);
    const bytesPerSample = 2;
    const dataSize = interleaved.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeAscii(view, 8, 'WAVE');
    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, audioBuffer.numberOfChannels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * audioBuffer.numberOfChannels * bytesPerSample, true);
    view.setUint16(32, audioBuffer.numberOfChannels * bytesPerSample, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeAscii(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let sampleIndex = 0; sampleIndex < interleaved.length; sampleIndex += 1) {
        const sample = Math.max(-1, Math.min(1, interleaved[sampleIndex]));
        view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
        offset += bytesPerSample;
    }

    return new Blob([buffer], { type: 'audio/wav' });
};

const getSafeBaseName = (value, fallbackName) => {
    const trimmed = String(value || '').trim();
    const withoutExtension = trimmed.replace(/\.[^.]+$/, '');
    return withoutExtension || fallbackName;
};

const getFallbackExtension = (mimeType) => {
    if (!mimeType) return '.webm';
    if (mimeType.includes('mpeg')) return '.mp3';
    if (mimeType.includes('mp4')) return '.mp4';
    if (mimeType.includes('aac')) return '.aac';
    if (mimeType.includes('ogg')) return '.ogg';
    if (mimeType.includes('wav')) return '.wav';
    return '.webm';
};

export const prepareAudioUpload = async (audioBlob, fallbackName = 'recording') => {
    if (!audioBlob) {
        throw new Error('No audio file was provided.');
    }

    const normalizedType = String(audioBlob.type || '').toLowerCase();
    const baseName = getSafeBaseName(audioBlob.name, fallbackName);
    const isWav = normalizedType === 'audio/wav' || normalizedType === 'audio/wave' || normalizedType === 'audio/x-wav';

    if (isWav) {
        return audioBlob instanceof File
            ? audioBlob
            : new File([audioBlob], `${baseName}.wav`, { type: 'audio/wav' });
    }

    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextCtor) {
        const extension = getFallbackExtension(normalizedType);
        return audioBlob instanceof File
            ? audioBlob
            : new File([audioBlob], `${baseName}${extension}`, { type: audioBlob.type || 'audio/webm' });
    }

    const audioContext = new AudioContextCtor();
    try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const decodedAudio = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        const wavBlob = audioBufferToWavBlob(decodedAudio);
        return new File([wavBlob], `${baseName}.wav`, { type: 'audio/wav' });
    } catch (error) {
        console.error('Audio conversion failed, uploading original file instead.', error);
        const extension = getFallbackExtension(normalizedType);
        return audioBlob instanceof File
            ? audioBlob
            : new File([audioBlob], `${baseName}${extension}`, { type: audioBlob.type || 'audio/webm' });
    } finally {
        await audioContext.close();
    }
};
