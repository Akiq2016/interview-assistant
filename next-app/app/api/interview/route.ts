import { NextResponse } from "next/server";
import { createClient } from "redis";
import { ChatAnthropic } from "langchain/chat_models/anthropic";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { RedisChatMessageHistory } from "langchain/stores/message/redis";

import { candidateInfo, InterviewReqBody } from "@/types/interview";
import { aiRole, askingArt, userDefaultKickOff } from "@/prompts/precondition";
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
} from "langchain/prompts";
import {
  QUESTION_COUNT,
  ROUNDS_FOR_EACH_QUESTION,
} from "@/constants/interviewConfig";
import {
  askForEvaluation,
  EndInterview,
  startFollowUpQuestion,
  startNextQuestion,
} from "@/prompts/followUp";

const chat = new ChatAnthropic({
  modelName: "claude-instant-v1",
  temperature: 0,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

const client = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

const checkCanAskNextQuestion = (interviewStep: [number, number]) => {
  const [questionIndex] = interviewStep;
  return questionIndex <= QUESTION_COUNT - 1;
};

const checkCanAskNextRound = (interviewStep: [number, number]) => {
  const [, roundIndex] = interviewStep;
  return roundIndex <= ROUNDS_FOR_EACH_QUESTION - 1;
};

const checkIsLastQuestionLastRound = (interviewStep: [number, number]) => {
  const [questionIndex, roundIndex] = interviewStep;
  return (
    questionIndex === QUESTION_COUNT &&
    roundIndex === ROUNDS_FOR_EACH_QUESTION
  );
};

const getCandidateInfos = (options: candidateInfo) => {
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
  const req: InterviewReqBody = await request.json();

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

    let res: string = '';
    let end = false;
    if (req.status === "start") {
      res = (await chain.call({ humanInput: getCandidateInfos(req.options) }))
        ?.response;
    } else if (req.status === "interviewing") {
      let humanInput = `This is my answer: <answer>${req.human}</answer>. `;
      let askingTips = `(REMEMBER: <tip>${askingArt}</tip>)`;
      if (checkCanAskNextRound(req.interviewStep)) {
        humanInput += `${startFollowUpQuestion} ${askingTips}`;
      } else if (checkCanAskNextQuestion(req.interviewStep)) {
        humanInput += `${startNextQuestion} ${askingTips}`;
      } else if (checkIsLastQuestionLastRound(req.interviewStep)) {
        humanInput += `${EndInterview} ${askForEvaluation}`;
        end = true;
      }
      res = (await chain.call({ humanInput }))?.response;
    }
    return NextResponse.json({ error: "", text: res, end });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
