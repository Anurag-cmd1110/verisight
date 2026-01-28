export const extractAudio = async (videoFile: File): Promise<string | null> => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass({ sampleRate: 16000 });

    const arrayBuffer = await videoFile.arrayBuffer();
    
    // SAFETY CHECK: Try to decode, but handle failures gracefully
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Extract first 30s
      const duration = Math.min(30, audioBuffer.duration);
      const offlineContext = new OfflineAudioContext(1, 16000 * duration, 16000);
      const source = offlineContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(offlineContext.destination);
      source.start();
      
      const renderedBuffer = await offlineContext.startRendering();
      return bufferToWavBase64(renderedBuffer);
      
    } catch (decodeError) {
      console.warn("Audio track missing or corrupt. Proceeding with visual-only analysis.");
      return null; // Return null safely
    }

  } catch (error) {
    console.warn("Audio extraction system error:", error);
    return null;
  }
};

const bufferToWavBase64 = (buffer: AudioBuffer): string => {
  const length = buffer.length * 2;
  const view = new DataView(new ArrayBuffer(44 + length));
  const channels = buffer.getChannelData(0);
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); 
  view.setUint16(22, 1, true); 
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true); 
  view.setUint16(32, 2, true); 
  view.setUint16(34, 16, true); 
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    const s = Math.max(-1, Math.min(1, channels[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  const bytes = new Uint8Array(view.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};