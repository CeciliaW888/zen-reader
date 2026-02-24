import { create } from 'zustand';
import { Book } from '../types';
import { saveBook } from '../services/db';

interface BookState {
  book: Book | null;
  currentChapterId: string;
  setBook: (book: Book | null) => void;
  setCurrentChapterId: (chapterId: string) => void;
  updateBook: (book: Book) => Promise<void>;
  clearBook: () => void;
}

export const useBookStore = create<BookState>((set) => ({
  book: null,
  currentChapterId: '',

  setBook: (book) => {
    set({ book });
    if (book && book.chapters.length > 0) {
      set({ currentChapterId: book.chapters[0].id });
    }
  },

  setCurrentChapterId: (chapterId) => {
    set({ currentChapterId: chapterId });
  },

  updateBook: async (updatedBook) => {
    await saveBook(updatedBook);
    set({ book: updatedBook });
  },

  clearBook: () => {
    set({ book: null, currentChapterId: '' });
  },
}));

// Selectors for performance optimization
export const useCurrentChapter = () =>
  useBookStore((state) =>
    state.book?.chapters.find((c) => c.id === state.currentChapterId)
  );
