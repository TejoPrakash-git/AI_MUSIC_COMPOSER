import type { Pattern, NoteName, KeyType } from '../types';

const scales = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10]
};

const noteToMidi = (note: string): number => {
  const noteName = note.slice(0, -1);
  const octave = parseInt(note.slice(-1));
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  return noteNames.indexOf(noteName) + (octave + 1) * 12;
};

const midiToNote = (midi: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const noteName = noteNames[midi % 12];
  return `${noteName}${octave}`;
};

const transposeNote = (note: string, semitones: number): string => {
  const midi = noteToMidi(note);
  return midiToNote(midi + semitones);
};

export const getScaleNotes = (root: NoteName, type: KeyType, octave: number = 4): string[] => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const rootIndex = noteNames.indexOf(root);
  return scales[type].map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    const octaveOffset = Math.floor((rootIndex + interval) / 12);
    return `${noteNames[noteIndex]}${octave + octaveOffset}`;
  });
};

export const musicPatterns: Pattern[] = [
  {
    name: 'Peaceful Melody',
    description: 'A gentle, calming sequence perfect for relaxation',
    notes: [
      { pitch: 'C4', duration: '4n', timing: 0 },
      { pitch: 'E4', duration: '4n', timing: 0.5 },
      { pitch: 'G4', duration: '4n', timing: 1 },
      { pitch: 'C5', duration: '2n', timing: 1.5 },
      { pitch: 'B4', duration: '4n', timing: 2.5 },
      { pitch: 'A4', duration: '4n', timing: 3 },
      { pitch: 'G4', duration: '2n', timing: 3.5 }
    ]
  },
  {
    name: 'Upbeat Rhythm',
    description: 'An energetic pattern with a positive vibe',
    notes: [
      { pitch: 'E4', duration: '8n', timing: 0 },
      { pitch: 'G4', duration: '8n', timing: 0.25 },
      { pitch: 'A4', duration: '8n', timing: 0.5 },
      { pitch: 'B4', duration: '8n', timing: 0.75 },
      { pitch: 'C5', duration: '4n', timing: 1 },
      { pitch: 'B4', duration: '8n', timing: 1.5 },
      { pitch: 'A4', duration: '8n', timing: 1.75 },
      { pitch: 'G4', duration: '2n', timing: 2 }
    ]
  },
  {
    name: 'Jazz Progression',
    description: 'A smooth jazz-inspired chord progression',
    notes: [
      { pitch: 'D4', duration: '4n', timing: 0 },
      { pitch: 'F#4', duration: '4n', timing: 0.25 },
      { pitch: 'A4', duration: '4n', timing: 0.5 },
      { pitch: 'C5', duration: '4n', timing: 1 },
      { pitch: 'B4', duration: '4n', timing: 1.5 },
      { pitch: 'G4', duration: '4n', timing: 2 },
      { pitch: 'E4', duration: '2n', timing: 2.5 }
    ]
  }
];

const generateRandomNote = (scaleNotes: string[], duration: string, timing: number) => ({
  pitch: scaleNotes[Math.floor(Math.random() * scaleNotes.length)],
  duration,
  timing
});

export const generateAIPattern = async (prompt: string): Promise<Pattern> => {
  const durations = ['8n', '4n', '2n'];
  const numNotes = 8 + Math.floor(Math.random() * 8); // 8-16 notes
  const keyType: KeyType = Math.random() > 0.5 ? 'major' : 'minor';
  const rootNote: NoteName = ['C', 'D', 'E', 'F', 'G', 'A', 'B'][Math.floor(Math.random() * 7)] as NoteName;
  const scaleNotes = getScaleNotes(rootNote, keyType);
  
  const notes = Array.from({ length: numNotes }, (_, i) => {
    const timing = i * (0.25 + Math.random() * 0.5); // Varied timing
    const duration = durations[Math.floor(Math.random() * durations.length)];
    return generateRandomNote(scaleNotes, duration, timing);
  });

  return {
    name: `AI Generated: ${prompt}`,
    description: `AI-generated ${keyType} melody in ${rootNote} based on prompt: "${prompt}"`,
    notes
  };
};

export const transposePattern = (pattern: Pattern, root: NoteName, type: KeyType): Pattern => {
  const currentRoot = pattern.notes[0].pitch[0] as NoteName;
  const currentType = pattern.description.includes('minor') ? 'minor' : 'major';
  
  const oldScale = getScaleNotes(currentRoot, currentType);
  const newScale = getScaleNotes(root, type);
  
  const transposedNotes = pattern.notes.map(note => {
    const oldIndex = oldScale.findIndex(n => n.startsWith(note.pitch.slice(0, -1)));
    const newPitch = oldIndex !== -1 ? newScale[oldIndex] : note.pitch;
    return { ...note, pitch: newPitch };
  });

  return {
    ...pattern,
    notes: transposedNotes,
    description: pattern.description.replace(
      /(major|minor)/,
      type
    ).replace(
      /[A-G]#?\s/,
      `${root} `
    )
  };
};