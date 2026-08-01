import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, WidthType } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { INSTRUMENT_LABELS } from "@/lib/auth-utils";

type Row = Record<string, string>;

async function buildRows(instrumentKey: string): Promise<{ title: string; rows: Row[] }> {
  switch (instrumentKey) {
    case "ENTREVISTA": {
      const data = await db.interviewResponse.findMany({
        where: { completed: true },
        include: { user: true },
      });
      return {
        title: INSTRUMENT_LABELS.ENTREVISTA,
        rows: data.map((d) => ({
          Participante: d.user.fullName || d.user.email,
          Correo: d.user.email,
          Rol: d.user.role,
          "Fecha de envío": d.submittedAt?.toLocaleString("es-CO") || "",
          Respuestas: JSON.stringify(d.answersJson),
        })),
      };
    }
    case "ENCUESTA": {
      const data = await db.surveyResponse.findMany({
        where: { completed: true },
        include: { user: true },
      });
      return {
        title: INSTRUMENT_LABELS.ENCUESTA,
        rows: data.map((d) => ({
          Participante: d.user.fullName || d.user.email,
          Correo: d.user.email,
          Rol: d.user.role,
          "Fecha de envío": d.submittedAt?.toLocaleString("es-CO") || "",
          Respuestas: JSON.stringify(d.answersJson),
        })),
      };
    }
    case "CHECKLIST_COBIT": {
      const data = await db.checklistResponse.findMany({
        where: { completed: true },
        include: { user: true },
      });
      return {
        title: INSTRUMENT_LABELS.CHECKLIST_COBIT,
        rows: data.map((d) => ({
          Participante: d.user.fullName || d.user.email,
          Correo: d.user.email,
          Rol: d.user.role,
          "Fecha de envío": d.submittedAt?.toLocaleString("es-CO") || "",
          Items: JSON.stringify(d.itemsJson),
        })),
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
        })),
      };
    }
    default:
      return { title: "Instrumento", rows: [] };
  }
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
    sheet.columns = headers.map((h) => ({ header: h, key: h, width: 28 }));
    sheet.getRow(1).font = { bold: true };
    rows.forEach((r) => sheet.addRow(r));
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
    let page = pdfDoc.addPage([842, 595]); // A4 horizontal
    let y = 560;

    page.drawText(title, { x: 40, y, size: 16, font: boldFont, color: rgb(0.1, 0.15, 0.4) });
    y -= 25;
    page.drawText(`Exportado: ${new Date().toLocaleString("es-CO")}`, { x: 40, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
    y -= 25;

    for (const row of rows) {
      if (y < 60) {
        page = pdfDoc.addPage([842, 595]);
        y = 560;
      }
      const lineText = headers.map((h) => `${h}: ${String(row[h] ?? "").slice(0, 60)}`).join("  |  ");
      const wrapped = lineText.slice(0, 160);
      page.drawText(wrapped, { x: 40, y, size: 8, font, color: rgb(0, 0, 0) });
      y -= 16;
    }

    const bytes = await pdfDoc.save();
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${baseName}.pdf"`,
      },
    });
  }

  return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
}
