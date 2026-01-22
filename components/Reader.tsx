import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Chapter, ReaderSettings } from '../types';
import { THEME_STYLES, FONT_SIZES } from '../constants';

interface ReaderProps {
  chapter: Chapter;
  settings: ReaderSettings;
  onNextChapter: () => void;
  onPrevChapter: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export const Reader: React.FC<ReaderProps> = ({ 
  chapter, 
  settings, 
  onNextChapter, 
  onPrevChapter,
  hasPrev,
  hasNext
}) => {
  const topRef = useRef<HTMLDivElement>(null);
  const theme = THEME_STYLES[settings.theme];
  const fontSize = FONT_SIZES[settings.fontSize];

  // Scroll to top when chapter changes
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chapter.id]);

  return (
    <div className={`flex-1 h-full overflow-y-auto relative scroll-smooth ${theme.bg}`}>
      <div ref={topRef} />
      
      <div className={`max-w-3xl mx-auto px-6 py-12 md:py-20 min-h-screen transition-colors duration-300`}>
        <article className={`
          prose ${theme.prose} 
          ${fontSize} 
          ${settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}
          max-w-none
          prose-headings:font-serif prose-headings:font-bold
          prose-p:leading-relaxed
          prose-img:rounded-xl prose-img:shadow-md
        `}>
          <ReactMarkdown>{chapter.content}</ReactMarkdown>
        </article>

        {/* Chapter Navigation Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200/20 flex justify-between items-center">
          <button
            onClick={onPrevChapter}
            disabled={!hasPrev}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              !hasPrev ? 'opacity-0 cursor-default' : `${theme.ui} ${theme.uiHover}`
            }`}
          >
            <ChevronLeft size={20} />
            <span>Previous</span>
          </button>

          <span className={`text-sm opacity-50 ${theme.text}`}>
            Chapter {chapter.order + 1}
          </span>

          <button
            onClick={onNextChapter}
            disabled={!hasNext}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              !hasNext ? 'opacity-0 cursor-default' : `${theme.ui} ${theme.uiHover}`
            }`}
          >
            <span>Next</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
