import { useEffect, useRef, useState } from "react";

type UseCountdownOptions = {
  onEnd?: () => void;
  autoStart?: boolean;
};

const useCountdown = (
  seconds: number,
  { onEnd, autoStart }: UseCountdownOptions
) => {
  const [countDown, setCountDown] = useState(seconds);
  const [isStart, setIsStart] = useState(autoStart);

  useEffect(() => {
    if (!isStart) return;

    const interval = setInterval(() => {
      setCountDown((prev) => {
        if (prev === 0) {
          onEnd?.();
          setIsStart(false);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onEnd, isStart]);

  const start = () => {
    setCountDown(seconds);
    setIsStart(true);
  };

  const stop = () => {
    setCountDown(0);
  };

  return {
    countDown,
    isStart,
    start,
    stop,
  };
};

export function format(time: number) {
  const remainMinutes = Math.floor(time / 60);
  const remainSeconds = Math.floor(time % 60);
  return {
    m: `${remainMinutes}`.padStart(2, "0"),
    s: `${remainSeconds}`.padStart(2, "0"),
  };
}

export { useCountdown };
