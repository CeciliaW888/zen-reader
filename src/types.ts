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
  language?: string;
  notes?: string;
}

export type Theme = 'light' | 'sepia' | 'dark' | 'forest' | 'midnight';
export type FontSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8; // 1 (Smallest) to 8 (Largest)

export interface ReaderSettings {
  theme: Theme;
  fontSize: FontSize;
  fontFamily: 'serif' | 'sans';
}

export interface AIResponse {
  type: 'summary' | 'analysis' | 'chat';
  content: string;
}
