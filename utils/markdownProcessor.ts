import { Chapter } from '../types';

export const parseMarkdownToBook = (text: string, fileName: string): { title: string, chapters: Chapter[] } => {
  // Simple heuristic: Split by Header 1 (#) or Header 2 (##) if H1 is missing or too sparse.
  // For this implementation, we will look for lines starting with #.
  
  const lines = text.split('\n');
  const chapters: Chapter[] = [];
  let currentTitle = "Introduction";
  let currentContent: string[] = [];
  let chapterIndex = 0;

  // Extract a likely title from the first H1
  const firstH1 = lines.find(l => l.startsWith('# '));
  const bookTitle = firstH1 ? firstH1.replace('# ', '').trim() : fileName.replace('.md', '');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect new chapter start (H1 or H2)
    // We prioritize H1, but if the file uses H2 for chapters, we could adapt.
    // Here we strictly use H1 or H2 as split points.
    const isHeader = line.startsWith('# ') || line.startsWith('## ');

    if (isHeader && (currentContent.length > 0 || chapters.length > 0)) {
      // Save previous chapter
      if (currentContent.length > 0) {
        chapters.push({
          id: `chap-${chapterIndex}`,
          title: currentTitle,
          content: currentContent.join('\n'),
          order: chapterIndex
        });
        chapterIndex++;
      }
      
      // Start new chapter
      currentTitle = line.replace(/^#+\s/, '').trim();
      currentContent = [line];
    } else {
      currentContent.push(line);
    }
  }

  // Push final chapter
  if (currentContent.length > 0) {
    chapters.push({
      id: `chap-${chapterIndex}`,
      title: currentTitle,
      content: currentContent.join('\n'),
      order: chapterIndex
    });
  }

  // If no headers were found, treat whole file as one chapter
  if (chapters.length === 0) {
    chapters.push({
      id: 'chap-0',
      title: 'Full Text',
      content: text,
      order: 0
    });
  }

  return { title: bookTitle, chapters };
};
