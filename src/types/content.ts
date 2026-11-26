// Shapes of content shared by the public pages, the projector console and site search.

/** A hymn from the built-in hymnal or a custom song from the worship_songs table. */
export interface Song {
  id: string;
  title: string;
  songNumber?: string;
  category?: string;
  keySignature?: string;
  author?: string;
  lyrics?: string;
  youtubeUrl?: string;
}

/** An item handed to the EasyWorship console ("Tampilkan di EasyWorship"). */
export interface ProjectorItem {
  type: 'song' | 'bible' | 'custom' | string;
  title: string;
  text?: string;
  lyrics?: string;
  keySignature?: string;
}

export type SendToProjector = (item: ProjectorItem) => void;

/** A field of a registration form (stored in forms.fields). */
export interface FormField {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  isUnique?: boolean;
  isSearchIndex?: boolean;
  placeholder?: string;
  accept?: string;
  options?: string[];
  /** Options as typed in the form editor (one per line), before they are split into `options`. */
  rawOptions?: string;
  /** Options filled from data instead of `options`. */
  source?: 'divisions' | 'events' | string;
}

/** File attached to a submission; dataUrl is the storage URL once uploaded. */
export type SubmittedFile = {
  name: string;
  size: string;
  type: string;
  dataUrl: string;
};
