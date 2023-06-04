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
  const autoStartRef = useRef(autoStart);

  useEffect(() => {
    if (!autoStartRef.current) return;

    const interval = setInterval(() => {
      setCountDown((prev) => {
        if (prev === 0) {
          onEnd?.();
          autoStartRef.current = false;
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onEnd]);

  const start = () => {
    autoStartRef.current = true;
    setCountDown(seconds);
  };

  const stop = () => {
    setCountDown(0);
  };

  return {
    countDown,
    isStart: autoStartRef.current,
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
