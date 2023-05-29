"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import "@/styles/base.css";
import styles from "@/styles/Home.module.css";
import { InterviewReqBody, Message } from "@/types/interview";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid";
import LoadingDots from "@/components/LoadingDots";
import {
  PRECONDITION_CONFIG,
  QUESTION_COUNT,
  ROUNDS_FOR_EACH_QUESTION,
} from "@/constants/interviewConfig";
import { INTERVIEW_ID_KEY } from "@/constants/storage";

/**
 * todo:
 * preconditions required | optional
 */
export default function Home() {
  const [startInterview, setStartInterview] = useState<boolean>(false);
  const [interviewStep, setInterviewStep] = useState<[number, number]>([1, 0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageList, setMessageList] = useState<Partial<Message>[]>([]);
  const [pdfContent, setPdfContent] = useState<File>();

  const interviewIdRef = useRef<string>(
    window.sessionStorage.getItem(INTERVIEW_ID_KEY)!
  );
  const preConditionFormRef = useRef<HTMLFormElement>(null);
  const resumeContentRef = useRef<string>("");
  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const checkCanAskNextQuestion = useCallback(() => {
    const [questionIndex] = interviewStep;
    return questionIndex <= QUESTION_COUNT - 1;
  }, [interviewStep]);

  const checkCanAskNextRound = useCallback(() => {
    const [, roundIndex] = interviewStep;
    return roundIndex <= ROUNDS_FOR_EACH_QUESTION - 1;
  }, [interviewStep]);

  const updateInterviewStatus = useCallback(() => {
    const [questionIndex, roundIndex] = interviewStep;
    if (checkCanAskNextRound()) {
      setInterviewStep([questionIndex, roundIndex + 1]);
    } else if (checkCanAskNextQuestion()) {
      setInterviewStep([questionIndex + 1, 0]);
    } else {
      /** interview finished */
      setStartInterview(false);
      setInterviewStep([1, 0]);
    }
  }, [checkCanAskNextQuestion, checkCanAskNextRound, interviewStep]);

  const getCandidateInfos = () => {
    if (preConditionFormRef.current) {
      const formData = new FormData(preConditionFormRef.current);

      return {
        jobTitle: `${formData.get("jobTitle")}`,
        workingYear: +formData.get("workingYear")!,
        countryOrRegion: `${formData.get("countryOrRegion")}`,
        resume: resumeContentRef.current,
      };
    } else {
      return {};
    }
  };

  useEffect(() => {
    (async () => {
      if (pdfContent) {
        const formData = new FormData();
        formData.append("file", pdfContent);
        const response = await fetch("/api/pdf/extract", {
          method: "POST",
          body: formData,
        });

        const { content } = await response.json();
        resumeContentRef.current = content;
        console.log("response", content);
      }
    })();
  }, [pdfContent]);

  const addDataToStack = (
    message: Message["message"],
    type: Message["type"]
  ) => {
    setMessageList((state) => [
      ...state,
      {
        type: type as Message["type"],
        message: message,
      },
    ]);
  };

  /** Handle form submission */
  const handleSubmit = useCallback(
    async (e?: any) => {
      e?.preventDefault();
      setError(null);

      let query: string | null = null;
      if (textAreaRef.current?.value) {
        query = textAreaRef.current.value;
      }

      const data: Partial<InterviewReqBody> = {};

      if (startInterview) {
        if (!query) {
          alert("Please input a question");
          return;
        }
        data.human = query.trim();
        addDataToStack(data.human, "userMessage");
        if (textAreaRef.current) {
          textAreaRef.current.value = "";
        }
      } else {
        data.options = getCandidateInfos();
      }

      setLoading(true);

      try {
        const body: InterviewReqBody = {
          interviewStep,
          ...data,
        };
        const response = await fetch("/api/interview", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Interview-Id": interviewIdRef.current,
          },
          body: JSON.stringify(body),
        });

        const { error, text: answer } = await response.json();

        if (error) {
          setError(error);
        } else {
          setStartInterview(true);
          addDataToStack(answer, "apiMessage");
          updateInterviewStatus();
        }

        setLoading(false);

        /** scroll to bottom */
        messageListRef.current?.scrollTo(
          0,
          messageListRef.current.scrollHeight
        );
      } catch (error) {
        setLoading(false);
        setError(
          "An error occurred while fetching the data. Please try again."
        );
      }
    },
    [updateInterviewStatus, startInterview, interviewStep]
  );

  useEffect(() => {
    textAreaRef.current?.focus();

    if (!window.sessionStorage.getItem(INTERVIEW_ID_KEY)) {
      interviewIdRef.current = uuidv4();
      window.sessionStorage.setItem(INTERVIEW_ID_KEY, interviewIdRef.current);
    }
  }, []);

  /** Debug */
  useEffect(() => {
    if (startInterview) {
      console.log("messageList", messageList);
      console.log("interviewStep", interviewStep);
    }
  }, [messageList, startInterview, interviewStep]);

  const handleEnter = (e: any) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key == "Enter") {
      e.preventDefault();
    }
  };

  return (
    <main className={styles.main}>
      {startInterview ? (
        <>
          <div className={styles.cloud}>
            <div ref={messageListRef} className={styles.messagelist}>
              {messageList.map((message, index) => {
                let icon;
                let className;
                if (message.type === "apiMessage") {
                  icon = (
                    <Image
                      key={index}
                      src="/bot-image.png"
                      alt="AI"
                      width="40"
                      height="40"
                      className={styles.boticon}
                      priority
                    />
                  );
                  className = styles.apimessage;
                } else {
                  icon = (
                    <Image
                      key={index}
                      src="/usericon.png"
                      alt="Me"
                      width="30"
                      height="30"
                      className={styles.usericon}
                      priority
                    />
                  );
                  // The latest message sent by the user will be animated while waiting for a response
                  className =
                    loading && index === messageList.length - 1
                      ? styles.usermessagewaiting
                      : styles.usermessage;
                }
                return (
                  <div key={`chatMessage-${index}`} className={className}>
                    {icon}
                    <div className={styles.markdownanswer}>
                      <ReactMarkdown linkTarget="_blank">
                        {message.message!}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={styles.center}>
            <div className={styles.cloudform}>
              <form onSubmit={handleSubmit}>
                {/* aki todo: maxLength */}
                <textarea
                  disabled={loading}
                  onKeyDown={handleEnter}
                  ref={textAreaRef}
                  autoFocus={false}
                  rows={3}
                  id="userInput"
                  name="userInput"
                  placeholder={loading ? "Waiting for response..." : ""}
                  className={styles.textarea}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={styles.generatebutton}
                >
                  {loading ? (
                    <div className={styles.loadingwheel}>
                      <LoadingDots color="#000" />
                    </div>
                  ) : (
                    // Send icon SVG in input field
                    <svg
                      viewBox="0 0 20 20"
                      className={styles.svgicon}
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </div>
        </>
      ) : (
        <form
          ref={preConditionFormRef}
          onSubmit={handleSubmit}
          className={styles.preCondition}
        >
          <h2>
            Provide information below can help assistant to ask question more
            tailor to you.
          </h2>
          {Object.keys(PRECONDITION_CONFIG).map((key) => {
            const config = PRECONDITION_CONFIG[key];
            return (
              <div className={styles.preConditionItem} key={key}>
                <label htmlFor={key}>{config.name}</label>
                <input
                  name={key}
                  id={key}
                  type={config.type}
                  placeholder={(config.placeholder as string) || ""}
                />
              </div>
            );
          })}
          <div className={styles.preConditionItem}>
            <label htmlFor="resumeUpload">Resume</label>
            <input
              className={styles.customFileInput}
              id="resumeUpload"
              type="file"
              accept="application/pdf"
              onChange={(event) => {
                event.target.files && console.log(event.target.files[0]);
                const file = event.target.files?.[0];
                setPdfContent(file);
              }}
            />
          </div>
          <button type="submit" className={styles.preConditionConfirm}>
            Start Interview
          </button>
        </form>
      )}
      {error && (
        <div className="border border-red-400 rounded-md p-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}
    </main>
  );
}
