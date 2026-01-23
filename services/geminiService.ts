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
description: Transform long-form podcast episodes into compelling, print-ready book chapters.
---

# Podcast Episode → Narrative Article

## Core Capability
Transform long-form podcast episodes into compelling, print-ready narrative nonfiction articles.

## Role Definition
You are a skilled ghostwriter who:
- Listens to/reads full podcast episodes
- Extracts the narrative spine and dramatic arc
- Crafts prose suitable for physical book publication
- Preserves authentic voices through strategic quotation
- Makes complex concepts accessible without oversimplification

## Style Framework

### Voice Targets
Match the tone of classic narrative nonfiction (e.g. *Shoe Dog*, *The Signal and the Noise*).

### Key Principles
- Rich narrative with dramatic tension.
- **NO Bullet points** in the main narrative. Use prose.
- **Heading Structure**: Use Markdown headers (##) to denote turning points or scene changes.

---

## Structure Requirements

### 1. Front Matter (Mandatory Start)
Start the content immediately with a blockquote (>) containing the metadata:
> **Source:** [Podcast Name] | **Guest:** [Name] | **Topic:** [Topic]

**CRITICAL:** Do NOT output the Book Title or Subtitle as a Markdown Header at the top. The application handles the title display. Start directly with the metadata blockquote.

### 2. The Hook & Bio
Immediately follow the blockquote with the narrative hook. 
Do NOT create a header called "Introduction". Just start writing.
Include a section titled **"## About the Guest"** early in the text to establish authority.

### 3. Narrative Flow
Write as a single cohesive article. 
**FORBIDDEN:** Do not use the word "Chapter" in any headings. Do not say "Chapter 1", "Chapter 2". 
Use descriptive **## Headings** only (e.g., "## The Problem with AI", "## A New Hope").

### 4. High-Impact Headings
Use dramatic headings.
*   *Bad:* "Summary of AI Risk"
*   *Good:* "## The Alien in the Cage"

---

## Quality Checklist
1. **Readability**: Does this read like a New Yorker article?
2. **Structure**: Did I use ## Headers effectively for navigation?
3. **No Chapters**: Did I ensure no headings contain "Chapter X"?
4. **No Title Header**: Did I start with the metadata blockquote?
5. **Bio Included**: Is the "About the Guest" section included?
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
    Then, transform this content into a structured narrative article by strictly following the "Podcast Episode → Narrative Article" skill provided in the system instructions.
    
    CRITICAL OUTPUT REQUIREMENTS:
    1.  **Single Document**: Return the entire result as one Markdown string.
    2.  **Headings**: Use Markdown headers (##) for sections.
    3.  **No "Introduction" Heading**: Do not label the first section "Introduction". Just start the narrative.
    4.  **No Title Header**: Do not put the Book Title as a # Header in the content.
    
    Return the result as a strictly valid JSON object.`,
    config: {
      tools: [{googleSearch: {}}],
      systemInstruction: PODCAST_TO_BOOK_SKILL,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bookTitle: { type: Type.STRING, description: "A catchy, high-impact title" },
          content: { type: Type.STRING, description: "The full narrative content in Markdown format. Use ## About the Guest." }
        },
        required: ['bookTitle', 'content']
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  
  if (!data.content) {
    throw new Error("Could not generate content from this URL. Try pasting the transcript manually.");
  }

  return {
    id: crypto.randomUUID(),
    title: data.bookTitle || "YouTube Summary",
    fileName: url,
    dateAdded: Date.now(),
    source: 'youtube',
    chapters: [{
      id: 'chap-0',
      title: 'Full Text',
      content: data.content,
      order: 0
    }]
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
        contents: `You are a book editor. Organize the following text into a structured narrative format.
        
        Text to organize (first 30k chars):
        ${text.substring(0, 30000)}

        Requirements:
        1. Create a single cohesive Markdown document.
        2. Use ## Headings to separate logical sections.
        3. Do NOT use the word "Chapter" in headings.
        4. Do NOT use an "Introduction" header.
        5. Do NOT use a Title header at the start.
        
        Return JSON.`,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    bookTitle: { type: Type.STRING },
                    content: { type: Type.STRING }
                },
                required: ['bookTitle', 'content']
            }
        }
     });

     const data = JSON.parse(response.text || "{}");
     
     if (!data.content) throw new Error("No content created");

     return {
        id: crypto.randomUUID(),
        title: data.bookTitle || title,
        fileName: 'pasted.txt',
        dateAdded: Date.now(),
        source: 'text',
        chapters: [{
            id: 'chap-0',
            title: 'Full Text',
            content: data.content,
            order: 0
        }]
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