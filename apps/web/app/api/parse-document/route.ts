import { NextRequest, NextResponse } from "next/server";
import * as pdfParse from "pdf-parse";
import * as mammoth from "mammoth";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let content = "";

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const pdf = (pdfParse as unknown as { default: (buffer: Buffer) => Promise<{ text: string }> }).default;
      const data = await pdf(buffer);
      content = data.text;
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
    } else if (file.type === "application/msword" || file.name.endsWith(".doc")) {
      return NextResponse.json(
        { error: "Legacy .doc files are not supported. Please convert to .docx" },
        { status: 400 }
      );
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      content = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT" },
        { status: 400 }
      );
    }

    const maxLength = 50000;
    if (content.length > maxLength) {
      content = content.slice(0, maxLength) + "\n\n[Content truncated due to length...]";
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Document parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse document" },
      { status: 500 }
    );
  }
}
