import { useWhisper } from "@hzstudio/use-whisper";

import { VoiceIcon, LoadbarSound } from "@/components/Icons";

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
    pauseRecording,
    startRecording,
    stopRecording,
  } = useWhisper({
    onTranscribe,
    // removeSilence: true,
    streaming: true,
    timeSlice: 1000,
    // nonStop: true,
    // stopTimeout: 3000,
    whisperConfig: {
      language: "en",
    },
  });

  return (
    <>
      <div className="border rounded p-4 mt-4 flex w-full">
        <div className="flex-grow">
          <p className="border border-dashed rounded p-2 m-2">
            {transcript.text}
          </p>
          <div className="flex">
            <p>Recording: {recording ? "..." : ""}</p>
            <p>Speaking: {speaking ? "..." : ""}</p>
            <p>Transcribing: {transcribing ? "..." : ""}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button className="border" onClick={() => startRecording()}>
            {recording ? <LoadbarSound /> : <VoiceIcon />}
          </button>
          <button className="border" onClick={() => stopRecording()}>
            Stop
          </button>
          {/* <button className="border" onClick={() => pauseRecording()}>Pause</button> */}
        </div>
      </div>
    </>
  );
}
