import { GoogleGenAI, Type } from "@google/genai";
import { Book, Chapter } from "../types";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Skill definition from .gemini/skills/podcast-to-book/SKILL.md
const PODCAST_TO_BOOK_SKILL = `
---
name: podcast-to-book-chapter
description: Transform long-form podcast episodes into compelling, print-ready book chapters. Use this skill when the user provides a podcast transcript and wants a narrative chapter, or asks to turn a podcast into a book chapter.
---

# Podcast Episode → Physical Book Chapter

## Core Capability
Transform long-form podcast episodes into compelling, print-ready book chapters that read like narrative nonfiction rather than transcripts or summaries.

## Role Definition
You are a skilled ghostwriter who:
- Listens to/reads full podcast episodes
- Extracts the narrative spine and dramatic arc
- Crafts prose suitable for physical book publication
- Preserves authentic voices through strategic quotation
- Makes complex concepts accessible without oversimplification

## Style Framework

### Voice Targets
Match the tone of classic narrative nonfiction in your domain:
- **Business podcasts** → *Shoe Dog*, *The Everything Store*, *Hatching Twitter*
- **Tech/Data podcasts** → *The Signal and the Noise*, *Range*, *Storytelling with Data*
- **Science podcasts** → *The Immortal Life of Henrietta Lacks*, *The Gene*
- **History podcasts** → *The Devil in the White City*, *Team of Rivals*

### Key Principles
- Rich narrative with dramatic tension
- Turning points treated as pivotal scenes
- Quotes woven in organically (protagonists speak for themselves)
- Reader watches history/decisions unfold rather than reading a summary
- Analytical insight layered INTO storytelling, not separated from it

### Length Philosophy
As long as the story warrants. Base on:
- Episode length and density
- Insight richness
- Number of key turning points
- Complexity of concepts requiring explanation

**Priority**: Quality and completeness over brevity. This is a satisfying read, not a skim.

---

## Six-Step Process

### Step 1: Source & Summary
**Goal**: Provide context and metadata.

**MANDATORY: Front Matter**
At the very beginning of the chapter/book, include a section titled **"Source & Context"** containing:
*   **Original Source:** (Podcast Name)
*   **Episode Title:** (Episode Number <if any> and Title)
*   **Guest:** (Guest Name & Credentials)
*   **Host:** (Host Name)
*   **Format:** (Interview/Monologue/Panel)
*   **Summary:** A high-level, 150-word abstract of the book/chapter.

### Step 2: Understand the Arc
**Goal**: Find the narrative spine

Extract:
- **Central narrative**: What story is being told? What's the dramatic question?
- **Key characters**: Protagonists, antagonists, supporting players
- **Turning points**: The 3-5 moments where everything changed
- **The stakes**: What was at risk? What could have gone wrong?

Great stories have shape: beginning that sets stage → rising tension → pivotal decisions → resolution (or cliffhanger). Find that shape.

### Step 3: Map the Characters & Bio
**Goal**: Reader never asks "Wait, who is this?"

**MANDATORY: Bio Section**
Following the Source section, include a section titled **"About the Protagonist"** (or similar). This must include:
- Name and primary credentials
- Why they are famous/relevant in their field
- Key achievements (books, companies, awards)
- This sets the authority immediately.

For each character in the text:
- **First appearance**: Introduce clearly with identifying detail (role, relationship to central figure, why they matter)
- **Reappearances**: Re-anchor after gaps
- **Consistency**: Use same identifiers throughout

### Step 4: High-Impact Titling
**Goal**: Hook the reader immediately.

Do not use generic titles like "Summary of Episode 5." Use **High-Impact Titles** that tease the drama or the stakes.

*   **Bad:** *Podcast Summary: Stuart Russell on AI Safety*
*   **Good:** *THE FINAL INVENTION: How We Ceded Control of the Future*
*   **Bad:** *Chapter 1: Neural Networks*
*   **Good:** *Chapter 1: The Alien in the Cage: Building Minds We Don't Understand*

Use a **Title + Subtitle** format for the book/chapter itself.

### Step 5: Identify "Blocker" Concepts
**Goal**: Remove comprehension barriers

Scan for domain-specific concepts essential to understanding. These are "blockers"—if reader doesn't get them, they're lost.

For each blocker:
- Explain in plain language using analogy or real-world example
- Keep explanations to 1-2 sentences maximum
- Weave naturally into narrative on first appearance

### Step 6: Harvest the Best Quotes
**Goal**: Preserve authentic voices and sharp insights

**From hosts/guests:**
- Sharpest analytical insights
- Memorable one-liners or turns of phrase
- Surprising or counterintuitive moments
- Attribute clearly (e.g., "As [Name] observes...")

### Step 7: Weave It Together
**Goal**: Create seamless, print-ready prose

Combine narrative, analysis, and quotes into one flowing piece that:
- Reads like a chapter from a great book, not a podcast summary
- Has **no section headers, bullet points, or artificial breaks** (subtle line break between major sections is fine)
- Includes **compelling chapter title** (book chapter style, not blog post)
- Opens with **short essence paragraph**: the story + why it matters
- Makes complete sense to someone who never heard the podcast
- Is **print-ready**: no links, no screen-dependent elements
- Balances storytelling with insight: reader is both entertained and educated

---

## Quality Checklist

Before finishing, verify:

1. **Readability**: Does this read like a chapter from a book I'd actually want to read in this domain?
2. **Opening**: Does it pull me in immediately, like a great first page?
3. **Source Included**: Is the source metadata and summary present?
4. **Bio Included**: Is there a compelling bio of the guest at the start?
5. **Titles**: Are the titles/subtitles dramatic and engaging?
6. **Quotes**: Have I preserved the best quotes from both hosts and primary sources they cite?
7. **Dramatic weight**: Do turning points land with impact, or did I rush past them?
8. **Print quality**: Would this look beautiful printed in a physical book?
9. **Balance**: Does it balance storytelling with insight appropriately for the domain?

If yes to all, you've succeeded.
`;

export const summarizeChapter = async (text: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Error: API Key missing.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Please provide a concise and engaging summary of the following text, capturing the main plot points or key ideas. Keep it under 200 words.\n\nText:\n${text.substring(0, 10000)}...`,
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate summary. Please try again.";
  }
};

export const summarizeBook = async (bookContent: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Error: API Key missing.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an expert literary editor. Write a compelling "Back Cover" style summary for this entire book/document. Focus on the overarching themes, main arguments, or narrative arc. \n\nBook Content (truncated):\n${bookContent.substring(0, 25000)}...`,
    });
    return response.text || "Could not generate book overview.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate overview.";
  }
};

export const answerQuestion = async (context: string, question: string): Promise<string> => {
  const ai = getAIClient();
  if (!ai) return "Error: API Key missing.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a helpful reading assistant. Answer the user's question based on the provided text context.\n\nContext:\n${context.substring(0, 15000)}\n\nQuestion: ${question}`,
    });
    return response.text || "I couldn't find an answer to that.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to process request.";
  }
};

export const generateBookFromYouTube = async (url: string): Promise<Book> => {
  const ai = getAIClient();
  if (!ai) throw new Error("API Key missing");

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `I have a YouTube video URL: ${url}. 
    I need you to perform a Google Search to find the transcript, summary, or detailed content of this video.
    Then, transform this content into a structured book by strictly following the "Podcast Episode → Physical Book Chapter" skill provided in the system instructions.
    
    CRITICAL OUTPUT REQUIREMENTS:
    1.  **Chapter 1 ("Introduction")**: MUST contain the "Source & Context" and "About the Protagonist" sections as Markdown H2 headers, followed by the narrative introduction.
    2.  **Narrative Style**: Write in the style of narrative nonfiction (e.g., Malcolm Gladwell, Michael Lewis). Do not use bullet points for the main content.
    3.  **Structure**: Divide the video content into logical, named chapters.
    
    Return the result as a strictly valid JSON object.`,
    config: {
      tools: [{googleSearch: {}}],
      systemInstruction: PODCAST_TO_BOOK_SKILL,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bookTitle: { type: Type.STRING, description: "A catchy, high-impact title for the book" },
          chapters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "High-impact chapter title" },
                content: { type: Type.STRING, description: "Markdown formatted content for this chapter" }
              },
              required: ['title', 'content']
            }
          }
        },
        required: ['bookTitle', 'chapters']
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  
  if (!data.chapters || data.chapters.length === 0) {
    throw new Error("Could not generate content from this URL. Try pasting the transcript manually.");
  }

  return {
    id: crypto.randomUUID(),
    title: data.bookTitle || "YouTube Summary",
    fileName: url,
    dateAdded: Date.now(),
    source: 'youtube',
    chapters: data.chapters.map((c: any, i: number) => ({
      id: `chap-${i}`,
      title: c.title,
      content: c.content,
      order: i
    }))
  };
};

export const generateBookFromText = async (text: string, title: string = "Pasted Content"): Promise<Book> => {
  const ai = getAIClient();

  if (!ai) {
    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      resolve({
         id,
         title,
         fileName: 'pasted.txt',
         dateAdded: Date.now(),
         source: 'text',
         chapters: [{
             id: 'chap-0',
             title: 'Content',
             content: text,
             order: 0
         }]
      });
    });
  }

  try {
     const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a book editor. Organize the following text into a structured book format.
        
        Text to organize (first 30k chars):
        ${text.substring(0, 30000)}

        Requirements:
        1. The first chapter must be "Introduction". Include a summary and any context (author, source, etc) found in the text.
        2. Divide the rest into logical chapters with titles.
        3. Format content in Markdown.
        
        Return JSON.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    bookTitle: { type: Type.STRING },
                    chapters: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                content: { type: Type.STRING }
                            },
                            required: ['title', 'content']
                        }
                    }
                },
                required: ['bookTitle', 'chapters']
            }
        }
     });

     const data = JSON.parse(response.text || "{}");
     
     if (!data.chapters || data.chapters.length === 0) throw new Error("No chapters created");

     return {
        id: crypto.randomUUID(),
        title: data.bookTitle || title,
        fileName: 'pasted.txt',
        dateAdded: Date.now(),
        source: 'text',
        chapters: data.chapters.map((c: any, i: number) => ({
            id: `chap-${i}`,
            title: c.title,
            content: c.content,
            order: i
        }))
     };

   } catch (err) {
      console.error("AI Text structure failed", err);
      return {
        id: crypto.randomUUID(),
        title,
        fileName: 'pasted.txt',
        dateAdded: Date.now(),
        source: 'text',
        chapters: [{
            id: 'chap-0',
            title: 'Full Text',
            content: text,
            order: 0
        }]
     };
   }
};