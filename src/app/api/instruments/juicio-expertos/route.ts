import { db } from "@/lib/db";
import { createSingleInstrumentHandlers } from "@/lib/instrument-handlers";

// Nota: los campos de texto (strengths, weaknesses, observations,
// recommendations, finalConcept) viajan dentro de body.extraFields
// desde el cliente, y criteriaJson en body.data
export const { GET, POST, PUT } = createSingleInstrumentHandlers(
  db.expertValidation,
  "criteriaJson",
  "ExpertValidation"
);
