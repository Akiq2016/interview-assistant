export type InterviewReqBody = {
  interviewStep: [number, number];
  human?: string;
  options?: {
    jobTitle?: string;
    workingYear?: number;
    countryOrRegion?: string;
    resume?: string;
  };
};

export type Message = {
  type: "apiMessage" | "userMessage";
  message: string;
  isStreaming?: boolean;
};
