export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface Book {
  id: string; // Added for persistence
  title: string;
  chapters: Chapter[];
  fileName: string;
  dateAdded: number; // Added for sorting
  source?: 'upload' | 'youtube' | 'text';
}

export type Theme = 'light' | 'sepia' | 'dark' | 'forest' | 'midnight';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';

export interface ReaderSettings {
  theme: Theme;
  fontSize: FontSize;
  fontFamily: 'serif' | 'sans';
}

export interface AIResponse {
  type: 'summary' | 'analysis' | 'chat';
  content: string;
}
