import { useEffect, useState, useRef } from 'react';

interface TypewriterTextProps {
  words: string[];
  speed?: number;       // ms per char
  deleteSpeed?: number; // ms per char delete
  pauseMs?: number;     // pause between words
  className?: string;
  cursorClassName?: string;
}

export default function TypewriterText({
  words,
  speed = 80,
  deleteSpeed = 40,
  pauseMs = 1800,
  className = '',
  cursorClassName = '',
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setShowCursor(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const current = words[wordIndex % words.length];

    if (!isDeleting && displayed === current) {
      timeout.current = setTimeout(() => setIsDeleting(true), pauseMs);
      return;
    }

    if (isDeleting && displayed === '') {
      setIsDeleting(false);
      setWordIndex(i => i + 1);
      return;
    }

    const delay = isDeleting ? deleteSpeed : speed;
    timeout.current = setTimeout(() => {
      setDisplayed(isDeleting
        ? current.slice(0, displayed.length - 1)
        : current.slice(0, displayed.length + 1)
      );
    }, delay);

    return () => clearTimeout(timeout.current);
  }, [displayed, isDeleting, wordIndex, words, speed, deleteSpeed, pauseMs]);

  return (
    <span className={className}>
      {displayed}
      <span
        className={cursorClassName}
        style={{ opacity: showCursor ? 1 : 0, transition: 'opacity 0.1s' }}
      >|</span>
    </span>
  );
}
