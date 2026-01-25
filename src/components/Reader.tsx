import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, ChevronRight, FilePenLine, X } from 'lucide-react';
import { Chapter, ReaderSettings, Book, Highlight } from '../types';
import { THEME_STYLES, FONT_SIZES } from '../constants';
import { slugify } from '../utils/markdownProcessor';
import { ReaderTopBar } from './reader/ReaderTopBar';
import { AIPanel } from './AIPanel';
import { BookNotesModal } from './BookNotesModal';
import { saveBook } from '../services/db'; // Import saveBook

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
  const topRef = useRef<HTMLDivElement>(null);
  const theme = THEME_STYLES[settings.theme];
  // Cast number to key of FONT_SIZES if necessary, though indexing works
  const fontSizeClass = FONT_SIZES[settings.fontSize];

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  // Highlight State
  const [selectedText, setSelectedText] = useState<{ text: string; top: number; left: number } | null>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);

  // Computed properties
  const currentChapter = book.chapters.find(c => c.id === currentChapterId);
  const currentChapterIndex = book.chapters.findIndex(c => c.id === currentChapterId);
  const hasPrev = currentChapterIndex > 0;
  const hasNext = currentChapterIndex > -1 && currentChapterIndex < book.chapters.length - 1;

  // Scroll to top when chapter changes
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
    setSearchQuery(''); // Reset search on chapter change
    setSelectedText(null);
  }, [currentChapterId]);

  // Handle Selection
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

        // Simple relative positioning check
        // We only show if selection is within the reader article
        if (text.length > 0) {
          // Adjust for scroll position if needed, but fixed/absolute usually relative to viewport
          setSelectedText({
            text,
            top: rect.top, // clientY
            left: rect.left + (rect.width / 2) // center
          });
        }
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  // Handle Adding Highlight
  const handleAddHighlight = async () => {
    if (!selectedText) return;

    // In a real app we'd identify the exact node path or offset. 
    // Here we will use simple text matching, which is fragile for duplicates but sufficient for this demo.
    const newHighlight: Highlight = {
      id: crypto.randomUUID(),
      chapterId: currentChapterId,
      text: selectedText.text,
      note: '', // Default empty
      color: 'yellow',
      created: Date.now()
    };

    const updatedBook = {
      ...book,
      highlights: [...(book.highlights || []), newHighlight]
    };

    // Callback to parent to persist
    // We will save to DB.
    await saveBook(updatedBook);

    // We need to notify parent to update `book` prop. 
    if (onBookUpdate) onBookUpdate(updatedBook);

    setSelectedText(null);
    setActiveHighlightId(newHighlight.id); // Open it to edit note immediately?

    // Clear selection
    window.getSelection()?.removeAllRanges();
  };

  const handleUpdateHighlight = async (id: string, note: string, color: string) => {
    const newHighlights = (book.highlights || []).map(h =>
      h.id === id ? { ...h, note, color } : h
    );
    const updatedBook = { ...book, highlights: newHighlights };
    await saveBook(updatedBook);
    if (onBookUpdate) onBookUpdate(updatedBook);
  };

  const handleDeleteHighlight = async (id: string) => {
    const newHighlights = (book.highlights || []).filter(h => h.id !== id);
    const updatedBook = { ...book, highlights: newHighlights };
    await saveBook(updatedBook);
    if (onBookUpdate) onBookUpdate(updatedBook);
    setActiveHighlightId(null);
  };


  // Handle navigation
  const handleNext = () => {
    if (hasNext) onChapterSelect(book.chapters[currentChapterIndex + 1].id);
  };

  const handlePrev = () => {
    if (hasPrev) onChapterSelect(book.chapters[currentChapterIndex - 1].id);
  };

  // Helper to highlight text & Highlights
  const HighlightText = ({ text }: { text: string }) => {
    // Collect all things to highlight
    const chapterHighlights = (book.highlights || []).filter(h => h.chapterId === currentChapterId);

    // If nothing to highlight, return text
    if (!searchQuery.trim() && chapterHighlights.length === 0) {
      return <>{text}</>;
    }

    // We will build a list of "intervals" to highlight: { start, end, type, data }
    // Since we deal with simple string matching (limitation of this approach), we find matches.

    interface Match {
      start: number;
      end: number;
      type: 'search' | 'note';
      data?: any;
      priority: number; // Search = 1 (low), Note = 2 (high)
    }

    let matches: Match[] = [];

    // 1. Find Search Matches
    if (searchQuery.trim()) {
      // Escape special regex characters in the query
      const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedQuery, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'search',
          // Lower priority than user notes, but should still render if no overlap. 
          // If overlap, we might want to show both or merge? 
          // For now, simple priority: if note exists, it wins.
          priority: 1
        });
      }
    }

    // 2. Find Highlight Matches
    // Note: This matches ALL occurrences of the highlighted text string.
    chapterHighlights.forEach((h, index) => {
      // Escape for regex but allow flexible whitespace
      if (!h.text.trim()) return;
      const escapedText = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Replace explicit spaces with loose whitespace matcher to handle Markdown formatting differences
      const flexibleRegexPattern = escapedText.replace(/\s+/g, '\\s+');

      const regex = new RegExp(flexibleRegexPattern, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          type: 'note',
          data: { ...h, index: index + 1 },
          priority: 2
        });
      }
    });

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Render loop
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Handle overlaps simply: skip if we are already past start
    for (const match of matches) {
      if (match.start < lastIndex) continue; // Skip overlapped for now (simple)

      // Add text before match
      if (match.start > lastIndex) {
        elements.push(text.slice(lastIndex, match.start));
      }

      // Add match
      if (match.type === 'search') {
        elements.push(
          <mark key={`search-${match.start}`} className="bg-orange-300 text-slate-900 rounded-sm px-0.5">
            {text.slice(match.start, match.end)}
          </mark>
        );
      } else {
        const h = match.data;
        elements.push(
          <span
            key={`note-${h.id}-${match.start}`}
            className={`bg-yellow-200 cursor-pointer border-b-2 border-yellow-400`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveHighlightId(h.id);
            }}
          >
            {text.slice(match.start, match.end)}
            <sup className="text-[10px] font-bold text-yellow-800 ml-0.5 select-none hover:text-red-500">[{h.index}]</sup>
          </span>
        );
      }

      lastIndex = match.end;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }

    return <>{elements}</>;
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
        <div className="mt-14 bg-white border-b border-gray-200 px-4 py-3 animate-in slide-in-from-top-2 duration-200 flex items-center gap-2 z-30 shadow-sm relative">
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

      {/* Selection Tooltip */}
      {selectedText && (
        <div
          className="fixed z-50 bg-slate-800 text-white rounded-lg shadow-xl flex items-center gap-1 p-1 animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: Math.max(10, selectedText.top - 50) + 'px',
            left: Math.max(10, selectedText.left - 50) + 'px' // Simple centering
          }}
        >
          <button
            onClick={handleAddHighlight}
            className="px-3 py-1.5 hover:bg-slate-700 rounded-md text-xs font-bold flex items-center gap-2"
          >
            <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-200"></span>
            Highlight
          </button>
          <div className="w-px h-4 bg-slate-600 mx-1"></div>
          <button
            onClick={() => setSelectedText(null)}
            className="px-2 py-1.5 hover:bg-slate-700 rounded-md text-xs text-slate-400"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto relative scroll-smooth ${theme.bg} ${showSearch ? '' : 'mt-14'}`}>
        <div ref={topRef} />

        <div className={`max-w-2xl mx-auto px-6 py-12 md:py-20 min-h-screen transition-colors duration-300`}>
          {/* General Notes Display */}
          {book.notes && (
            <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl relative group">
              <div className="flex items-center gap-2 mb-2 text-yellow-800 font-serif font-bold">
                <FilePenLine size={18} />
                <span>Book Notes</span>
              </div>
              <div className="text-yellow-900/80 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {book.notes}
              </div>
              <button
                onClick={() => setShowNotes(true)}
                className="absolute top-4 right-4 p-2 bg-yellow-100 text-yellow-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-yellow-200"
                title="Edit Notes"
              >
                <FilePenLine size={16} />
              </button>
            </div>
          )}

          <article className={`
            prose ${theme.prose} 
            ${fontSizeClass} 
            ${settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}
            max-w-none
            prose-headings:font-serif prose-headings:font-bold
            prose-p:leading-relaxed
            prose-img:rounded-xl prose-img:shadow-md
          `}>
            {/* Only show Chapter Number if multiple chapters exist */}
            {book.chapters.length > 1 && (
              <span className="text-xs uppercase tracking-widest opacity-40 mb-4 block">Chapter {currentChapter.order + 1}</span>
            )}

            {/* Only show Title if it's not just the Book Title again or "Full Text" legacy */}
            {(book.chapters.length > 1 || currentChapter.title !== book.title) && (
              <h1 className="mb-8">{currentChapter.title}</h1>
            )}

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