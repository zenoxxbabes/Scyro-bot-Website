
import { parseMarkdown } from '@/utils/markdown';

// Helper function to render text with emojis
export function parseAndRenderEmojis(text, className = "") {
    if (!text) return null;

    // Split by custom emoji regex: <a:name:id> or <:name:id>
    const parts = text.split(/(<a?:[^:]+:\d+>)/g);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                if (!part) return null;

                const emojiMatch = part.match(/^<a?:.+?:(\d+)>$/);
                if (emojiMatch) {
                    const emojiId = emojiMatch[1];
                    const isAnimated = part.startsWith('<a:');
                    const ext = isAnimated ? 'gif' : 'png';
                    const url = `https://cdn.discordapp.com/emojis/${emojiId}.${ext}`;

                    return (
                        <img
                            key={index}
                            src={url}
                            alt={part}
                            className="inline-block object-contain align-middle"
                            style={{ height: '1.3em', width: 'auto', margin: '0 2px' }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'inline';
                            }}
                        />
                    );
                }

                // Return text part
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
}

// New helper that combines Markdown and Emoji parsing
export function parseContent(text, className = "") {
    if (!text) return null;

    // First parse markdown which returns an array of React elements
    const markdownElements = parseMarkdown(text);

    // Then iterate through the elements to process emojis within text nodes?
    // Actually, parseMarkdown returns structure (divs, bolds etc). 
    // We should probably modify parseMarkdown to call parseAndRenderEmojis for text content.
    // But since parseMarkdown is in utils, let's keep it simple.

    // Better approach: Let's just swap the usage in pages to use `parseMarkdown` 
    // AND update `parseMarkdown` to handle emojis internally or via a callback? 
    // No, I'll just update `markdown.js` to handle emojis if simple strings.

    return <div className={className}>{markdownElements}</div>;
}

export default function EmojiDisplay({ emoji, className = "" }) {
    if (!emoji) return null;
    return parseAndRenderEmojis(emoji, className);
}
