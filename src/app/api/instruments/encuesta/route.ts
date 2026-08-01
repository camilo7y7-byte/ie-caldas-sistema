import { db } from "@/lib/db";
import { createSingleInstrumentHandlers } from "@/lib/instrument-handlers";

export const { GET, POST, PUT } = createSingleInstrumentHandlers(
  db.surveyResponse,
  "answersJson",
  "SurveyResponse"
);
