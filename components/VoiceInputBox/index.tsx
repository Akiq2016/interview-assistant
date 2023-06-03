import { useWhisper } from "@chengsokdara/use-whisper";

export default function VoiceInputBox() {
  const {
    recording,
    speaking,
    transcribing,
    transcript,
    pauseRecording,
    startRecording,
    stopRecording,
  } = useWhisper({
    apiKey: "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", // YOUR_OPEN_AI_TOKEN
    removeSilence: true,
    streaming: true,
    timeSlice: 1000,
    nonStop: true,
    stopTimeout: 3000,
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
            Voice {recording ? "..." : ""}
          </button>
          <button className="border" onClick={() => stopRecording()}>
            Stop
          </button>
          {/* <button className="border" onClick={() => startRecording()}>
<svg width="800px" height="800px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM13.2631 11.7368C13.2631 12.6105 12.5578 13.3158 11.6842 13.3158C10.8105 13.3158 10.1052 12.6105 10.1052 11.7368V8.57895C10.1052 7.70526 10.8105 7 11.6842 7C12.5578 7 13.2631 7.70526 13.2631 8.57895V11.7368ZM11.6842 8.05265C11.3947 8.05265 11.1579 8.28949 11.1579 8.57897V11.7369C11.1579 12.0263 11.3947 12.2632 11.6842 12.2632C11.9789 12.2632 12.2105 12.0316 12.2105 11.7369V8.57897C12.2105 8.28949 11.9736 8.05265 11.6842 8.05265ZM15.3684 11.7368H14.4737C14.4737 13.3158 13.1368 14.421 11.6842 14.421C10.2316 14.421 8.89474 13.3158 8.89474 11.7368H8C8 13.5316 9.43158 15.0158 11.1579 15.2737V17H12.2105V15.2737C13.9368 15.0158 15.3684 13.5316 15.3684 11.7368Z" fill="#000000"/>
</svg>
             {recording ? '...':''}</button> */}
          {/* <button className="border" onClick={() => pauseRecording()}>Pause</button> */}
        </div>
      </div>
    </>
  );
}
