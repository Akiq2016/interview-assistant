"use client";

import Image from "next/image";
import { useRef, useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from "uuid";

import "@/styles/base.css";
import styles from "@/styles/Home.module.css";
import {
  InterviewReqBody,
  InterviewReqBodyEnd,
  InterviewReqBodyInterviewing,
  InterviewReqBodyStart,
  InterviewStatus,
  Message,
} from "@/types/interview";
import { SendIcon, RobotIcon, UserIcon } from "@/components/Icons";
import LoadingDots from "@/components/LoadingDots";
import VoiceInputBox from "@/components/VoiceInputBox";
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
  const [interviewStatus, setInterviewStatus] = useState<InterviewStatus>(
    InterviewStatus["start"]
  );
  const [interviewStep, setInterviewStep] = useState<[number, number]>([1, 0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageList, setMessageList] = useState<Partial<Message>[]>([]);
  const [pdfContent, setPdfContent] = useState<File>();

  const interviewIdRef = useRef<string>(
    globalThis.sessionStorage?.getItem(INTERVIEW_ID_KEY)!
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
    if (checkCanAskNextRound()) {
      setInterviewStep(([questionIndex, roundIndex]) => [
        questionIndex,
        roundIndex + 1,
      ]);
    } else if (checkCanAskNextQuestion()) {
      setInterviewStep(([questionIndex]) => [questionIndex + 1, 0]);
    }
  }, [checkCanAskNextQuestion, checkCanAskNextRound]);

  const resetInterview = () => {
    setInterviewStatus(InterviewStatus["start"]);
    setInterviewStep([1, 0]);
    setError(null);
    setMessageList([]);
    setPdfContent(undefined);
  };

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

        const { text } = await response.json();
        resumeContentRef.current = text;
        console.log("response", text);
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
    async (query?: string) => {
      setError(null);

      const data:
        | InterviewReqBodyEnd
        | InterviewReqBodyStart
        | InterviewReqBodyInterviewing = {} as any;

      if (interviewStatus === InterviewStatus["interviewing"]) {
        if (!query) {
          alert("Please input a question");
          return;
        }

        (data as InterviewReqBodyInterviewing).status = interviewStatus;
        (data as InterviewReqBodyInterviewing).interviewStep = interviewStep;
        (data as InterviewReqBodyInterviewing).human = query.trim();

        addDataToStack(
          (data as InterviewReqBodyInterviewing).human,
          "userMessage"
        );
      } else if (interviewStatus === InterviewStatus["start"]) {
        (data as InterviewReqBodyStart).status = interviewStatus;
        (data as InterviewReqBodyInterviewing).interviewStep = interviewStep;
        (data as InterviewReqBodyStart).options = getCandidateInfos();
      } else {
        return;
      }

      setLoading(true);

      try {
        const body: InterviewReqBody = {
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

        const { error, text: answer, end } = await response.json();

        if (error) {
          setError(error);
        } else {
          end
            ? setInterviewStatus(InterviewStatus["end"])
            : setInterviewStatus(InterviewStatus["interviewing"]);
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
    [updateInterviewStatus, interviewStatus, interviewStep]
  );

  useEffect(() => {
    textAreaRef.current?.focus();

    if (!globalThis.sessionStorage?.getItem(INTERVIEW_ID_KEY)) {
      interviewIdRef.current = uuidv4();
      globalThis.sessionStorage?.setItem(
        INTERVIEW_ID_KEY,
        interviewIdRef.current
      );
    }
  }, []);

  const handleEnter = (e: any) => {
    if (e.key === "Enter") {
      handleSubmit();
    } else if (e.key == "Enter") {
      e.preventDefault();
    }
  };

  return (
    <main className={styles.main}>
      {interviewStatus !== InterviewStatus["start"] ? (
        <>
          <div className={`${styles.cloud} border-slate-300`}>
            <div ref={messageListRef} className={styles.messagelist}>
              {messageList.map((message, index) => {
                let icon;
                let className;
                if (message.type === "apiMessage") {
                  icon = (
                    <div className="flex justify-center items-center shrink-0 w-10 h-10 mr-4">
                      <RobotIcon />
                    </div>
                  );
                  className = styles.apimessage;
                } else {
                  icon = (
                    <div className="flex justify-center items-center shrink-0 w-10 h-10 mr-4">
                      <UserIcon />
                    </div>
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

          <div className={`${styles.center} w-full`}>
            <div className={`${styles.cloudform} w-full`}>
              <form onSubmit={(e) => e.preventDefault()}>
                {interviewStatus === InterviewStatus["interviewing"] && (
                  <>
                    {/* aki todo: maxLength */}
                    {/* <textarea
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
                        <SendIcon />
                      )}
                    </button> */}

                    <VoiceInputBox isLoading={loading} onSend={handleSubmit} />
                  </>
                )}
                {interviewStatus === InterviewStatus["end"] && (
                  <button
                    disabled={loading}
                    onClick={resetInterview}
                    className={styles.preConditionConfirm}
                  >
                    End
                  </button>
                )}
              </form>
            </div>
          </div>
        </>
      ) : (
        <form
          ref={preConditionFormRef}
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
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
          <button
            disabled={loading}
            type="submit"
            className={styles.preConditionConfirm}
          >
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
