import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, ChevronRight, FilePenLine, X } from 'lucide-react';
import { ReaderSettings, Book, Highlight } from '../types';
import { THEME_STYLES, FONT_SIZES } from '../constants';
import { slugify } from '../utils/markdownProcessor';
import { ReaderTopBar } from './reader/ReaderTopBar';
import { AIPanel } from './ai/AIPanel';
import { BookNotesModal } from './BookNotesModal';
import { ErrorBoundary } from './common/ErrorBoundary';
import { saveBook } from '../services/db';
import { useSwipe, useKeyboardNavigation } from '../hooks/useSwipe';

interface ReaderProps {
  book: Book;
  currentChapterId: string;
  onChapterSelect: (id: string) => void;
  settings: ReaderSettings;
  onSettingsChange: (settings: ReaderSettings) => void;
  onBack: () => void;
  onToggleTOC: () => void;
  onBookUpdate?: (book: Book) => void;
}

export const Reader: React.FC<ReaderProps> = ({
  book,
  currentChapterId,
  onChapterSelect,
  settings,
  onSettingsChange,
  onBack,
  onToggleTOC,
  onBookUpdate
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const theme = THEME_STYLES[settings.theme];
  const fontSizeClass = FONT_SIZES[settings.fontSize];

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Page state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Container dimensions in exact pixels
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Highlight State
  const [selectedText, setSelectedText] = useState<{ text: string; top: number; left: number } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  // Computed properties
  const currentChapter = book.chapters.find(c => c.id === currentChapterId);
  const currentChapterIndex = book.chapters.findIndex(c => c.id === currentChapterId);
  const hasPrev = currentChapterIndex > 0;
  const hasNext = currentChapterIndex > -1 && currentChapterIndex < book.chapters.length - 1;

  // Reset page when chapter changes
  useEffect(() => {
    setCurrentPage(0);
    setSearchQuery('');
    setSelectedText(null);
  }, [currentChapterId]);

  // Step 1: Measure the outer container in exact pixels
  useEffect(() => {
    if (!outerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.floor(entry.contentRect.width);
      const h = Math.floor(entry.contentRect.height);
      setDims(prev => {
        if (prev.w !== w || prev.h !== h) return { w, h };
        return prev;
      });
    });
    observer.observe(outerRef.current);
    return () => observer.disconnect();
  }, []);

  // Step 2: After content renders with CSS columns, measure scrollWidth to get page count
  useEffect(() => {
    if (!contentRef.current || dims.w === 0 || dims.h === 0) return;

    const calculate = () => {
      if (!contentRef.current || dims.w === 0) return;
      const sw = contentRef.current.scrollWidth;
      const pages = Math.max(1, Math.round(sw / dims.w));
      setTotalPages(pages);
      setCurrentPage(prev => Math.min(prev, pages - 1));
    };

    // Run multiple times to handle font/image loading
    calculate();
    const t1 = setTimeout(calculate, 100);
    const t2 = setTimeout(calculate, 300);
    const t3 = setTimeout(calculate, 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [dims.w, dims.h, currentChapter?.content, settings.fontSize, settings.fontFamily]);

  // Page navigation
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(p => p + 1);
    } else if (hasNext) {
      onChapterSelect(book.chapters[currentChapterIndex + 1].id);
    }
  }, [currentPage, totalPages, hasNext, book.chapters, currentChapterIndex, onChapterSelect]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(p => p - 1);
    } else if (hasPrev) {
      onChapterSelect(book.chapters[currentChapterIndex - 1].id);
    }
  }, [currentPage, hasPrev, book.chapters, currentChapterIndex, onChapterSelect]);

  const canGoPrev = currentPage > 0 || hasPrev;
  const canGoNext = currentPage < totalPages - 1 || hasNext;

  // Swipe gestures
  const swipeCallbacks = useMemo(() => ({
    onSwipeLeft: goToNextPage,
    onSwipeRight: goToPrevPage
  }), [goToNextPage, goToPrevPage]);

  useSwipe(outerRef, swipeCallbacks, {
    threshold: 40,
    edgeZone: 0.15,
    enabled: !showAI
  });

  // Keyboard navigation
  useKeyboardNavigation(
    { onPrev: goToPrevPage, onNext: goToNextPage },
    !showAI && !showSearch
  );

  // Handle text selection
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectedText(null);
        return;
      }
      const text = selection.toString().trim();
      if (text.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectedText({ text, top: rect.top, left: rect.left + (rect.width / 2) });
      }
    };
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  // Add highlight
  const handleAddHighlight = async () => {
    if (!selectedText) return;
    const newHighlight: Highlight = {
      id: crypto.randomUUID(),
      chapterId: currentChapterId,
      text: selectedText.text,
      note: '',
      color: 'yellow',
      created: Date.now()
    };
    const updatedBook = { ...book, highlights: [...(book.highlights || []), newHighlight] };
    await saveBook(updatedBook);
    if (onBookUpdate) onBookUpdate(updatedBook);
    setSelectedText(null);
    setActiveHighlightId(newHighlight.id);
    window.getSelection()?.removeAllRanges();
  };

  // Highlight renderer
  const HighlightText = ({ text }: { text: string }) => {
    const chapterHighlights = (book.highlights || []).filter(h => h.chapterId === currentChapterId);
    if (!searchQuery.trim() && chapterHighlights.length === 0) return <>{text}</>;

    interface Match { start: number; end: number; type: 'search' | 'note'; data?: Highlight & { index: number }; priority: number; }
    const matches: Match[] = [];

    if (searchQuery.trim()) {
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'gi');
      let m; while ((m = regex.exec(text)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length, type: 'search', priority: 1 });
      }
    }
    chapterHighlights.forEach((h, idx) => {
      if (!h.text.trim()) return;
      const words = h.text.replace(/\s+/g, ' ').trim().split(' ').map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const regex = new RegExp(words.join('[\\s\\n]+'), 'gi');
      let m; while ((m = regex.exec(text)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length, type: 'note', data: { ...h, index: idx + 1 }, priority: 2 });
      }
    });

    matches.sort((a, b) => a.start - b.start);
    const els: React.ReactNode[] = [];
    let last = 0;
    for (const m of matches) {
      if (m.start < last) continue;
      if (m.start > last) els.push(text.slice(last, m.start));
      if (m.type === 'search') {
        els.push(<mark key={`s-${m.start}`} className="bg-orange-300 text-slate-900 rounded-sm px-0.5">{text.slice(m.start, m.end)}</mark>);
      } else {
        const h = m.data!;
        els.push(
          <span key={`n-${h.id}-${m.start}`} className="bg-yellow-200 cursor-pointer border-b-2 border-yellow-400"
            onClick={(e) => { e.stopPropagation(); setActiveHighlightId(h.id); }}>
            {text.slice(m.start, m.end)}
            <sup className="text-[10px] font-bold text-yellow-800 ml-0.5 select-none">[{h.index}]</sup>
          </span>
        );
      }
      last = m.end;
    }
    if (last < text.length) els.push(text.slice(last));
    return <>{els}</>;
  };

  const markdownComponents = {
    h1: ({ children }: { children?: React.ReactNode }) => {
      const id = typeof children === 'string' ? slugify(children) : undefined;
      return <h1 id={id}>{typeof children === 'string' ? <HighlightText text={children} /> : children}</h1>;
    },
    h2: ({ children }: { children?: React.ReactNode }) => {
      const id = typeof children === 'string' ? slugify(children) : undefined;
      return <h2 id={id}>{typeof children === 'string' ? <HighlightText text={children} /> : children}</h2>;
    },
    h3: ({ children }: { children?: React.ReactNode }) => {
      const id = typeof children === 'string' ? slugify(children) : undefined;
      return <h3 id={id}>{typeof children === 'string' ? <HighlightText text={children} /> : children}</h3>;
    },
    p: ({ children }: { children?: React.ReactNode }) => (
      <p>{React.Children.map(children, c => typeof c === 'string' ? <HighlightText text={c} /> : c)}</p>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
      <li>{React.Children.map(children, c => typeof c === 'string' ? <HighlightText text={c} /> : c)}</li>
    )
  };

  if (!currentChapter) return <div>Chapter not found</div>;

  // Horizontal padding per side — columnGap trick gives per-page padding
  const padX = 40;
  const padY = 32;

  return (
    <div className={`flex flex-col h-screen ${theme.bg}`}>
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

      {/* Search Bar */}
      {showSearch && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-2 z-30 shadow-sm">
          <div className="flex-1 relative">
            <input id="search-input" type="text" placeholder="Search in this chapter..."
              className="w-full pl-4 pr-10 py-2 bg-gray-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg outline-none transition-all text-sm"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
          <div className="text-xs text-gray-500 font-medium">{searchQuery ? 'Matches highlighted' : 'Type to search'}</div>
        </div>
      )}

      {/* Selection Tooltip */}
      {selectedText && (
        <div className="fixed z-50 bg-slate-800 text-white rounded-lg shadow-xl flex items-center gap-1 p-1"
          style={{ top: Math.max(10, selectedText.top - 50) + 'px', left: Math.max(10, selectedText.left - 50) + 'px' }}>
          <button onClick={handleAddHighlight} className="px-3 py-1.5 hover:bg-slate-700 rounded-md text-xs font-bold flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-200"></span> Highlight
          </button>
          <div className="w-px h-4 bg-slate-600 mx-1"></div>
          <button onClick={() => setSelectedText(null)} className="px-2 py-1.5 hover:bg-slate-700 rounded-md text-xs text-slate-400"><X size={14} /></button>
        </div>
      )}

      {/* Left arrow */}
      <button onClick={goToPrevPage} disabled={!canGoPrev}
        className={`fixed left-1 top-1/2 -translate-y-1/2 z-40 p-2 md:p-3 rounded-full shadow-lg transition-all active:scale-95
          ${canGoPrev ? `${theme.ui} ${theme.uiHover} opacity-60 hover:opacity-100 cursor-pointer` : 'opacity-15 pointer-events-none'}`}
        aria-label="Previous page">
        <ChevronLeft size={20} />
      </button>

      {/* Right arrow */}
      <button onClick={goToNextPage} disabled={!canGoNext}
        className={`fixed right-1 top-1/2 -translate-y-1/2 z-40 p-2 md:p-3 rounded-full shadow-lg transition-all active:scale-95
          ${canGoNext ? `${theme.ui} ${theme.uiHover} opacity-60 hover:opacity-100 cursor-pointer` : 'opacity-15 pointer-events-none'}`}
        aria-label="Next page">
        <ChevronRight size={20} />
      </button>

      {/*
        Paged content area — CSS multi-column layout (same technique as Kindle/iBooks):
        1. Outer div has exact pixel dimensions and overflow:hidden (only shows 1 page)
        2. Inner div uses CSS columns with height = outer height, columnWidth = outer width
        3. Content flows into columns — each column is one page
        4. translateX shifts to show the current page
      */}
      <div
        ref={outerRef}
        className="flex-1 overflow-hidden relative"
      >
        {dims.w > 0 && dims.h > 0 && (
          <div
            ref={contentRef}
            className={`
              prose ${theme.prose}
              ${fontSizeClass}
              ${settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}
              max-w-none
              prose-headings:font-serif prose-headings:font-bold
              prose-p:leading-relaxed
              prose-img:rounded-xl prose-img:shadow-md
            `}
            style={{
              height: `${dims.h}px`,
              columnWidth: `${dims.w}px`,
              columnGap: `${padX * 2}px`,
              columnFill: 'auto' as const,
              padding: `${padY}px ${padX}px`,
              boxSizing: 'border-box' as const,
              transform: `translateX(${-currentPage * dims.w}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            {/* Book Notes on first page */}
            {book.notes && currentPage === 0 && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl relative group not-prose">
                <div className="flex items-center gap-2 mb-1 text-yellow-800 font-serif font-bold text-sm">
                  <FilePenLine size={14} /><span>Book Notes</span>
                  <button onClick={() => setShowNotes(true)} className="ml-auto p-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"><FilePenLine size={12} /></button>
                </div>
                <div className="text-yellow-900/80 whitespace-pre-wrap font-sans text-xs leading-relaxed line-clamp-3">{book.notes}</div>
              </div>
            )}

            {book.chapters.length > 1 && (
              <span className="text-xs uppercase tracking-widest opacity-40 mb-4 block">Chapter {currentChapter.order + 1}</span>
            )}
            {(book.chapters.length > 1 || (currentChapter.title !== book.title && currentChapter.title !== 'Full Text')) && (
              <h1 className="mb-8">{currentChapter.title}</h1>
            )}

            <ReactMarkdown components={markdownComponents}>
              {currentChapter.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Tap zones for mobile page flipping */}
        <div className="absolute top-0 bottom-0 left-0 w-[12%] z-20 active:bg-black/5 transition-colors" onClick={goToPrevPage} />
        <div className="absolute top-0 bottom-0 right-0 w-[12%] z-20 active:bg-black/5 transition-colors" onClick={goToNextPage} />
      </div>

      {/* Page indicator */}
      <div className={`flex justify-center items-center py-1.5 text-xs ${theme.ui} opacity-50 select-none`}>
        <span>{currentPage + 1} / {totalPages}</span>
      </div>

      {/* AI Panel */}
      <ErrorBoundary>
        <AIPanel isOpen={showAI} onClose={() => setShowAI(false)} currentChapter={currentChapter} book={book} settings={settings} />
      </ErrorBoundary>

      <BookNotesModal isOpen={showNotes} onClose={() => setShowNotes(false)} book={book}
        onBookUpdate={async (updated) => { await saveBook(updated); if (onBookUpdate) onBookUpdate(updated); }} />
    </div>
  );
};
