import { useWhisper } from "@hzstudio/use-whisper";

import {
  MicIcon,
  PlayButton,
  PauseButton,
  Loadbar,
  LoadbarAlt,
  LoadbarDoc,
  LoadbarSound,
} from "@/components/Icons";

export default function VoiceInputBox() {
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

  const {
    recording,
    speaking,
    transcribing,
    transcript,
    startRecording,
    pauseRecording,
    stopRecording,
  } = useWhisper({
    onTranscribe,
    streaming: true,
    timeSlice: 1000,
    nonStop: true,
    stopTimeout: 2000,
    whisperConfig: {
      language: "en",
    },
  });

  return (
    <>
      <div className="border rounded p-2 mt-4 flex w-full gap-2">
        <div className="flex-grow">
          <p className="border border-dashed rounded p-2">{transcript.text}</p>
          {/* <div className="flex">
            <p>Recording: {recording ? "..." : ""}</p>
            <p>Speaking: {speaking ? "..." : ""}</p>
            <p>Transcribing: {transcribing ? "..." : ""}</p>
          </div> */}
        </div>
        <div className="flex flex-col gap-2">
          <IconButton onClick={() => startRecording()}>
            {recording ? <LoadbarSound /> : <MicIcon />}
          </IconButton>
          <IconButton>
            <Loadbar />
          </IconButton>
          <IconButton>
            <LoadbarAlt />
          </IconButton>
          <IconButton>
            <LoadbarDoc />
          </IconButton>
          <IconButton>
            <LoadbarSound />
          </IconButton>
          <IconButton>
            <PlayButton />
          </IconButton>
          <IconButton>
            <PauseButton />
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
