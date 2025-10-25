/**
 * Profanity Filter Utility
 * Filters offensive language from user-generated content
 * Apple App Store compliance
 */

// Common profanity list (expandable)
// This is a basic list - you can expand it or integrate with a more comprehensive library
const PROFANITY_LIST = [
  // Explicit profanity
  'fuck', 'shit', 'bitch', 'damn', 'ass', 'bastard', 'crap', 'piss',
  'dick', 'pussy', 'cock', 'cunt', 'whore', 'slut', 'fag', 'nigger',
  'retard', 'rape', 'nazi', 'hitler',
  
  // Common variations and leetspeak
  'f*ck', 'sh*t', 'b*tch', 'a$$', 'fuk', 'fck', 'sh!t', 'b!tch',
  'fuq', 'phuck', 'shyt', 'biatch', 'bytch',
  
  // Slurs and hate speech
  'n*gger', 'n1gger', 'f*ggot', 'faggot', 'kike', 'spic', 'chink',
  
  // Sexual content
  'porn', 'xxx', 'sex', 'nude', 'naked', 'boobs', 'tits', 'penis',
  'vagina', 'masturbate', 'orgasm',
];

// Words that might be offensive in context but are also legitimate words
// These will be checked with word boundaries to avoid false positives
const CONTEXT_SENSITIVE_WORDS = [
  'ass', // could be part of "class", "glass", "pass"
  'damn', // less severe
  'crap', // less severe
  'hell', // less severe
];

/**
 * Check if text contains profanity
 * @param text - Text to check
 * @returns true if profanity is detected
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;
  
  const normalizedText = text.toLowerCase().trim();
  
  // Check each profanity word
  for (const word of PROFANITY_LIST) {
    // Use word boundaries for context-sensitive words
    if (CONTEXT_SENSITIVE_WORDS.includes(word)) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(normalizedText)) {
        return true;
      }
    } else {
      // Direct substring match for explicit profanity (catches variations)
      if (normalizedText.includes(word)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Filter profanity from text by replacing with asterisks
 * @param text - Text to filter
 * @returns Filtered text with profanity replaced
 */
export function filterProfanity(text: string): string {
  if (!text) return text;
  
  let filteredText = text;
  
  // Replace each profanity word
  for (const word of PROFANITY_LIST) {
    // Create replacement with same length
    const replacement = '*'.repeat(word.length);
    
    if (CONTEXT_SENSITIVE_WORDS.includes(word)) {
      // Use word boundaries for context-sensitive words
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      filteredText = filteredText.replace(regex, replacement);
    } else {
      // Case-insensitive global replace
      const regex = new RegExp(word, 'gi');
      filteredText = filteredText.replace(regex, replacement);
    }
  }
  
  return filteredText;
}

/**
 * Get a user-friendly error message for profanity detection
 */
export function getProfanityErrorMessage(): string {
  return 'Your comment contains inappropriate language. Please revise your comment to be respectful to all users.';
}

/**
 * Validate comment text for posting
 * @param text - Comment text to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateCommentText(text: string): {
  isValid: boolean;
  error?: string;
} {
  // Check if empty
  if (!text || text.trim().length === 0) {
    return {
      isValid: false,
      error: 'Comment cannot be empty.',
    };
  }
  
  // Check length
  if (text.trim().length > 500) {
    return {
      isValid: false,
      error: 'Comment is too long. Maximum 500 characters.',
    };
  }
  
  // Check for profanity
  if (containsProfanity(text)) {
    return {
      isValid: false,
      error: getProfanityErrorMessage(),
    };
  }
  
  return { isValid: true };
}

/**
 * Check if text contains spam patterns
 * (Basic implementation - can be enhanced)
 */
export function containsSpam(text: string): boolean {
  if (!text) return false;
  
  const normalizedText = text.toLowerCase();
  
  // Check for excessive URLs
  const urlPattern = /(https?:\/\/[^\s]+)/gi;
  const urlMatches = normalizedText.match(urlPattern);
  if (urlMatches && urlMatches.length > 2) {
    return true;
  }
  
  // Check for excessive repetition of same character
  const repetitionPattern = /(.)\1{10,}/;
  if (repetitionPattern.test(text)) {
    return true;
  }
  
  // Check for common spam phrases
  const spamPhrases = [
    'click here',
    'buy now',
    'limited time',
    'act now',
    'free money',
    'earn money fast',
    'work from home',
    'lose weight fast',
  ];
  
  for (const phrase of spamPhrases) {
    if (normalizedText.includes(phrase)) {
      return true;
    }
  }
  
  return false;
}

