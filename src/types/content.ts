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
