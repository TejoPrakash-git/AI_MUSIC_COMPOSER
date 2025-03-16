import React, { useState, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import { Music, Wand2, Search } from 'lucide-react';
import type { Composition, InstrumentType, ShareableData, WebTrack, NoteName, KeyType } from './types';
import MusicPlayer from './components/MusicPlayer';
import WebMusicPlayer from './components/WebMusicPlayer';
import { musicPatterns, generateAIPattern, transposePattern } from './utils/patterns';
import { searchTracks } from './utils/webMusic';

function App() {
  const [selectedPattern, setSelectedPattern] = useState('');
  const [composition, setComposition] = useState<Composition | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentType>('synth');
  const [synth, setSynth] = useState<any>(null);
  const [recorder, setRecorder] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WebTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedKey, setSelectedKey] = useState<NoteName>('C');
  const [selectedKeyType, setSelectedKeyType] = useState<KeyType>('major');

  useEffect(() => {
    // Parse URL parameters for shared compositions
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('share');
    if (sharedData) {
      try {
        const { patternName, instrument: sharedInstrument } = JSON.parse(atob(sharedData)) as ShareableData;
        setSelectedPattern(patternName);
        setInstrument(sharedInstrument as InstrumentType);
      } catch (error) {
        console.error('Failed to parse shared data:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Initialize the synthesizer and recorder
    const initAudio = async () => {
      await Tone.start();
      const newSynth = new Tone.PolySynth().toDestination();
      setSynth(newSynth);

      const dest = Tone.getDestination();
      const newRecorder = new Tone.Recorder();
      dest.connect(newRecorder);
      setRecorder(newRecorder);
    };
    initAudio();

    return () => {
      if (synth) {
        synth.dispose();
      }
      if (recorder) {
        recorder.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!synth) return;

    // Update synth settings based on selected instrument
    switch (instrument) {
      case 'piano':
        synth.set({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
        });
        break;
      case 'strings':
        synth.set({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 2 }
        });
        break;
      case 'bass':
        synth.set({
          oscillator: { type: 'square' },
          envelope: { attack: 0.05, decay: 0.2, sustain: 0.4, release: 0.8 }
        });
        break;
      case 'marimba':
        synth.set({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.1 }
        });
        break;
      default:
        synth.set({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.05, decay: 0.2, sustain: 0.2, release: 0.5 }
        });
    }
  }, [instrument, synth]);

  const generateMusic = async () => {
    if (!selectedPattern) return;
    
    let pattern;
    if (selectedPattern === 'ai-generated') {
      if (!aiPrompt) return;
      setIsGenerating(true);
      try {
        pattern = await generateAIPattern(aiPrompt);
      } catch (error) {
        console.error('Failed to generate AI pattern:', error);
        return;
      } finally {
        setIsGenerating(false);
      }
    } else {
      pattern = musicPatterns.find(p => p.name === selectedPattern);
    }
    
    if (!pattern) return;

    // Transpose pattern to selected key and type
    const transposedPattern = transposePattern(pattern, selectedKey, selectedKeyType);

    const newComposition: Composition = {
      notes: transposedPattern.notes,
      tempo: 120,
      key: `${selectedKey} ${selectedKeyType}`,
      instrument
    };
    
    setComposition(newComposition);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchTracks(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search tracks:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const playComposition = useCallback(() => {
    if (!composition || !synth) return;

    Tone.Transport.cancel();
    Tone.Transport.stop();
    Tone.Transport.bpm.value = composition.tempo;

    const now = Tone.now();
    composition.notes.forEach(note => {
      synth.triggerAttackRelease(note.pitch, note.duration, now + note.timing);
    });

    setIsPlaying(true);
  }, [composition, synth]);

  const stopPlaying = useCallback(() => {
    Tone.Transport.stop();
    setIsPlaying(false);
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      stopPlaying();
    } else {
      playComposition();
    }
  };

  const handleReset = () => {
    stopPlaying();
    Tone.Transport.position = 0;
  };

  const handleDownload = async () => {
    if (!recorder || !composition) return;

    try {
      setIsRecording(true);
      await recorder.start();
      
      // Play the composition
      const now = Tone.now();
      composition.notes.forEach(note => {
        synth.triggerAttackRelease(note.pitch, note.duration, now + note.timing);
      });

      // Wait for the composition to finish
      const duration = Math.max(...composition.notes.map(n => n.timing)) + 2;
      await new Promise(resolve => setTimeout(resolve, duration * 1000));

      // Stop recording and create download
      const recording = await recorder.stop();
      const url = URL.createObjectURL(recording);
      const anchor = document.createElement('a');
      anchor.download = `${selectedPattern}-${instrument}.webm`;
      anchor.href = url;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to record:', error);
    } finally {
      setIsRecording(false);
    }
  };

  const handleShare = () => {
    if (!selectedPattern) return;

    const shareData: ShareableData = {
      patternName: selectedPattern,
      instrument
    };

    const encoded = btoa(JSON.stringify(shareData));
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encoded}`;

    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy share link. Please try again.');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-4xl font-bold text-indigo-900 mb-2">
            <Music size={40} />
            <h1>Music Generator</h1>
          </div>
          <p className="text-gray-600">Create beautiful melodies with different instruments</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          {/* Web Music Search */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Search Web Music</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for music..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Search size={20} />
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map(track => (
                  <WebMusicPlayer key={track.id} track={track} />
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 my-6"></div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Generate Music</h2>
            
            {/* Key Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key
                </label>
                <select
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value as NoteName)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(note => (
                    <option key={note} value={note}>{note}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scale Type
                </label>
                <select
                  value={selectedKeyType}
                  onChange={(e) => setSelectedKeyType(e.target.value as KeyType)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="pattern" className="block text-sm font-medium text-gray-700 mb-2">
                Select a Pattern
              </label>
              <select
                id="pattern"
                value={selectedPattern}
                onChange={(e) => setSelectedPattern(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Choose a pattern...</option>
                {musicPatterns.map(pattern => (
                  <option key={pattern.name} value={pattern.name}>
                    {pattern.name}
                  </option>
                ))}
                <option value="ai-generated">AI Generated Pattern</option>
              </select>
            </div>

            {selectedPattern === 'ai-generated' && (
              <div>
                <label htmlFor="ai-prompt" className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your melody
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="ai-prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., happy upbeat melody"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={generateMusic}
                    disabled={!aiPrompt || isGenerating}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Wand2 size={20} />
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="instrument" className="block text-sm font-medium text-gray-700 mb-2">
                Choose Instrument
              </label>
              <select
                id="instrument"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value as InstrumentType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="synth">Synth</option>
                <option value="piano">Piano</option>
                <option value="strings">Strings</option>
                <option value="bass">Bass</option>
                <option value="marimba">Marimba</option>
              </select>
            </div>
          </div>

          {selectedPattern && selectedPattern !== 'ai-generated' && (
            <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
              <p>{musicPatterns.find(p => p.name === selectedPattern)?.description}</p>
            </div>
          )}

          {selectedPattern !== 'ai-generated' && (
            <button
              onClick={generateMusic}
              disabled={!selectedPattern}
              className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Generate Music
            </button>
          )}
        </div>

        {composition && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <MusicPlayer
              composition={composition}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onReset={handleReset}
              onDownload={handleDownload}
              onShare={handleShare}
              isRecording={isRecording}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;