'use client';

import React from 'react';

export interface TextCaptionProps {
  text: string;
  maxLines?: number;
  className?: string;
  expandable?: boolean;
  hashtags?: string[];
  mentions?: string[];
}

export const TextCaption: React.FC<TextCaptionProps> = ({
  text,
  maxLines = 2,
  className = '',
  expandable = true,
  hashtags = [],
  mentions = [],
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isTruncated, setIsTruncated] = React.useState(false);
  const textRef = React.useRef<HTMLParagraphElement>(null);

  React.useEffect(() => {
    if (textRef.current) {
      const lineHeight = parseInt(window.getComputedStyle(textRef.current).lineHeight);
      const maxHeight = lineHeight * maxLines;
      setIsTruncated(textRef.current.scrollHeight > maxHeight);
    }
  }, [text, maxLines]);

  const processText = (content: string) => {
    const words = content.split(' ');
    return words.map((word, index) => {
      if (word.startsWith('#') || hashtags.includes(word.replace('#', ''))) {
        return (
          <span
            key={index}
            className="text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline"
          >
            {word}{' '}
          </span>
        );
      }
      if (word.startsWith('@') || mentions.includes(word.replace('@', ''))) {
        return (
          <span
            key={index}
            className="text-primary-500 font-semibold cursor-pointer hover:underline"
          >
            {word}{' '}
          </span>
        );
      }
      return <span key={index}>{word} </span>;
    });
  };

  return (
    <div className={`text-sm ${className}`}>
      <p
        ref={textRef}
        className={`text-gray-900 dark:text-gray-100 leading-relaxed ${
          !isExpanded ? `line-clamp-${maxLines}` : ''
        }`}
        style={
          !isExpanded
            ? {
                WebkitLineClamp: maxLines,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
            : {}
        }
      >
        {processText(text)}
      </p>

      {expandable && isTruncated && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium mt-1 transition-colors"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

export default TextCaption;
