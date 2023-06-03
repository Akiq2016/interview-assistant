export enum InterviewStatus {
  start = "start",
  interviewing = "interviewing",
  end = "end",
}

export type candidateInfo = {
  jobTitle?: string;
  workingYear?: number;
  countryOrRegion?: string;
  resume?: string;
};

export type InterviewReqBodyStart = {
  status: InterviewStatus.start;
  interviewStep: [number, number];
  options: candidateInfo;
};
export type InterviewReqBodyEnd = {
  status: InterviewStatus.end;
};
export type InterviewReqBodyInterviewing = {
  status: InterviewStatus.interviewing;
  interviewStep: [number, number];
  human: string;
};
export type InterviewReqBody =
  | InterviewReqBodyEnd
  | InterviewReqBodyStart
  | InterviewReqBodyInterviewing;

export type Message = {
  type: "apiMessage" | "userMessage";
  message: string;
  isStreaming?: boolean;
};
