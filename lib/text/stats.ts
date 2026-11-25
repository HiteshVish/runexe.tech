import { countGraphemes, countSentences, countWords } from "./segment";

export type TextStats = {
  words: number;
  charsWithSpaces: number;
  charsWithoutSpaces: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readMinutes: number;
  speakMinutes: number;
};

const READ_WPM = 220;
const SPEAK_WPM = 130;

export function analyzeText(text: string): TextStats {
  const words = countWords(text);
  const charsWithSpaces = text.length;
  const charsWithoutSpaces = text.replace(/\s/g, "").length;
  const sentences = countSentences(text);
  const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;
  const lines = text ? text.split(/\n/).length : 0;
  const readMinutes = words / READ_WPM;
  const speakMinutes = words / SPEAK_WPM;
  return {
    words,
    charsWithSpaces,
    charsWithoutSpaces,
    sentences,
    paragraphs: paragraphs || (text.trim() ? 1 : 0),
    lines,
    readMinutes,
    speakMinutes,
  };
}

export { countGraphemes };