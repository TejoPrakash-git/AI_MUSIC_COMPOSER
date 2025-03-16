export interface Note {
  pitch: string;
  duration: string;
  timing: number;
}

export interface Composition {
  notes: Note[];
  tempo: number;
  key: string;
  instrument: string;
}

export type InstrumentType = 'synth' | 'piano' | 'bass' | 'strings' | 'marimba';

export interface Pattern {
  name: string;
  notes: Note[];
  description: string;
}

export interface ShareableData {
  patternName: string;
  instrument: InstrumentType;
}

export interface WebTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: string;
}

export type KeyType = 'major' | 'minor';
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';