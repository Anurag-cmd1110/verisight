
import { FrameData } from '../types';

export const extractFrames = (videoFile: File, sampleRate: number = 3): Promise<FrameData[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const frames: FrameData[] = [];
    
    video.src = URL.createObjectURL(videoFile);
    video.preload = 'auto';

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const duration = video.duration;
      let currentTime = 0;

      const captureFrame = () => {
        if (currentTime >= duration || frames.length >= 8) { // Limit to 8 frames to stay within token limits/latency
          resolve(frames);
          return;
        }

        video.currentTime = currentTime;
      };

      video.onseeked = () => {
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
          frames.push({ base64, timestamp: currentTime });
          currentTime += Math.max(0.5, duration / sampleRate);
          captureFrame();
        }
      };

      captureFrame();
    };

    video.onerror = (err) => reject(err);
  });
};
