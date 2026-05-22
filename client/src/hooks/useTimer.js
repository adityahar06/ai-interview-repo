import { useState, useEffect, useRef, useCallback } from 'react';

const useTimer = (initialSeconds = 120, onExpire) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const start = useCallback(() => {
    setIsRunning(true);
    startTimeRef.current = Date.now() - elapsed * 1000;
  }, [elapsed]);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback((newSeconds = initialSeconds) => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setTimeLeft(newSeconds);
    setElapsed(0);
    startTimeRef.current = null;
  }, [initialSeconds]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const newElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const newTimeLeft = Math.max(0, initialSeconds - newElapsed);
        setElapsed(newElapsed);
        setTimeLeft(newTimeLeft);

        if (newTimeLeft === 0) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          onExpire && onExpire(newElapsed);
        }
      }, 500);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, initialSeconds, onExpire]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const percentage = ((initialSeconds - timeLeft) / initialSeconds) * 100;
  const isWarning = timeLeft <= 30 && timeLeft > 10;
  const isDanger = timeLeft <= 10;

  return { timeLeft, elapsed, isRunning, start, pause, reset, formatTime, percentage, isWarning, isDanger };
};

export default useTimer;
