import { useState, useEffect, useRef, useCallback } from 'react';
// why u have written this?
// 1st reason 
// is that This is exactly what happens when the user opens a new tab (like going to Google to cheat on the interview question). 
// The browser puts your React app to "sleep" to save battery. Your setCount interval stops running.
//  A 2-minute test might actually give the user 4 minutes to answer.
// 2nd reason
// This is what Date.now() does inside your custom hook. It doesn't matter if the browser lags, if the user opens a new tab, or if their
//  computer temporarily freezes. By anchoring your timer to the actual system clock (Date.now() - startTimeRef), 
// your app becomes bulletproof.
const useTimer = (initialSeconds = 120, onExpire) => {
  // Tracks the countdown
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  // Tracks if the clock is currently ticking or paused
  const [isRunning, setIsRunning] = useState(false);
  // Tracks how many seconds have passed since we hit start
  const [elapsed, setElapsed] = useState(0);
  // setInterval works the exact same way. When you start a loop, JavaScript hands you back a "ticket number" (an ID, which is usually just a random number like 1, 42, or 105).
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
// intervalRef quietly holds the ID of the running background engine so we can turn it off later.
// startTimeRef quietly holds the exact system timestamp of when the user clicked "Start".
// usecallback()=Wraps the function so React doesn't recreate this function every single time the screen renders.
  const start = useCallback(() => {
    setIsRunning(true);
    // we have used here a brilliant feature as like date.now() gives us the current time form januray 1st 1970 of starting yar and convert it into milliseconds
    //  and elapsed we used here means hwo much the tiem have elasped if user pause in between and starts again so date.now() will give the currrent time but only 10 sec has passed for eg 
    // so it should be stored somewhere
    //This is the genius part. It grabs the exact time right now. If you had paused the timer after 10 seconds (elapsed), it multiplies 10 by 1000 (to get milliseconds) and subtracts it
    //  from right now. This effectively pushes the "start time" 10 seconds into the past so the timer 
    // resumes perfectly where it left off.
    startTimeRef.current = Date.now() - elapsed * 1000;
  }, [elapsed]);
// The pause function handles the cleanup of the timer. First, it updates the local state to reflect the paused UI. More importantly, it calls the native clearInterval API
//  using the reference ID we safely stored in our useRef. This physically stops the JavaScript event loop from executing
//  the timer callback. I also wrapped the entire function in a useCallback with an empty dependency array to 
// guarantee referential stability, ensuring it doesn't cause unnecessary re-renders if passed down to child button components
  const pause = useCallback(() => {
    setIsRunning(false);
    //Finds the background loop using the ID we saved in intervalRef and violently kills it so it stops counting.
    clearInterval(intervalRef.current);
  }, []);
// this is reset function when user resets the timer
// reset all elapsed to 0, timeleft to intitla seconds to 120 
  const reset = useCallback((newSeconds = initialSeconds) => {
    clearInterval(intervalRef.current);
    setIsRunning(false);
    setTimeLeft(newSeconds);
    setElapsed(0);
    startTimeRef.current = null;
    //So, the dependency array is basically a list of variables that the function relies on. If any variable in that list changes, React refreshes the function so it doesn't use old, outdated data!
  }, [initialSeconds]);

  useEffect(() => {
    // If the user has clicked "Start" (isRunning is true), it turns on the engine. It runs the code inside it every 
    // 500 milliseconds. (Running it twice a second guarantees the screen updates smoothly without visually skipping any 
    // seconds).
    if (isRunning) {
      // We create a loop using setInterval and save its ID into intervalRef.current.
      intervalRef.current = setInterval(() => {
        // Every 500ms, it asks the system for the exact time right now (Date.now()), subtracts the anchor time, and divides by 1000 to get the exact real-world seconds passed.
        // Math.max(0, ...) is a safety guard. It says: "If the time left drops below zero, just freeze it at 0." This prevents your clock from showing -1 or -2.
        const newElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        //It subtracts the passed time from the starting time (120 - 10 = 110 seconds left). Math.max(0, ...) guarantees that if the math results in -5, it will just choose 0 instead so the timer doesn't show negative numbers.
        const newTimeLeft = Math.max(0, initialSeconds - newElapsed);
        setElapsed(newElapsed);
        setTimeLeft(newTimeLeft);
        if (newTimeLeft === 0) {
          clearInterval(intervalRef.current);
          setIsRunning(false);
          // onExpire is a callback function that you (the developer) pass into the timer when you first create it.
          onExpire && onExpire(newElapsed);
        }
        // If you tell the loop to run every 1000 milliseconds (1 second), the browser might lag slightly
        //  and take 1005 milliseconds. Over time, this lag builds up, and the user's timer on the
        //  screen might visually skip a second (going from 10 directly down to 8). By running the 
        // loop twice a second (500ms), we guarantee the screen updates smoothly and never misses 
        // drawing a second on the screen.
      }, 500);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, initialSeconds, onExpire]);
// If your timer has 125 seconds left, the user doesn't want to see "125". They want to see "02:05".
// 125/60 gives the minutes,125%60 gives the seconds
// we sued pad satrt .padStart(2, '0') forces single digits to have a zero in front (turning 5 into 05).
//  It tells JavaScript to add padding until the string is exactly 2 characters long taht is 2 there in pad atart
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
// check the percentage
// if between 11 to 30
// if less than 30
  const percentage = ((initialSeconds - timeLeft) / initialSeconds) * 100;
  const isWarning = timeLeft <= 30 && timeLeft > 10;
  const isDanger = timeLeft <= 10;

  return { timeLeft, elapsed, isRunning, start, pause, reset, formatTime, percentage, isWarning, isDanger };
};

export default useTimer;
