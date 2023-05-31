import { NextResponse } from "next/server";
import { createClient } from "redis";
import { ChatAnthropic } from "langchain/chat_models/anthropic";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { RedisChatMessageHistory } from "langchain/stores/message/redis";

import { InterviewReqBody } from "@/types/interview";
import { aiRole, askingArt, userDefaultKickOff } from "@/prompts/precondition";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  AIMessagePromptTemplate,
  HumanMessagePromptTemplate,
  PromptTemplate,
} from "langchain/prompts";
import { AIChatMessage } from "langchain/schema";
import {
  QUESTION_COUNT,
  ROUNDS_FOR_EACH_QUESTION,
} from "@/constants/interviewConfig";
import {
  startFollowUpQuestion,
  startNextQuestion,
  userConsent,
} from "@/prompts/followUp";

const chat = new ChatAnthropic({
  modelName: "claude-instant-v1",
  temperature: 1,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

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

const checkCanAskNextQuestion = (interviewStep: [number, number]) => {
  const [questionIndex] = interviewStep;
  return questionIndex <= QUESTION_COUNT - 1;
};

const checkCanAskNextRound = (interviewStep: [number, number]) => {
  const [, roundIndex] = interviewStep;
  return roundIndex <= ROUNDS_FOR_EACH_QUESTION - 1;
};

const getCandidateInfos = (options: InterviewReqBody["options"]) => {
  const { jobTitle, workingYear, countryOrRegion, resume } = options || {};
  return (
    `${aiRole} ${askingArt}
    ${userDefaultKickOff}` +
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
    const bufferMemory = new BufferMemory({
      inputKey: "humanInput",
      returnMessages: true,
      chatHistory: new RedisChatMessageHistory({
        sessionId:
          request.headers.get("Interview-Id") || new Date().toISOString(),
        sessionTTL: 300,
        client,
      }),
    });

    const chain = new ConversationChain({
      memory: bufferMemory,
      prompt: ChatPromptTemplate.fromPromptMessages([
        HumanMessagePromptTemplate.fromTemplate("{humanInput}"),
      ]),
      llm: chat,
    });

    let res: string;
    if (tryToKickOffInterview(interviewStep, options)) {
      res = (await chain.call({ humanInput: getCandidateInfos(options) }))
        ?.response;
    } else {
      let humanInput = `This is my answer: <answer>${human}</answer>. `;
      if (checkCanAskNextRound(interviewStep)) {
        humanInput += startFollowUpQuestion;
      } else if (checkCanAskNextQuestion(interviewStep)) {
        humanInput += startNextQuestion;
      }
      humanInput += `(REMEMBER: <tip>${askingArt}</tip>)`;
      res = (await chain.call({ humanInput }))?.response;
    }
    return NextResponse.json({ error: "", text: res });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
