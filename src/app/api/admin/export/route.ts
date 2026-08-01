import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, WidthType } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { INSTRUMENT_LABELS } from "@/lib/auth-utils";
import { SURVEY_QUESTIONS, INTERVIEW_QUESTIONS, CHECKLIST_ITEMS } from "@/lib/instrument-content";

type Row = Record<string, string>;

const LIKERT_LABELS: Record<string, string> = {
  TOTALMENTE_DESACUERDO: "Totalmente en desacuerdo",
  DESACUERDO: "En desacuerdo",
  NEUTRAL: "Ni de acuerdo ni en desacuerdo",
  DE_ACUERDO: "De acuerdo",
  TOTALMENTE_ACUERDO: "Totalmente de acuerdo",
};

const CHECKLIST_STATUS_LABELS: Record<string, string> = {
  CUMPLE: "Cumple",
  CUMPLE_PARCIAL: "Cumple parcialmente",
  NO_CUMPLE: "No cumple",
};

async function buildRows(instrumentKey: string): Promise<{ title: string; rows: Row[] }> {
  switch (instrumentKey) {
    case "ENTREVISTA": {
      const data = await db.interviewResponse.findMany({
        where: { completed: true },
        include: { user: true },
      });
      return {
        title: INSTRUMENT_LABELS.ENTREVISTA,
        rows: data.map((d) => {
          const answers = (d.answersJson as Record<string, string>) || {};
          const row: Row = {
            Participante: d.user.fullName || d.user.email,
            Correo: d.user.email,
            Rol: d.user.role,
            "Fecha de envío": d.submittedAt?.toLocaleString("es-CO") || "",
          };
          INTERVIEW_QUESTIONS.forEach((q, idx) => {
            row[`P${idx + 1}. ${q.text}`] = answers[q.id] || "";
          });
          return row;
        }),
      };
    }
    case "ENCUESTA": {
      const data = await db.surveyResponse.findMany({
        where: { completed: true },
        include: { user: true },
      });
      return {
        title: INSTRUMENT_LABELS.ENCUESTA,
        rows: data.map((d) => {
          const answers = (d.answersJson as Record<string, string>) || {};
          const row: Row = {
            Participante: d.user.fullName || d.user.email,
            Correo: d.user.email,
            Rol: d.user.role,
            "Fecha de envío": d.submittedAt?.toLocaleString("es-CO") || "",
          };
          SURVEY_QUESTIONS.forEach((q, idx) => {
            const value = answers[q.id];
            row[`P${idx + 1}. ${q.text}`] = value ? LIKERT_LABELS[value] || value : "";
          });
          return row;
        }),
      };
    }
    case "CHECKLIST_COBIT": {
      const data = await db.checklistResponse.findMany({
        where: { completed: true },
        include: { user: true },
      });
      return {
        title: INSTRUMENT_LABELS.CHECKLIST_COBIT,
        rows: data.map((d) => {
          const items = (d.itemsJson as Record<string, { status: string; evidenceObserved: string }>) || {};
          const row: Row = {
            Participante: d.user.fullName || d.user.email,
            Correo: d.user.email,
            Rol: d.user.role,
            "Fecha de envío": d.submittedAt?.toLocaleString("es-CO") || "",
          };
          CHECKLIST_ITEMS.forEach((item, idx) => {
            const entry = items[item.id];
            const statusLabel = entry?.status ? CHECKLIST_STATUS_LABELS[entry.status] || entry.status : "";
            row[`Item ${idx + 1}. ${item.text}`] = entry
              ? `${statusLabel} — Evidencia: ${entry.evidenceObserved || ""}`
              : "";
          });
          return row;
        }),
      };
    }
    case "JUICIO_EXPERTOS": {
      const data = await db.expertValidation.findMany({
        where: { completed: true },
        include: { user: true },
      });
      return {
        title: INSTRUMENT_LABELS.JUICIO_EXPERTOS,
        rows: data.map((d) => ({
          Participante: d.user.fullName || d.user.email,
          Correo: d.user.email,
          "Fecha de envío": d.submittedAt?.toLocaleString("es-CO") || "",
          Criterios: JSON.stringify(d.criteriaJson),
          Fortalezas: d.strengths,
          Debilidades: d.weaknesses,
          Observaciones: d.observations || "",
          Recomendaciones: d.recommendations || "",
          "Concepto final": d.finalConcept,
        })),
      };
    }
    case "MATRIZ_DOCUMENTAL": {
      const data = await db.documentAnalysisEntry.findMany({ include: { user: true } });
      return {
        title: INSTRUMENT_LABELS.MATRIZ_DOCUMENTAL,
        rows: data.map((d) => ({
          Documento: d.documentAnalyzed,
          Tipo: d.documentType,
          Sección: d.section,
          Fragmento: d.excerptFound,
          Hallazgo: d.finding,
          Interpretación: d.interpretation,
          "Relación con objetivos": d.relationObjectives,
          "Relación con variables": d.relationVariables,
          Observaciones: d.observations || "",
        })),
      };
    }
    default:
      return { title: "Instrumento", rows: [] };
  }
}

function wrapText(text: string, maxChars: number): string[] {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current = (current + " " + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const instrument = searchParams.get("instrument") || "ENCUESTA";
  const format = searchParams.get("format") || "csv";

  const { title, rows } = await buildRows(instrument);
  const baseName = title.toLowerCase().replace(/\s+/g, "-");

  if (rows.length === 0) {
    return NextResponse.json({ error: "No hay respuestas completadas para exportar." }, { status: 404 });
  }

  const headers = Object.keys(rows[0]);

  if (format === "csv") {
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.csv"`,
      },
    });
  }

  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(title.slice(0, 30));
    sheet.columns = headers.map((h) => ({ header: h, key: h, width: 35 }));
    sheet.getRow(1).font = { bold: true };
    rows.forEach((r) => {
      const newRow = sheet.addRow(r);
      newRow.alignment = { wrapText: true, vertical: "top" };
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
      },
    });
  }

  if (format === "docx") {
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: headers.map(
            (h) => new TableCell({ children: [new Paragraph({ text: h, heading: HeadingLevel.HEADING_6 })] })
          ),
        }),
        ...rows.map(
          (r) =>
            new TableRow({
              children: headers.map(
                (h) => new TableCell({ children: [new Paragraph(String(r[h] ?? ""))] })
              ),
            })
        ),
      ],
    });

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: `Exportado: ${new Date().toLocaleString("es-CO")}` }),
            new Paragraph({ text: "" }),
            table,
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${baseName}.docx"`,
      },
    });
  }

  if (format === "pdf") {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 40;
    const maxCharsPerLine = 95;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - 50;

    function newPage() {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }

    page.drawText(title, { x: margin, y, size: 16, font: boldFont, color: rgb(0.1, 0.15, 0.4) });
    y -= 20;
    page.drawText(`Exportado: ${new Date().toLocaleString("es-CO")}`, {
      x: margin,
      y,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 25;

    rows.forEach((row, rowIdx) => {
      if (y < 100) newPage();
      page.drawText(`Registro ${rowIdx + 1}`, { x: margin, y, size: 11, font: boldFont, color: rgb(0.15, 0.32, 0.94) });
      y -= 16;

      headers.forEach((h) => {
        const value = String(row[h] ?? "");
        const label = `${h}:`;
        const lines = wrapText(value, maxCharsPerLine);

        if (y < 60) newPage();
        page.drawText(label, { x: margin, y, size: 9, font: boldFont, color: rgb(0, 0, 0) });
        y -= 13;

        lines.forEach((line) => {
          if (y < 60) newPage();
          page.drawText(line, { x: margin + 10, y, size: 9, font, color: rgb(0.15, 0.15, 0.15) });
          y -= 13;
        });
        y -= 4;
      });

      y -= 12;
      if (y > 60) {
        page.drawLine({
          start: { x: margin, y },
          end: { x: pageWidth - margin, y },
          thickness: 0.5,
          color: rgb(0.85, 0.85, 0.85),
        });
        y -= 15;
      }
    });

    const bytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
}
