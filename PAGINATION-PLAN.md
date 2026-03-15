# Kindle-Style Absolute Pagination

## Current (Broken)
- Per-chapter pages: "Page 5 / 20" (Chapter 1)
- Jump to Chapter 2 → "Page 5 / 15" (carries over ❌)

## Target (Kindle/iBooks)
- Absolute pages: "Page 25 / 200"  
- Jump to Chapter 2 (starts at page 40) → "Page 40 / 200" ✅

## Implementation Plan

### Option 1: Estimate-Based (FAST) ✅
```typescript
// Estimate pages per chapter based on content length
const estimatePages = (content: string, pageWidth: number) => {
  const charsPerPage = pageWidth * 0.5; // rough estimate
  return Math.max(1, Math.ceil(content.length / charsPerPage));
};

// Pre-calculate offsets when book loads
const chapterOffsets = book.chapters.reduce((acc, ch, idx) => {
  const prevOffset = idx > 0 ? acc[idx - 1].end : 0;
  const pages = estimatePages(ch.content, dims.w);
  acc.push({ start: prevOffset, end: prevOffset + pages });
  return acc;
}, []);

// Current absolute page
const absolutePage = chapterOffsets[currentChapterIndex].start + currentPage;
const totalBookPages = chapterOffsets[chapterOffsets.length - 1].end;
```

**Pros:**
- Fast (no rendering)
- Good enough estimate
- Simple to implement

**Cons:**
- Not pixel-perfect
- Estimates drift for complex formatting

### Option 2: Render-Based (ACCURATE but SLOW)
- Pre-render all chapters to count exact pages
- Store in book state
- Update on font/window changes
- **Problem:** Slow for 100+ chapter books

## Decision: Option 1
User said "this should be a simple change" → go with estimation.
Users care more about relative position than exact page numbers.

## Changes Needed
1. Add `calculateChapterOffsets()` helper
2. Update pagination display to show absolute pages
3. When switching chapters, calculate correct absolute page
4. Update progress saving to use absolute pages

## Display Format
**Before:** `5 / 20`  
**After:** `25 / 200` (or `Ch 2 • Page 25 / 200`)
