import React from 'react';

export const parseMarkdown = (text) => {
    if (!text) return <span className="text-gray-500 italic">Example content...</span>;

    // Split by newlines to handle block level elements first
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
        // Handle Blockquotes (> text)
        if (line.trim().startsWith('>')) {
            return (
                <div key={lineIndex} className="flex gap-2 my-1 pl-1">
                    <div className="w-1 bg-[#4e5058] rounded-full shrink-0"></div>
                    <div className="text-gray-300 opacity-90 break-words w-full">
                        {parseInline(line.replace(/^>\s?/, ''))}
                    </div>
                </div>
            );
        }

        // Handle Code Blocks (```) - simplified for preview
        if (line.trim().startsWith('```')) {
            return <div key={lineIndex} className="bg-[#2b2d31] p-2 rounded text-xs font-mono my-1 border border-[#1e1f22] overflow-x-auto whitespace-pre">{parseInline(line.replace(/```/g, ''))}</div>;
        }

        // Standard Line
        return (
            <div key={lineIndex} className="min-h-[1.2rem] whitespace-pre-wrap break-words">
                {line.trim() === '' ? <br /> : parseInline(line)}
            </div>
        );
    });
};

const parseInline = (text) => {
    if (!text) return null;

    // Regex breakdown:
    // 1. Headers: # H1, ## H2, ### H3 (Start of line)
    // 2. Subtext: -# Text (Start of line)
    // 3. List: - Text (Start of line)
    // 4. Links: [text](url)
    // 5. Code block: `text`
    // 6. Bold: **text**
    // 7. Underline: __text__
    // 8. Strikethrough: ~~text~~
    // 9. Italic: *text* or _text_
    // 10. Spoiler: ||text||
    // 11. Custom Emoji: <a:name:id> or < :name:id >
    // 12. Role/User Mention: <@&id> or <@id> or <@!id>
    // 13. Channel Mention: <#id>
    const regex = /(^#{1,3}\s+.*$|^-\s+.*$|^#-\s+.*$|\[.+?\]\(.+?\) |`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*[^*]+\*|\|\|[^|]+\|\||<a?:.+?:\d{17,20}>|<@&?\d{17,20}>|<#\d{17,20}>)/gm;

    // Split needs to capture the delimiters to keep them
    const parts = text.split(regex);

    return parts.map((part, index) => {
        if (!part) return null;

        // Headers
        if (part.trim().startsWith('# ')) {
            return <h1 key={index} className="text-xl font-bold border-b border-gray-600 pb-1 mb-2 mt-2">{parseInline(part.replace(/^#\s+/, ''))}</h1>;
        }
        if (part.trim().startsWith('## ')) {
            return <h2 key={index} className="text-lg font-bold border-b border-gray-600 pb-1 mb-2 mt-2">{parseInline(part.replace(/^##\s+/, ''))}</h2>;
        }
        if (part.trim().startsWith('### ')) {
            return <h3 key={index} className="text-base font-bold mb-1 mt-2">{parseInline(part.replace(/^###\s+/, ''))}</h3>;
        }

        // Subtext (-#)
        if (part.trim().startsWith('-# ')) {
            return <div key={index} className="text-xs text-gray-400 font-medium">{parseInline(part.replace(/^-#\s+/, ''))}</div>;
        }

        // Lists
        if (part.trim().startsWith('- ')) {
            return (
                <div key={index} className="flex gap-2 my-1 pl-2">
                    <span className="text-gray-400">•</span>
                    <div>{parseInline(part.replace(/^-\s+/, ''))}</div>
                </div>
            );
        }

        // Links
        const linkMatch = part.match(/^\[(.+?)\]\((.+?)\)/);
        if (linkMatch) {
            return <a key={index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-[#00b0f4] hover:underline" onClick={e => e.preventDefault()}>{linkMatch[1]}</a>;
        }

        // Code
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={index} className="bg-[#2b2d31] px-1.5 py-0.5 rounded text-[85%] font-mono mx-0.5 align-middle">{part.slice(1, -1)}</code>;
        }

        // Bold
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
        }

        // Underline
        if (part.startsWith('__') && part.endsWith('__')) {
            return <u key={index} className="underline decoration-current">{part.slice(2, -2)}</u>;
        }

        // Strikethrough
        if (part.startsWith('~~') && part.endsWith('~~')) {
            return <s key={index} className="line-through">{part.slice(2, -2)}</s>;
        }

        // Italic
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index} className="italic">{part.slice(1, -1)}</em>;
        }

        // Spoiler
        if (part.startsWith('||') && part.endsWith('||')) {
            return <span key={index} className="bg-[#1e1f22] text-transparent rounded px-1 select-none hover:text-inherit hover:bg-gray-800 transition-colors cursor-pointer">{part.slice(2, -2)}</span>;
        }

        // Custom Emoji
        if (/<a?:.+?:\d{17,20}>/.test(part)) {
            // Extract ID and animated status
            const isAnimated = part.startsWith('<a:');
            const match = part.match(/:(\d{17,20})>/);
            if (match) {
                const id = match[1];
                const ext = isAnimated ? 'gif' : 'png';
                const url = `https://cdn.discordapp.com/emojis/${id}.${ext}`;
                return (
                    <img
                        key={index}
                        src={url}
                        alt="emoji"
                        className="inline-block w-5 h-5 align-middle mx-0.5 object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                );
            }
        }

        // Mentions (User/Role)
        if (part.startsWith('<@') && part.endsWith('>')) {
            return <span key={index} className="bg-[#6a0dad]/30 text-[#dee0fc] px-1 rounded hover:bg-[#6a0dad]/50 cursor-pointer font-medium transition-colors">@{part.includes('&') ? 'Role' : 'User'}</span>;
        }

        // Mentions (Channel)
        if (part.startsWith('<#') && part.endsWith('>')) {
            return <span key={index} className="bg-[#6a0dad]/30 text-[#dee0fc] px-1 rounded hover:bg-[#6a0dad]/50 cursor-pointer font-medium transition-colors">#channel</span>;
        }

        // Plain text
        return part;
    });
};
