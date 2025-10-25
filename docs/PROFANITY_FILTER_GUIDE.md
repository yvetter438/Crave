# Profanity Filter - Quick Reference Guide

## Overview
The profanity filter (`utils/profanityFilter.ts`) automatically prevents users from posting comments containing offensive language, slurs, or spam.

## How It Works

### Validation Flow
```
User types comment → Taps Send → Validation runs → 
  ↓                                    ↓
  Pass: Comment posted          Fail: Alert shown, comment blocked
```

### What Gets Filtered

1. **Explicit Profanity**: Common swear words and variations
2. **Hate Speech**: Slurs and discriminatory language
3. **Sexual Content**: Explicit sexual language
4. **Spam Patterns**: Excessive URLs, repetitive text
5. **Length**: Comments over 500 characters

## Current Profanity List

The filter includes ~40 common offensive terms and variations including:
- Common profanity and variations (f*ck, sh*t, b*tch, etc.)
- Leetspeak variations (fuk, sh!t, a$$, etc.)
- Slurs and hate speech
- Sexual/explicit terms
- NSFW content descriptors

## Customization

### Adding Words to Filter

Edit `utils/profanityFilter.ts`:

```typescript
const PROFANITY_LIST = [
  // Add your words here
  'newbadword',
  'anotherbadword',
  // ... existing words
];
```

### Context-Sensitive Words

Some words are legitimate in certain contexts (e.g., "class" contains "ass"). Add these to:

```typescript
const CONTEXT_SENSITIVE_WORDS = [
  'word', // Will only match as whole word, not substring
];
```

### Adjusting Severity

**Strict Mode** (current): Blocks any occurrence of filtered words
**Lenient Mode**: To make less strict, you can:
1. Remove common/less offensive words from the list
2. Add more words to CONTEXT_SENSITIVE_WORDS

Example for lenient mode:
```typescript
// Move these from PROFANITY_LIST to CONTEXT_SENSITIVE_WORDS
const CONTEXT_SENSITIVE_WORDS = [
  'damn',
  'hell',
  'crap',
  // These will only block if used as whole words
];
```

## Testing

### Test Cases

```typescript
// Should BLOCK:
"This is fucking amazing" → ❌ Blocked
"You're such a b*tch" → ❌ Blocked
"Check out http://spam.com http://spam2.com http://spam3.com" → ❌ Blocked (too many URLs)

// Should ALLOW:
"This is amazing" → ✅ Allowed
"I love this class" → ✅ Allowed (contains "ass" but in valid context)
"Great food" → ✅ Allowed
```

### Manual Testing
1. Open app, go to any video
2. Open comments
3. Try posting test phrases above
4. Verify blocked/allowed as expected

### Unit Testing (Optional)

You can add tests:

```typescript
import { containsProfanity, validateCommentText } from './profanityFilter';

// Test blocking
expect(containsProfanity("This is fucking great")).toBe(true);
expect(containsProfanity("This is great")).toBe(false);

// Test validation
const result1 = validateCommentText("This is great");
expect(result1.isValid).toBe(true);

const result2 = validateCommentText("This is fucking great");
expect(result2.isValid).toBe(false);
expect(result2.error).toContain("inappropriate language");
```

## User Feedback Messages

### Current Messages

**Profanity Detected:**
```
"Cannot Post Comment"
"Your comment contains inappropriate language. 
Please revise your comment to be respectful to all users."
```

**Spam Detected:**
```
"Potential Spam Detected"
"Your comment appears to contain spam. 
Please revise and try again."
```

**Too Long:**
```
"Cannot Post Comment"
"Comment is too long. Maximum 500 characters."
```

### Customizing Messages

Edit messages in `profanityFilter.ts`:

```typescript
export function getProfanityErrorMessage(): string {
  return 'Your custom message here';
}
```

## Advanced Features

### Spam Detection

Current spam patterns:
- More than 2 URLs in comment
- 10+ repeated characters (e.g., "heeeeeeeeellooooo")
- Common spam phrases ("click here", "buy now", etc.)

Add more patterns:
```typescript
const spamPhrases = [
  'your new phrase',
  'another spam pattern',
];
```

### Multi-Language Support

To add support for other languages:

```typescript
const PROFANITY_LIST_ES = [
  // Spanish profanity
];

const PROFANITY_LIST_FR = [
  // French profanity
];

// In containsProfanity function:
export function containsProfanity(text: string, language: string = 'en'): boolean {
  const wordList = language === 'es' ? PROFANITY_LIST_ES : 
                   language === 'fr' ? PROFANITY_LIST_FR : 
                   PROFANITY_LIST;
  // ... rest of logic
}
```

## Performance Considerations

### Current Performance
- **Average check time**: <1ms for typical comments
- **Memory usage**: Negligible (~5KB for word lists)
- **No API calls**: All client-side, instant validation

### Optimization Tips
1. Keep word list under 200 words for best performance
2. Use `CONTEXT_SENSITIVE_WORDS` sparingly (slower regex)
3. Consider caching results for repeated phrases (advanced)

## Maintenance

### Regular Updates

**Monthly Review:**
- Check user reports for new slang/terms to block
- Review false positives
- Update word list as needed

**After Major Events:**
- Cultural events may create new slurs/terms
- Update list to stay current

### Monitoring

Track these metrics:
```sql
-- Comments blocked by filter (client-side, not in DB)
-- You'll need to add analytics tracking if desired

-- Reports for comments that passed filter
SELECT COUNT(*) FROM reports 
WHERE target_type = 'comment' 
AND reason IN ('hate_speech', 'harassment')
AND created_at > NOW() - INTERVAL '7 days';
```

If many comments are reported despite filter:
→ Add reported terms to filter

## False Positives

### Common Issues

**"Scunthorpe Problem"**: Legitimate words containing profanity
- Example: "assassin" contains "ass"
- Solution: Add to CONTEXT_SENSITIVE_WORDS or create exceptions

**Technical Terms**
- Food terms might trigger filter
- Example: "breast" in "chicken breast"
- Solution: Context-aware checking or whitelist

### Handling False Positives

```typescript
// Option 1: Whitelist
const WHITELIST = ['chicken breast', 'glass', 'class'];

// Check whitelist before filter
export function containsProfanity(text: string): boolean {
  const normalized = text.toLowerCase();
  
  // Check if entire phrase is whitelisted
  for (const phrase of WHITELIST) {
    if (normalized.includes(phrase)) return false;
  }
  
  // Continue with normal filtering...
}
```

## Integration with Moderation

### Two-Layer Defense

**Client-Side (Profanity Filter):**
- Prevents obvious profanity
- Instant user feedback
- No database writes for blocked content

**Server-Side (Moderators):**
- Review user reports
- Catch sophisticated abuse
- Context-aware decisions
- Can remove comments that passed filter

### Moderator Actions

When moderators review reports for comments that passed the filter:
1. Update comment status to 'removed'
2. Consider adding reported term to filter
3. Track repeat offenders

```sql
-- Remove reported comment
UPDATE comments 
SET status = 'removed',
    removed_at = NOW(),
    removed_reason = 'Inappropriate language'
WHERE id = <comment_id>;
```

## Best Practices

### Do's ✅
- Keep word list updated with current slang
- Test filter with real user scenarios
- Balance strictness with false positives
- Provide clear feedback to users
- Monitor reports for filter gaps

### Don'ts ❌
- Don't make it too strict (frustrates users)
- Don't block legitimate words without context checking
- Don't forget to test with different language keyboards
- Don't rely solely on filter - have moderators too
- Don't expose the exact word list publicly (users will work around it)

## Troubleshooting

### Filter Not Working
1. Check CommentSheet.tsx imports profanityFilter
2. Verify validation is called before supabase insert
3. Check console for errors
4. Test with simple word: "fuck" → should block

### Too Many False Positives
1. Move words to CONTEXT_SENSITIVE_WORDS
2. Add legitimate phrases to whitelist
3. Make filter case-sensitive for specific words
4. Consider machine learning approach (advanced)

### Users Bypassing Filter
Common tricks users try:
- Spaces: "f u c k" → Add detection for spaced words
- Special chars: "f@ck" → Add variations to list
- Emojis: "fu🌸k" → Strip emojis before checking
- Homoglyphs: "ⓕuck" → Normalize unicode

## Future Enhancements

### Potential Additions

1. **AI-Based Detection**
   - Use sentiment analysis API
   - Detect context and tone
   - More nuanced than word list

2. **User Reputation**
   - Allow more lenient filter for trusted users
   - Stricter for new accounts
   
3. **Custom User Filters**
   - Let users set their own filter level
   - Personal profanity lists

4. **Learning System**
   - Auto-add frequently reported terms
   - ML model for pattern detection

## Resources

### External Tools (Optional)

If you want a more comprehensive solution:

1. **better-profanity** (Python): Comprehensive word list
2. **bad-words** (JavaScript): NPM package for filtering
3. **Perspective API** (Google): AI-based toxicity detection

### Word List Sources

- https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words
- https://www.freewebheaders.com/full-list-of-bad-words-banned-by-google/

⚠️ **Warning**: These lists are very extensive. Use selectively.

## Summary

The profanity filter provides:
- ✅ Instant blocking of offensive comments
- ✅ Clear user feedback
- ✅ Customizable word lists
- ✅ Spam detection
- ✅ Zero API calls (fast & free)
- ✅ Easy to maintain

Combined with your moderation system and user blocking features, it creates a comprehensive solution for keeping Crave safe and respectful.

**Remember**: No filter is perfect. Layer it with user reports and human moderation for best results.

