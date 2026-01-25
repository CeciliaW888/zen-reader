import React, { useState, useMemo } from 'react';
import { Menu } from 'lucide-react';
import { LibraryUpload } from './components/LibraryUpload';
import { Reader } from './components/Reader';
import { Sidebar } from './components/Sidebar';
import { AIPanel } from './components/AIPanel';
import { Book, ReaderSettings } from './types';
import { DEFAULT_SETTINGS, THEME_STYLES } from './constants';

export default function App() {
  const [book, setBook] = useState<Book | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);
  const [initialLibraryTab, setInitialLibraryTab] = useState<'import' | 'library'>('import');

  const currentChapter = useMemo(() =>
    book?.chapters.find(c => c.id === currentChapterId),
    [book, currentChapterId]);

  const currentChapterIndex = useMemo(() =>
    book?.chapters.findIndex(c => c.id === currentChapterId) ?? -1,
    [book, currentChapterId]);

  const handleBookLoaded = (newBook: Book) => {
    setBook(newBook);
    if (newBook.chapters.length > 0) {
      setCurrentChapterId(newBook.chapters[0].id);
    }
  };

  const handleNextChapter = () => {
    if (!book) return;
    const nextIndex = currentChapterIndex + 1;
    if (nextIndex < book.chapters.length) {
      setCurrentChapterId(book.chapters[nextIndex].id);
    }
  };

  const handlePrevChapter = () => {
    if (!book) return;
    const prevIndex = currentChapterIndex - 1;
    if (prevIndex >= 0) {
      setCurrentChapterId(book.chapters[prevIndex].id);
    }
  };

  const handleBackToLibrary = () => {
    setInitialLibraryTab('library');
    setBook(null);
    setSidebarOpen(false);
    setAiPanelOpen(false);
  };

  if (!book) {
    return <LibraryUpload onBookLoaded={handleBookLoaded} initialTab={initialLibraryTab} />;
  }

  const theme = THEME_STYLES[settings.theme];

  return (
    <div className={`h-full flex flex-col ${theme.bg} ${theme.text} transition-colors duration-300`}>
      {/* Top Mobile Bar */}
      <div className={`lg:hidden flex items-center p-4 border-b border-gray-200/10 sticky top-0 z-30 backdrop-blur-md ${theme.bg}/90`}>
        <button
          onClick={() => setSidebarOpen(true)}
          className={`p-2 rounded-md ${theme.uiHover}`}
        >
          <Menu size={24} />
        </button>
        <span className="ml-4 font-serif font-bold truncate">{book.title}</span>
        <div className="flex-1" />
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Toggle Button for Desktop Sidebar */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className={`
              hidden lg:flex absolute left-6 top-6 z-20 p-3 rounded-full shadow-lg transition-all hover:scale-105
              ${theme.ui}
            `}
          >
            <Menu size={20} />
          </button>
        )}

        <Sidebar
          book={book}
          currentChapterId={currentChapterId}
          onChapterSelect={setCurrentChapterId}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          settings={settings}
          onSettingsChange={setSettings}
          onToggleAI={() => setAiPanelOpen(!aiPanelOpen)}
          aiPanelOpen={aiPanelOpen}
          onBackToLibrary={handleBackToLibrary}
        />

        {currentChapter && (
          <main className="flex-1 relative flex">
            <Reader
              chapter={currentChapter}
              settings={settings}
              onNextChapter={handleNextChapter}
              onPrevChapter={handlePrevChapter}
              hasNext={currentChapterIndex < book.chapters.length - 1}
              hasPrev={currentChapterIndex > 0}
            />

            <AIPanel
              isOpen={aiPanelOpen}
              onClose={() => setAiPanelOpen(false)}
              currentChapter={currentChapter}
              book={book}
              settings={settings}
            />
          </main>
        )}
      </div>
    </div>
  );
}
