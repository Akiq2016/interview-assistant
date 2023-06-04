# Lablab.ai Anthropic AI Hackathon Project: Interview Assistant

This is an interview assistant application that helps interviewers to practice a better interview experience. It is built with [Next.js](https://nextjs.org/), [LangChain](https://js.langchain.com/docs/), [Claude AI](https://console.anthropic.com/docs), and Redis.

## Features

- [x] Interviewer can create a new interview session based their resume and expected job.
- [x] Interviewer can experience the interview session with the AI.
- [x] For more effecient interview, interviewer can use the voice input to answer questions which powerd by whisper.
- [x] Interviewer can review the interview session and get feedback from the AI.

## Demo

[Interview Assistant](https://interview-assistant-gycb0ok6g-akiq2016.vercel.app)

## Try it by your self

1. `docker compose up -d` initialize the redis server
2. `pnpm i` install dependencies
3. `pnpm dev` start the development server

Open [http://localhost:3000](http://localhost:3000) with your browser to experience the app.
