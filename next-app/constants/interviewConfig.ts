/**
 * @Note
 * In a interview,
 * there would be ${QUESTION_COUNT} questions,
 * and each question has ${ROUNDS_FOR_EACH_QUESTION} rounds.
 */
export const QUESTION_COUNT = 2;
export const ROUNDS_FOR_EACH_QUESTION = 3;
export const PRECONDITION_CONFIG: {
  [key: string]: { name: string; type: string; [key: string]: unknown };
} = {
  jobTitle: {
    name: "Job Title",
    type: "string",
    required: true,
    placeholder: "Software Engineer",
  },
  workingYear: {
    name: "Working Years",
    type: "number",
    placeholder: "5",
  },
  countryOrRegion: {
    name: "Preferred Location",
    type: "string",
    placeholder: "United States",
  },
};
