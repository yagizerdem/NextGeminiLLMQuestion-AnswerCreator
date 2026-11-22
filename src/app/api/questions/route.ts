import { getAuthenticatedUserId, unauthorized } from "@/lib/auth";
import { HttpStatusCode } from "@/lib/utils";
import { isObjectIdOrHexString } from "mongoose";
import { NextRequest } from "next/server";
import { z } from "zod";
import Document, { IDocument } from "@/models/document";
import { DocParser, ParsedDocument } from "@/lib/parser";
import { readLocalFile } from "@/lib/file";

const schema = z.object({
  difficulty: z.enum(["easy", "medium", "hard", "expert"]),
  questionCount: z.number().min(1).max(50),
  uploadId: z.string().refine(isObjectIdOrHexString, {
    message: "Upload ID must be a valid MongoDB ObjectId.",
  }),
});

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  const body = await request.json();
  const parsedBody = schema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json(
      {
        message: "Invalid request",
        errors: parsedBody.error.issues.map((issue) => issue.message),
      },
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }

  const { difficulty, questionCount, uploadId } = parsedBody.data;
  const documentFromDb: IDocument | null = await Document.findById(uploadId);
  if (!documentFromDb) {
    return Response.json(
      { message: "Document not found" },
      { status: HttpStatusCode.NOT_FOUND },
    );
  }

  const docContent = !documentFromDb.content
    ? await readLocalFile(documentFromDb.filename)
    : Buffer.from(documentFromDb.content);

  const documentParser = new DocParser();
  const parsed: ParsedDocument = documentParser.parseTxt(docContent);
  const cleanedText = documentParser.cleanText(parsed.text);

  return new Response(JSON.stringify({ success: true }), {
    status: HttpStatusCode.OK,
  });
}
