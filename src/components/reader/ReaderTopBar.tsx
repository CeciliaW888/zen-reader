import React, { useRef, useState } from 'react';
import { ChevronLeft, AlignLeft, Search, Type, Sparkles, FilePenLine } from 'lucide-react';
import { AppearanceMenu } from './AppearanceMenu';
import { ReaderSettings, Book } from '../../types';

interface ReaderTopBarProps {
    bookTitle: string;
    onBack: () => void;
    onToggleTOC: () => void;
    onToggleSearch: () => void;
    onToggleNotes: () => void;
    onToggleAI: () => void;
    settings: ReaderSettings;
    onSettingsChange: (settings: ReaderSettings) => void;
    showAI: boolean;
}

export const ReaderTopBar: React.FC<ReaderTopBarProps> = ({
    bookTitle,
    onBack,
    onToggleTOC,
    onToggleSearch,
    onToggleNotes,
    onToggleAI,
    settings,
    onSettingsChange,
    showAI
}) => {
    const [showAppearance, setShowAppearance] = useState(false);
    const aaButtonRef = useRef<HTMLButtonElement>(null);

    // Determine icon color based on theme
    const isDark = settings.theme === 'dark' || settings.theme === 'midnight';
    const iconClass = isDark ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-black';
    const bgClass = isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-gray-100';

    return (
        <div className={`
      fixed top-0 left-0 right-0 h-14 z-40 backdrop-blur-md border-b
      flex items-center justify-between px-2 md:px-4 transition-colors duration-300
      ${bgClass}
    `}>
            {/* Left: Navigation */}
            <div className="flex items-center gap-1">
                <button
                    onClick={onBack}
                    className={`p-2 rounded-lg hover:bg-black/5 transition-colors ${iconClass}`}
                    title="Back to Library"
                >
                    <ChevronLeft size={22} />
                </button>
                <button
                    onClick={onToggleTOC}
                    className={`p-2 rounded-lg hover:bg-black/5 transition-colors ${iconClass}`}
                    title="Table of Contents"
                >
                    <AlignLeft size={22} />
                </button>
            </div>

            {/* Center: Title (Optional, maybe hidden on mobile if too long) */}
            <h1 className={`
        absolute left-1/2 -translate-x-1/2 font-serif font-bold truncate max-w-[40%] text-sm md:text-base cursor-default opacity-80 select-none
        ${isDark ? 'text-gray-200' : 'text-gray-800'}
      `}>
                {bookTitle}
            </h1>

            {/* Right: Tools */}
            <div className="flex items-center gap-1">
                {/* Appearance "Aa" */}
                <div className="relative">
                    <button
                        ref={aaButtonRef}
                        onClick={() => setShowAppearance(!showAppearance)}
                        className={`p-2 rounded-lg hover:bg-black/5 transition-colors ${iconClass} ${showAppearance ? 'bg-black/5' : ''}`}
                        title="Appearance Settings"
                    >
                        <Type size={20} />
                    </button>

                    <AppearanceMenu
                        isOpen={showAppearance}
                        onClose={() => setShowAppearance(false)}
                        triggerRef={aaButtonRef}
                        settings={settings}
                        onSettingsChange={onSettingsChange}
                    />
                </div>

                {/* Search */}
                <button
                    onClick={onToggleSearch}
                    className={`p-2 rounded-lg hover:bg-black/5 transition-colors ${iconClass}`}
                    title="Search in Book"
                >
                    <Search size={20} />
                </button>

                {/* Notes */}
                <button
                    onClick={onToggleNotes}
                    className={`p-2 rounded-lg hover:bg-black/5 transition-colors ${iconClass}`}
                    title="My Notes"
                >
                    <FilePenLine size={20} />
                </button>

                {/* AI Companion */}
                <button
                    onClick={onToggleAI}
                    className={`p-2 rounded-lg hover:bg-black/5 transition-colors flex items-center gap-1 ${showAI ? 'text-blue-500 bg-blue-50/10' : iconClass}`}
                    title="AI Companion"
                >
                    <Sparkles size={18} />
                    {/* <span className="text-xs font-bold hidden sm:inline">AI</span> */}
                </button>
            </div>
        </div>
    );
};
