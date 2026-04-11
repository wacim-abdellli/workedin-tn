import { useEffect, useState, useRef } from 'react';

interface TypewriterTextProps {
  words: string[];
  speed?: number;
  deleteSpeed?: number;
  pauseMs?: number;
  className?: string;
  cursorClassName?: string;
  startIndex?: number;
  style?: React.CSSProperties;
}

export default function TypewriterText({
  words,
  speed = 65,
  deleteSpeed = 35,
  pauseMs = 2200,
  className = '',
  cursorClassName = '',
  startIndex = 0,
  style,
}: TypewriterTextProps) {
  const idx = startIndex % words.length;
  const [displayed, setDisplayed] = useState(words[idx]);
  const [wordIndex, setWordIndex] = useState(idx);
  // 'idle' = fully typed, waiting; 'deleting' = removing chars; 'typing' = adding chars
  const [phase, setPhase] = useState<'idle' | 'deleting' | 'typing'>('idle');
  const [showCursor, setShowCursor] = useState(true);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setShowCursor(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    clearTimeout(timeout.current);
    const current = words[wordIndex % words.length];

    if (phase === 'idle') {
      // Pause then start deleting
      timeout.current = setTimeout(() => setPhase('deleting'), pauseMs);
      return;
    }

    if (phase === 'deleting') {
      if (displayed.length === 0) {
        // Move to next word and start typing
        setWordIndex(i => (i + 1) % words.length);
        setPhase('typing');
        return;
      }
      timeout.current = setTimeout(() => {
        setDisplayed(d => d.slice(0, -1));
      }, deleteSpeed);
      return;
    }

    if (phase === 'typing') {
      if (displayed === current) {
        // Fully typed — go idle
        setPhase('idle');
        return;
      }
      timeout.current = setTimeout(() => {
        setDisplayed(current.slice(0, displayed.length + 1));
      }, speed);
      return;
    }
  }, [displayed, phase, wordIndex, words, speed, deleteSpeed, pauseMs]);

  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, '');

  return (
    <span style={{ display: 'inline-block', position: 'relative' }}>
      {/* Reserve space for longest word */}
      <span aria-hidden style={{ visibility: 'hidden', pointerEvents: 'none' }}>{longestWord}</span>
      {/* Actual text with gradient applied directly */}
      <span className={className} style={{ ...style, position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap' }}>
        {displayed}
        <span style={{ opacity: showCursor ? 1 : 0, transition: 'opacity 0.1s', marginLeft: 1 }} className={cursorClassName}>|</span>
      </span>
    </span>
  );
}
