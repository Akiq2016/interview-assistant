import { useEffect, useRef } from "react";
import { useWhisper } from "@hzstudio/use-whisper";

import {
  MicIcon,
  EarIcon,
  SendIcon,
  LoadbarDoc,
  LoadbarSound,
} from "@/components/Icons";

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

export default function VoiceInputBox() {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { recording, speaking, transcribing, transcript, startRecording } =
    useWhisper({
      onTranscribe,
      streaming: true,
      timeSlice: 1000,
      nonStop: true,
      stopTimeout: 2000,
      whisperConfig: {
        language: "en",
      },
    });

  useEffect(() => {
    if (textAreaRef.current && transcript.text) {
      textAreaRef.current.value = transcript.text;
    }
  }, [transcript.text]);

  return (
    <>
      <div className="border rounded p-2 mt-4 flex w-full gap-2">
        <div className="flex-grow">
          <p className="border border-dashed rounded p-2">
            <textarea
              className="w-full h-full bg-transparent resize-none"
              ref={textAreaRef}
              disabled={recording}
              autoFocus={false}
              rows={3}
            >
              {transcript.text}
            </textarea>
          </p>
          <div className="flex justify-left py-2">
            <p className="flex items-center mr-8">
              <span className="text-slate-400 mr-2">Speaking:</span>
              {speaking ? (
                <IconButton>
                  <LoadbarSound />
                </IconButton>
              ) : (
                <span>None</span>
              )}
            </p>
            <p className="flex items-center">
              <span className="text-slate-400 mr-2">Transcribing:</span>
              {transcribing ? (
                <IconButton>
                  <LoadbarDoc />
                </IconButton>
              ) : (
                <span>None</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <IconButton onClick={() => startRecording()}>
            {recording ? <EarIcon /> : <MicIcon />}
          </IconButton>
          <IconButton>
            <SendIcon />
          </IconButton>
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
  <button className="flex justify-center items-center w-8 h-8 p-1" {...props}>
    {children}
  </button>
);
