import { useEffect, useState, useRef } from 'react';

interface TypewriterTextProps {
  words: string[];
  speed?: number;
  deleteSpeed?: number;
  pauseMs?: number;
  className?: string;
  cursorClassName?: string;
  startIndex?: number; // which word to start from
}

export default function TypewriterText({
  words,
  speed = 65,
  deleteSpeed = 35,
  pauseMs = 2200,
  className = '',
  cursorClassName = '',
  startIndex = 0,
}: TypewriterTextProps) {
  const firstWord = words[startIndex % words.length];
  const [displayed, setDisplayed] = useState(firstWord);
  const [wordIndex, setWordIndex] = useState(startIndex);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(true); // start paused on first word
  const [showCursor, setShowCursor] = useState(true);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setShowCursor(v => !v), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const current = words[wordIndex % words.length];

    // Initial pause on first word before starting to delete
    if (isPaused) {
      timeout.current = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true); // start by deleting the initial word
      }, pauseMs);
      return;
    }

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
  }, [displayed, isDeleting, wordIndex, words, speed, deleteSpeed, pauseMs, isPaused]);

  // Reserve height based on longest word to prevent layout shift
  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, '');

  return (
    <span className={className} style={{ display: 'inline-block', position: 'relative' }}>
      {/* Invisible longest word to reserve space */}
      <span aria-hidden style={{ visibility: 'hidden', pointerEvents: 'none' }}>{longestWord}</span>
      {/* Actual typewriter text overlaid */}
      <span style={{ position: 'absolute', left: 0, top: 0, whiteSpace: 'nowrap' }}>
        {displayed}
        <span
          className={cursorClassName}
          style={{ opacity: showCursor ? 1 : 0, transition: 'opacity 0.1s', marginLeft: 1 }}
        >|</span>
      </span>
    </span>
  );
}
