import { NextResponse } from "next/server";

const whisperApiEndpoint = "https://api.openai.com/v1/audio/";
const apiKey = process.env.OPENAI_API_KEY;

export async function POST(request: Request) {
  const formData = await request.formData();
  const blob = formData.get("file");
  const model = formData.get("model") as string;

  const body = new FormData();
  body.append("file", blob as any);
  body.append("model", model);
  body.append("language", "en");

  const headers = { Authorization: `Bearer ${apiKey}` };

  const res = await fetch(whisperApiEndpoint + "transcriptions", {
    method: "POST",
    headers,
    body,
  });
  const data = await res.json();
  console.log("whisper----", data);

  return NextResponse.json({ text: data.text });
}
