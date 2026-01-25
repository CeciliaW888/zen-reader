import React, { useState, useMemo } from 'react';
import { LibraryUpload } from './components/LibraryUpload';
import { Reader } from './components/Reader';
import { Sidebar } from './components/Sidebar';
import { Book, ReaderSettings } from './types';
import { DEFAULT_SETTINGS, THEME_STYLES } from './constants';

export default function App() {
  const [book, setBook] = useState<Book | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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



  const handleBackToLibrary = () => {
    setInitialLibraryTab('library');
    setBook(null);
    setSidebarOpen(false);
  };

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
            <Reader
              book={book}
              currentChapterId={currentChapterId}
              onChapterSelect={setCurrentChapterId}
              settings={settings}
              onSettingsChange={setSettings}
              onBack={handleBackToLibrary}
              onToggleTOC={() => setSidebarOpen(true)}
            />
          </main>
        )}
      </div>
    </div>
  );
}
