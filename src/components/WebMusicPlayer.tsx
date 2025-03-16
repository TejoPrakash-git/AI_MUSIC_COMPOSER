import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Download } from 'lucide-react';
import type { WebTrack } from '../types';

interface WebMusicPlayerProps {
  track: WebTrack;
}

const WebMusicPlayer: React.FC<WebMusicPlayerProps> = ({ track }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    try {
      // Create an anchor element
      const a = document.createElement('a');
      a.href = track.url;
      a.download = `${track.title}-${track.artist}.mp3`;
      
      // Some URLs might need to be opened in a new tab if direct download fails
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      
      // Trigger the download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download track:', error);
      // Open in new tab as fallback
      window.open(track.url, '_blank', 'noopener,noreferrer');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
      <button
        onClick={togglePlay}
        className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>
      
      <div className="flex-1">
        <div className="font-medium">{track.title}</div>
        <div className="text-sm text-gray-600">{track.artist}</div>
      </div>

      <div className="text-sm text-gray-500">{track.duration}</div>

      <button
        onClick={toggleMute}
        className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors ${
          isDownloading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <Download size={20} />
      </button>

      <audio
        ref={audioRef}
        src={track.url}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  );
};

export default WebMusicPlayer;