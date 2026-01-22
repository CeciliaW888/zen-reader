import React from 'react';
import { X, Book, Type, Settings, Sparkles, Library } from 'lucide-react';
import { Book as BookType, Chapter, ReaderSettings } from '../types';
import { THEME_STYLES } from '../constants';

interface SidebarProps {
  book: BookType;
  currentChapterId: string;
  onChapterSelect: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onSettingsChange: (settings: ReaderSettings) => void;
  onToggleAI: () => void;
  aiPanelOpen: boolean;
  onBackToLibrary: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  book,
  currentChapterId,
  onChapterSelect,
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onToggleAI,
  aiPanelOpen,
  onBackToLibrary
}) => {
  const theme = THEME_STYLES[settings.theme];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 bottom-0 w-80 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${theme.bg} border-r ${settings.theme.includes('dark') || settings.theme === 'midnight' ? 'border-slate-800' : 'border-gray-200'}
      `}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200/10 flex justify-between items-center shrink-0">
            <h2 className={`font-bold font-serif truncate ${theme.text} w-48`}>{book.title}</h2>
            <button onClick={onClose} className={`p-1 rounded-md ${theme.uiHover} ${theme.text}`}>
              <X size={20} />
            </button>
          </div>

          {/* Chapters List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
             <button
               onClick={onBackToLibrary}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm mb-6 ${theme.text} hover:bg-black/5 transition-colors border border-dashed border-gray-300/50`}
             >
                <Library size={18} />
                <span>Back to Library</span>
             </button>

            <div className={`text-xs font-bold uppercase tracking-wider mb-3 ml-2 opacity-50 ${theme.text}`}>
              Chapters
            </div>
            {book.chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => {
                  onChapterSelect(chapter.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  w-full text-left px-4 py-3 rounded-lg text-sm transition-all
                  ${currentChapterId === chapter.id 
                    ? `${theme.accent} bg-black/5 font-medium` 
                    : `${theme.text} hover:bg-black/5 opacity-80 hover:opacity-100`}
                `}
              >
                <div className="flex items-center gap-3">
                   <span className="opacity-50 text-xs w-4 shrink-0">{chapter.order + 1}</span>
                   <span className="truncate">{chapter.title}</span>
                </div>
              </button>
            ))}
          </div>

          {/* AI Toggle */}
           <div className="p-4 border-t border-gray-200/10 shrink-0">
             <button
               onClick={onToggleAI}
               className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors border ${
                 aiPanelOpen 
                  ? `${theme.accent} border-current bg-blue-50/50`
                  : `${theme.text} border-transparent hover:bg-black/5`
               }`}
             >
               <div className="flex items-center gap-3">
                 <Sparkles size={18} />
                 <span className="font-medium text-sm">AI Assistant</span>
               </div>
               <div className={`w-2 h-2 rounded-full ${aiPanelOpen ? 'bg-green-500' : 'bg-gray-300'}`} />
             </button>
           </div>

          {/* Settings Section */}
          <div className="p-4 border-t border-gray-200/10 space-y-6 bg-black/5 shrink-0">
            {/* Theme Selector */}
            <div className="space-y-2">
              <div className={`text-xs font-bold uppercase tracking-wider opacity-50 ${theme.text}`}>Theme</div>
              <div className="flex gap-2 flex-wrap">
                {(['light', 'sepia', 'forest', 'dark', 'midnight'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => onSettingsChange({ ...settings, theme: t })}
                    className={`
                      w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
                      ${t === 'light' ? 'bg-white border-gray-200' : ''}
                      ${t === 'sepia' ? 'bg-[#fbf0d9] border-[#e6d0a0]' : ''}
                      ${t === 'forest' ? 'bg-[#eef5ef] border-[#c0dcc5]' : ''}
                      ${t === 'dark' ? 'bg-slate-900 border-slate-700' : ''}
                      ${t === 'midnight' ? 'bg-[#0f172a] border-[#334155]' : ''}
                      ${settings.theme === t ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}
                    `}
                    title={t.charAt(0).toUpperCase() + t.slice(1)}
                  />
                ))}
              </div>
            </div>

            {/* Font Settings */}
            <div className="space-y-2">
               <div className={`text-xs font-bold uppercase tracking-wider opacity-50 ${theme.text}`}>Typography</div>
               <div className="flex justify-between items-center bg-white/10 rounded-lg p-1 border border-gray-200/20">
                 {(['sm', 'base', 'lg'] as const).map(size => (
                   <button 
                    key={size}
                    onClick={() => onSettingsChange({...settings, fontSize: size})}
                    className={`p-2 rounded w-8 flex items-center justify-center ${settings.fontSize === size ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                   >
                     <span className={`leading-none ${size === 'sm' ? 'text-xs' : size === 'base' ? 'text-sm' : 'text-lg'}`}>A</span>
                   </button>
                 ))}
                 <div className="w-px h-6 bg-gray-300 mx-2"></div>
                 <button
                   onClick={() => onSettingsChange({...settings, fontFamily: settings.fontFamily === 'serif' ? 'sans' : 'serif'})}
                   className={`px-3 py-1 rounded text-xs font-bold ${theme.text} hover:bg-black/5`}
                 >
                   {settings.fontFamily === 'serif' ? 'Serif' : 'Sans'}
                 </button>
               </div>
            </div>
          </div>
      </div>
    </>
  );
};
