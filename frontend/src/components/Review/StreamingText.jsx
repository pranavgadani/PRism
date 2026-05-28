import { useEffect, useRef } from 'react';

const StreamingText = ({ content, isStreaming }) => {
  const endRef = useRef(null);

  useEffect(() => {
    if (isStreaming) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [content, isStreaming]);

  return (
    <div style={{
      fontFamily: "'Inter', sans-serif",
      fontSize: '0.875rem',
      lineHeight: 1.7,
      color: 'var(--text-primary)',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }}>
      {content}
      {isStreaming && (
        <span style={{
          display: 'inline-block',
          width: 2,
          height: '1em',
          background: 'var(--accent-purple-light)',
          marginLeft: 2,
          verticalAlign: 'text-bottom',
          animation: 'blink 1s step-end infinite',
        }} />
      )}
      <div ref={endRef} />
    </div>
  );
};

export default StreamingText;
