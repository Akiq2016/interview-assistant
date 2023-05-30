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
import { QUESTION_COUNT, ROUNDS_FOR_EACH_QUESTION } from "@/constants/interviewConfig";

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
}

const checkCanAskNextRound = (interviewStep: [number, number]) => {
  const [, roundIndex] = interviewStep;
  return roundIndex <= ROUNDS_FOR_EACH_QUESTION - 1;
}

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

  const template = "What is a good name for a company that makes {product}?";
  const prompt = new PromptTemplate({ template, inputVariables: ["product"] });
  const aiMessagePrompt = new AIMessagePromptTemplate(prompt);
  try {
    const chain = new ConversationChain({
      memory: new BufferMemory({
        chatHistory: new RedisChatMessageHistory({
          sessionId:
            request.headers.get("Interview-Id") || new Date().toISOString(),
          sessionTTL: 300,
          client,
        }),
      }),
      prompt: ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(`${aiRole} ${askingArt}`),
        aiMessagePrompt,
        HumanMessagePromptTemplate.fromTemplate('{input}'),
      ]),
      llm: chat,
    });

    // // Adding an AI message to the memory
    // const aiMessage = new AIChatMessage("This is an AI message.");
    // const res = await chat.call([aiMessage]);
    // console.log('aki: ', res);

    const { response } = await chain.call({
      input: tryToKickOffInterview(interviewStep, options)
        ? getCandidateInfos(options)
        : human,
      product: "cars",
    });
    return NextResponse.json({ error: "", text: response });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
