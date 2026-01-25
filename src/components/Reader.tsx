import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Chapter, ReaderSettings, Book } from '../types';
import { THEME_STYLES, FONT_SIZES } from '../constants';
import { slugify } from '../utils/markdownProcessor';
import { ReaderTopBar } from './reader/ReaderTopBar';
import { AIPanel } from './AIPanel';
import { BookNotesModal } from './BookNotesModal';

interface ReaderProps {
  book: Book;
  currentChapterId: string;
  onChapterSelect: (id: string) => void;
  settings: ReaderSettings;
  onSettingsChange: (settings: ReaderSettings) => void;
  onBack: () => void;
  onToggleTOC: () => void;
}

export const Reader: React.FC<ReaderProps> = ({
  book,
  currentChapterId,
  onChapterSelect,
  settings,
  onSettingsChange,
  onBack,
  onToggleTOC
}) => {
  const topRef = useRef<HTMLDivElement>(null);
  const theme = THEME_STYLES[settings.theme];
  // Cast number to key of FONT_SIZES if necessary, though indexing works
  const fontSizeClass = FONT_SIZES[settings.fontSize];

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Computed properties
  const currentChapter = book.chapters.find(c => c.id === currentChapterId);
  const currentChapterIndex = book.chapters.findIndex(c => c.id === currentChapterId);
  const hasPrev = currentChapterIndex > 0;
  const hasNext = currentChapterIndex > -1 && currentChapterIndex < book.chapters.length - 1;

  // Scroll to top when chapter changes
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
    setSearchQuery(''); // Reset search on chapter change
  }, [currentChapterId]);

  // Handle navigation
  const handleNext = () => {
    if (hasNext) onChapterSelect(book.chapters[currentChapterIndex + 1].id);
  };

  const handlePrev = () => {
    if (hasPrev) onChapterSelect(book.chapters[currentChapterIndex - 1].id);
  };

  // Helper to highlight text
  const HighlightText = ({ text }: { text: string }) => {
    if (!searchQuery.trim()) return <>{text}</>;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === searchQuery.toLowerCase() ?
            <mark key={i} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5">{part}</mark> :
            part
        )}
      </>
    );
  };

  // Custom components to inject IDs for scrolling and highlight text
  const markdownComponents = {
    h1: ({ children }: any) => {
      const id = typeof children === 'string' ? slugify(children) : undefined;
      return <h1 id={id} className="scroll-mt-24">{typeof children === 'string' ? <HighlightText text={children} /> : children}</h1>;
    },
    h2: ({ children }: any) => {
      const id = typeof children === 'string' ? slugify(children) : undefined;
      return <h2 id={id} className="scroll-mt-24">{typeof children === 'string' ? <HighlightText text={children} /> : children}</h2>;
    },
    h3: ({ children }: any) => {
      const id = typeof children === 'string' ? slugify(children) : undefined;
      return <h3 id={id} className="scroll-mt-24">{typeof children === 'string' ? <HighlightText text={children} /> : children}</h3>;
    },
    p: ({ children }: any) => {
      return (
        <p>
          {React.Children.map(children, child => {
            if (typeof child === 'string') return <HighlightText text={child} />;
            return child;
          })}
        </p>
      );
    },
    li: ({ children }: any) => {
      return (
        <li>
          {React.Children.map(children, child => {
            if (typeof child === 'string') return <HighlightText text={child} />;
            return child;
          })}
        </li>
      );
    }
  };

  if (!currentChapter) return <div>Chapter not found</div>;

  return (
    <div className={`flex flex-col h-full bg-slate-100`}>
      <ReaderTopBar
        bookTitle={book.title}
        onBack={onBack}
        onToggleTOC={onToggleTOC}
        onToggleSearch={() => {
          setShowSearch(!showSearch);
          if (!showSearch) setTimeout(() => document.getElementById('search-input')?.focus(), 100);
        }}
        onToggleNotes={() => setShowNotes(true)}
        onToggleAI={() => setShowAI(!showAI)}
        settings={settings}
        onSettingsChange={onSettingsChange}
        showAI={showAI}
      />

      {/* Search Bar Overlay */}
      {showSearch && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 animate-in slide-in-from-top-2 duration-200 flex items-center gap-2 z-30 shadow-sm relative">
          <div className="flex-1 relative">
            <input
              id="search-input"
              type="text"
              placeholder="Search in this chapter..."
              className="w-full pl-4 pr-10 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg outline-none transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <ChevronLeft size={16} className="rotate-45" /> {/* Using Chevron as X clone roughly or just X */}
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            {searchQuery ? 'Matches highlighted' : 'Type to search'}
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto relative scroll-smooth ${theme.bg} ${showSearch ? '' : 'mt-14'}`}>
        <div ref={topRef} />

        <div className={`max-w-2xl mx-auto px-6 py-12 md:py-20 min-h-screen transition-colors duration-300`}>
          <article className={`
            prose ${theme.prose} 
            ${fontSizeClass} 
            ${settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}
            max-w-none
            prose-headings:font-serif prose-headings:font-bold
            prose-p:leading-relaxed
            prose-img:rounded-xl prose-img:shadow-md
          `}>
            <span className="text-xs uppercase tracking-widest opacity-40 mb-4 block">Chapter {currentChapter.order + 1}</span>
            <h1 className="mb-8">{currentChapter.title}</h1>
            <ReactMarkdown components={markdownComponents}>
              {currentChapter.content}
            </ReactMarkdown>
          </article>

          {/* Chapter Navigation Footer */}
          {(hasPrev || hasNext) && (
            <div className="mt-20 pt-12 border-t border-gray-200/10 flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
              <button
                onClick={handlePrev}
                disabled={!hasPrev}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${!hasPrev ? 'opacity-0 cursor-default' : `${theme.ui} ${theme.uiHover}`
                  }`}
              >
                <ChevronLeft size={20} />
                <span className="font-medium">Previous</span>
              </button>

              <button
                onClick={handleNext}
                disabled={!hasNext}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${!hasNext ? 'opacity-0 cursor-default' : `${theme.ui} ${theme.uiHover}`
                  }`}
              >
                <span className="font-medium">Next</span>
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Panel Overlay/Side */}
      <AIPanel
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        currentChapter={currentChapter}
        book={book}
        settings={settings}
      />

      <BookNotesModal
        isOpen={showNotes}
        onClose={() => setShowNotes(false)}
        book={book}
        onBookUpdate={(updated) => {
          // Ideally propagate this up to App to update state, but for now it's persisted in DB
          // We might need a way to refresh 'book' prop if it's held in App state.
          // But Reader receives book prop.
        }}
      />
    </div>
  );
};