import { ReaderSettings } from './types';

export const DEFAULT_SETTINGS: ReaderSettings = {
  theme: 'light',
  fontSize: 'base',
  fontFamily: 'serif',
};

export const THEME_STYLES = {
  light: {
    bg: 'bg-white',
    text: 'text-slate-900',
    prose: 'prose-slate',
    ui: 'bg-slate-50 border-slate-200 text-slate-700',
    uiHover: 'hover:bg-slate-100',
    accent: 'text-blue-600',
  },
  sepia: {
    bg: 'bg-[#fbf0d9]',
    text: 'text-[#5c4b2b]',
    prose: 'prose-stone',
    ui: 'bg-[#f4e4bc] border-[#e6d0a0] text-[#4a3b22]',
    uiHover: 'hover:bg-[#ebdcb4]',
    accent: 'text-amber-700',
  },
  dark: {
    bg: 'bg-slate-900',
    text: 'text-slate-200',
    prose: 'prose-invert',
    ui: 'bg-slate-800 border-slate-700 text-slate-300',
    uiHover: 'hover:bg-slate-700',
    accent: 'text-blue-400',
  },
  forest: {
    bg: 'bg-[#eef5ef]', // Very pale green
    text: 'text-[#1e3a29]', // Dark green text
    prose: 'prose-emerald',
    ui: 'bg-[#daeadd] border-[#c0dcc5] text-[#1e3a29]',
    uiHover: 'hover:bg-[#cde4d1]',
    accent: 'text-emerald-700',
  },
  midnight: {
    bg: 'bg-[#0f172a]', // Slate 900 like
    text: 'text-[#94a3b8]', // Slate 400
    prose: 'prose-invert',
    ui: 'bg-[#1e293b] border-[#334155] text-[#94a3b8]',
    uiHover: 'hover:bg-[#334155]',
    accent: 'text-indigo-400',
  }
};

export const FONT_SIZES = {
  sm: 'prose-sm',
  base: 'prose-base',
  lg: 'prose-lg',
  xl: 'prose-xl',
};
