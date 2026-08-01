export const SURVEY_QUESTIONS = [
  { id: "q1", text: "La institución cuenta con procesos claros de gobierno de TI." },
  { id: "q2", text: "Los servicios tecnológicos actuales apoyan adecuadamente los procesos de inclusión educativa." },
  { id: "q3", text: "Existen mecanismos definidos para la gestión de incidentes tecnológicos (ITIL 4)." },
  { id: "q4", text: "El personal docente recibe capacitación suficiente sobre el uso de tecnologías de apoyo." },
  { id: "q5", text: "La infraestructura tecnológica actual es suficiente para atender a estudiantes con necesidades educativas especiales." },
  { id: "q6", text: "Consideraría útil la incorporación de tecnologías IoT (sensores, dispositivos conectados) para mejorar el seguimiento de procesos de inclusión." },
  { id: "q7", text: "Existe comunicación efectiva entre coordinación académica y el área de tecnología." },
  { id: "q8", text: "Los recursos tecnológicos disponibles se distribuyen de forma equitativa entre las áreas." },
  { id: "q9", text: "La institución realiza seguimiento y evaluación periódica de los servicios de TI." },
  { id: "q10", text: "Estaría dispuesto(a) a participar en la implementación de un modelo de gobierno de TI basado en COBIT 2019." },
] as const;

export const LIKERT_OPTIONS = [
  { value: "TOTALMENTE_DESACUERDO", label: "Totalmente en desacuerdo" },
  { value: "DESACUERDO", label: "En desacuerdo" },
  { value: "NEUTRAL", label: "Ni de acuerdo ni en desacuerdo" },
  { value: "DE_ACUERDO", label: "De acuerdo" },
  { value: "TOTALMENTE_ACUERDO", label: "Totalmente de acuerdo" },
] as const;

export const INTERVIEW_QUESTIONS = [
  { id: "i1", text: "¿Cómo describiría la situación actual del gobierno de TI en la institución?" },
  { id: "i2", text: "¿Qué dificultades identifica en los servicios tecnológicos asociados a la inclusión educativa?" },
  { id: "i3", text: "¿Qué procesos de ITIL 4 considera más urgentes de implementar o mejorar?" },
  { id: "i4", text: "¿De qué manera cree que las tecnologías IoT podrían apoyar los procesos de inclusión educativa en la institución?" },
  { id: "i5", text: "¿Qué recomendaciones haría para fortalecer el gobierno y la arquitectura de TI institucional?" },
] as const;

export const CHECKLIST_ITEMS = [
  { id: "c1", domain: "APO (Alinear, Planificar, Organizar)", text: "Existe un marco de gobierno de TI formalmente documentado." },
  { id: "c2", domain: "APO", text: "Se cuenta con una estrategia de TI alineada a los objetivos institucionales." },
  { id: "c3", domain: "BAI (Construir, Adquirir, Implementar)", text: "Existen procesos definidos para la gestión de proyectos tecnológicos." },
  { id: "c4", domain: "DSS (Entregar, Dar Servicio y Soporte)", text: "Existe una mesa de servicio o canal formal para reportar incidentes tecnológicos." },
  { id: "c5", domain: "DSS", text: "Se realiza gestión de la continuidad de los servicios tecnológicos." },
  { id: "c6", domain: "MEA (Supervisar, Evaluar y Valorar)", text: "Se monitorean y evalúan periódicamente los servicios de TI." },
  { id: "c7", domain: "EDM (Evaluar, Dirigir y Monitorear)", text: "La alta dirección participa activamente en las decisiones de TI." },
] as const;

export const EXPERT_CRITERIA = [
  { id: "e1", text: "Claridad y redacción del instrumento." },
  { id: "e2", text: "Pertinencia de los ítems respecto a los objetivos de la investigación." },
  { id: "e3", text: "Coherencia entre variables, dimensiones e indicadores." },
  { id: "e4", text: "Suficiencia de los ítems para recolectar la información requerida." },
  { id: "e5", text: "Relevancia del instrumento para el contexto institucional." },
] as const;
