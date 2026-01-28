import React, { useState, useMemo, useEffect } from 'react';
import { LibraryUpload } from './components/LibraryUpload';
import { Reader } from './components/Reader';
import { Sidebar } from './components/Sidebar';
import { Book, ReaderSettings } from './types';
import { DEFAULT_SETTINGS, THEME_STYLES } from './constants';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [book, setBook] = useState<Book | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [settings, setSettings] = useState<ReaderSettings>(() => {
    const saved = localStorage.getItem('zenreader-settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('zenreader-settings', JSON.stringify(settings));
  }, [settings]);
  const [initialLibraryTab, setInitialLibraryTab] = useState<'import' | 'library'>('import');

  const currentChapter = useMemo(() =>
    book?.chapters.find(c => c.id === currentChapterId),
    [book, currentChapterId]);

  const handleBookLoaded = (newBook: Book) => {
    setBook(newBook);
    if (newBook.chapters.length > 0) {
      setCurrentChapterId(newBook.chapters[0].id);
    }
  };



  const handleBackToLibrary = () => {
    setInitialLibraryTab('library');
    setBook(null);
    setSidebarOpen(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!book) {
    return <LibraryUpload onBookLoaded={handleBookLoaded} initialTab={initialLibraryTab} />;
  }

  const theme = THEME_STYLES[settings.theme];

  return (
    <div className={`h-full flex flex-col ${theme.bg} ${theme.text} transition-colors duration-300`}>
      {/* Top Mobile Bar */}


      <div className="flex-1 flex overflow-hidden relative">


        <Sidebar
          book={book}
          currentChapterId={currentChapterId}
          onChapterSelect={setCurrentChapterId}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          settings={settings}
        />

        {currentChapter && (
          <main className="flex-1 relative flex">
            <ErrorBoundary>
              <Reader
                book={book}
                currentChapterId={currentChapterId}
                onChapterSelect={setCurrentChapterId}
                settings={settings}
                onSettingsChange={setSettings}
                onBack={handleBackToLibrary}
                onToggleTOC={() => setSidebarOpen(true)}
                onBookUpdate={setBook}
              />
            </ErrorBoundary>
          </main>
        )}
      </div>
      <div className="absolute bottom-2 right-2 text-[10px] opacity-20 pointer-events-none z-50">
        v0.1.2-api-fix
      </div>
    </div>
  );
}
