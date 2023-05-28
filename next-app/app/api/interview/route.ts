import { NextResponse } from "next/server";
import { createClient } from "redis";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { RedisChatMessageHistory } from "langchain/stores/message/redis";

import { InterviewReqBody } from "@/types/interview";
import { userDefaultKickOff } from "@/prompts/precondition";

const chat = new ChatOpenAI({ modelName: "gpt-3.5-turbo", temperature: 1 });
const client = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

const tryToKickOffInterview = (
  interviewStep: InterviewReqBody["interviewStep"],
  options: InterviewReqBody["options"]
) => {
  return (
    interviewStep[0] === 1 &&
    interviewStep[1] === 0 &&
    Object.keys(options || {})
  );
};

const getCandidateInfos = (options: InterviewReqBody["options"]) => {
  const { jobTitle, workingYear, countryOrRegion, resume } = options || {};
  return (
    userDefaultKickOff +
    (jobTitle ? `I’m looking to find a ${jobTitle} role. ` : "") +
    (workingYear ? `I have ${workingYear} years of working experience. ` : "") +
    (countryOrRegion ? `My preferred location is ${countryOrRegion}.` : "") +
    (resume
      ? `Here is my resume in <content> tags: <content>${resume}</content>`
      : "")
  );
};

export async function POST(request: Request) {
  const { human, options, interviewStep }: InterviewReqBody =
    await request.json();

  try {
    const chain = new ConversationChain({
      memory: new BufferMemory({
        chatHistory: new RedisChatMessageHistory({
          sessionId: request.headers.get("Interview-Id") || new Date().toISOString(),
          sessionTTL: 300,
          client,
        }),
      }),
      llm: chat,
    });

    const { response } = await chain.call({
      input: tryToKickOffInterview(interviewStep, options)
        ? getCandidateInfos(options)
        : human,
    });
    return NextResponse.json({ error: "", text: response });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
