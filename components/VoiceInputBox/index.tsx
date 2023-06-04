import { useEffect, useRef, useState } from "react";
import { useWhisper } from "@hzstudio/use-whisper";

import { MicIcon, EarIcon, SendIcon, LoadbarSound } from "@/components/Icons";
import LoadingDots from "@/components/LoadingDots";
import { useCountdown, format } from "@/hooks/useCountdown";
import { useAutosizeTextArea } from "@/hooks/useAutosizeTextArea";

const onTranscribe = async (blob: Blob) => {
  const file = new File([blob], "speech.mp3", { type: "audio/mpeg" });

  const body = new FormData();
  body.append("file", file);
  body.append("model", "whisper-1");

  const response = await fetch("/api/whisper", {
    method: "POST",
    body,
  });
  const { text } = await response.json();
  return {
    blob,
    text,
  };
};

interface VoiceInputBoxProps {
  isLoading?: boolean;
  onSend?: (text?: string) => void;
}
export default function VoiceInputBox({
  isLoading,
  onSend,
}: VoiceInputBoxProps) {
  const [value, setValue] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  useAutosizeTextArea(textAreaRef.current, value);

  const {
    recording,
    speaking,
    transcribing,
    transcript,
    startRecording,
    stopRecording,
  } = useWhisper({
    onTranscribe,
    // streaming: true,
    // timeSlice: 2000,
    nonStop: true,
    stopTimeout: 2500,
    whisperConfig: {
      language: "en",
    },
  });

  useEffect(() => {
    setValue((prev) => prev + (transcript.text ?? ""));
  }, [transcript.text]);

  const handleStartRecording = () => {
    startRecording();
    start();
  };
  const onEnd = () => {
    stopRecording();
  };

  const { countDown, start, stop, isStart } = useCountdown(30, {
    autoStart: false,
    onEnd,
  });
  const { m, s } = format(countDown);

  const handleSend = () => {
    onSend?.(value);
    setValue("");
  };

  useEffect(() => {
    if (!isStart) return;
    const tick = setTimeout(() => {
      if (!recording) {
        stop();
      }
    }, 100);
    return () => clearTimeout(tick);
  }, [recording, stop, isStart]);

  const handleEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.shiftKey === false) {
      handleSend();
    }
  };

  const handleChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = evt.target?.value;

    setValue(val);
  };

  return (
    <>
      <div className="border border-slate-300 rounded p-2 mt-4 flex w-full gap-2">
        <div className="flex-grow">
          <p>
            <textarea
              className="w-full h-full bg-transparent resize-none px-4 py-2 border border-dashed rounded outline-none ring-slate-300 focus:ring disabled:opacity-50"
              ref={textAreaRef}
              onKeyDown={handleEnter}
              disabled={recording || transcribing || speaking}
              autoFocus={false}
              rows={3}
              value={value}
              onChange={handleChange}
              spellCheck={true}
              lang="en"
              placeholder={isLoading ? "Waiting for response..." : ""}
            />
          </p>
          <div className="flex justify-left py-2">
            <p className="flex items-center mr-8">
              <span className="text-slate-500 mr-2">Speaking:</span>
              {speaking ? (
                <IconButton className="text-red-500">
                  <LoadbarSound />
                </IconButton>
              ) : (
                <span className="text-slate-300">None</span>
              )}
            </p>
            <p className="flex items-center">
              <span className="text-slate-500 mr-2">Transcribing:</span>
              {transcribing ? (
                <IconButton>
                  <LoadingDots color="#f00" />
                </IconButton>
              ) : (
                <span className="text-slate-300">None</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col w-10 items-center text-slate-500">
          {isLoading ? (
            <IconButton>
              <LoadingDots color="#000" />
            </IconButton>
          ) : (
            <>
              <IconButton onClick={handleSend}>
                <SendIcon />
              </IconButton>
              <IconButton onClick={handleStartRecording}>
                {recording ? <EarIcon /> : <MicIcon />}
              </IconButton>
              {countDown > 0 && isStart ? (
                <div
                  className={`text-right text-xs px-1 ${
                    countDown < 5 ? "text-red-500" : ""
                  }`}
                >
                  {m}:{s}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}

const IconButton = ({
  children,
  ...props
}: {
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<"button">) => (
  <button
    type="button"
    className="flex justify-center items-center w-8 h-8 p-1 hover:bg-slate-100 hover:rounded"
    {...props}
  >
    {children}
  </button>
);
