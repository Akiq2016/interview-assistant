import { NextResponse } from "next/server";
import { Blob } from "node:buffer";
import pdf from "pdf-parse/lib/pdf-parse";

const parseForm = async (req: Request) => {
  return new Promise<Record<string, Buffer>>(async (resolve) => {
    let endBuffers: Record<string, Buffer> = {};

    // Get formData from request
    const formData = await req.formData();

    // Get file from formData
    const file = formData.get("file");

    if (file instanceof Blob) {
      // Convert file to stream
      const stream = file.stream();
      const chunks: Uint8Array[] = [];
      let totalLength = 0;

      const reader = stream.getReader();

      const pushChunk = (chunk: Uint8Array): void => {
        chunks.push(chunk);
        totalLength += chunk.length;
      };

      const readChunks = async (): Promise<void> => {
        const { done, value } = await reader.read();
        if (done) {
          const buffer = Buffer.concat(chunks, totalLength);
          endBuffers["pdfContent"] = buffer;
          resolve(endBuffers);
          return;
        }
        pushChunk(value);
        return readChunks();
      };

      readChunks();
    }
  });
};

export async function POST(request: Request) {
  try {
    const { pdfContent } = await parseForm(request);
    const { text } = await pdf(pdfContent);
    return NextResponse.json({ text });
  } catch (error) {
    console.log(error);
    return NextResponse.json({}, { status: 500 });
  }
}
