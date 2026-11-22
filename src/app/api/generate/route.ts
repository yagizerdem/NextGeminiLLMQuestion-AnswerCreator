import { getAuthenticatedUserId, unauthorized } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { HttpStatusCode } from "@/lib/utils";
import { ApiError, GoogleGenAI } from "@google/genai";
import { isObjectIdOrHexString } from "mongoose";
import { NextRequest } from "next/server";
import { z } from "zod";
import Document, { IDocument } from "@/models/document";
import { DocParser, ParsedDocument } from "@/lib/parser";
import { readLocalFile } from "@/lib/file";
import User from "@/models/user";
import {
  DocumentChunk,
  Question,
  RagService,
  SimpleVectorStore,
} from "@/lib/rag";

const schema = z.object({
  difficulty: z.enum(["easy", "medium", "hard", "expert"]),
  questionCount: z.number().min(5).max(10),
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
  await connectToDatabase();
  const documentFromDb: IDocument | null =
    await Document.findById(uploadId).select("+content");
  if (!documentFromDb) {
    return Response.json(
      { message: "Document not found" },
      { status: HttpStatusCode.NOT_FOUND },
    );
  }

  const user = await User.findById(userId).select("+geminiToken");
  if (!user) return unauthorized();

  const userKey = user.geminiToken?.trim();
  const effectiveKey = userKey || process.env.GEMINI_API_KEY?.trim();

  // validate that we have an API key
  if (!effectiveKey) {
    console.error("Gemini API key is not configured.");
    return Response.json(
      { message: "Gemini API key is not configured." },
      { status: HttpStatusCode.SERVICE_UNAVAILABLE },
    );
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: effectiveKey,
      enterprise: false,
      httpOptions: { timeout: 10000 },
    });
    await ai.models.list({ config: { pageSize: 1 } });
  } catch (error) {
    if (error instanceof ApiError && [400, 401, 403].includes(error.status)) {
      console.error("Gemini API rejected the configured key.", {
        status: error.status,
      });
      return Response.json(
        { message: "Gemini API key was rejected or lacks access." },
        {
          status: userKey
            ? HttpStatusCode.BAD_REQUEST
            : HttpStatusCode.SERVICE_UNAVAILABLE,
        },
      );
    }

    console.error("Gemini API key verification failed.", {
      status: error instanceof ApiError ? error.status : undefined,
    });
    return Response.json(
      {
        message: "Unable to verify the Gemini API key. Please try again later.",
      },
      { status: HttpStatusCode.BAD_GATEWAY },
    );
  }

  const docContent = !documentFromDb.content
    ? await readLocalFile(documentFromDb.filename)
    : Buffer.from(documentFromDb.content);

  const documentParser = new DocParser();
  let parsed: ParsedDocument;
  try {
    parsed = await documentParser.parse(
      docContent,
      documentFromDb.originalName,
    );
  } catch (error) {
    if (
      error instanceof TypeError &&
      "code" in error &&
      error.code === "ERR_ENCODING_INVALID_ENCODED_DATA"
    ) {
      return Response.json(
        { message: "TXT and Markdown files must be valid UTF-8 text." },
        { status: HttpStatusCode.BAD_REQUEST },
      );
    }
    throw error;
  }
  const cleanedText = documentParser.cleanText(parsed.text);

  const ragService = new RagService(effectiveKey);
  const chunks: DocumentChunk[] = await ragService.index(
    uploadId,
    documentFromDb.originalName,
    cleanedText,
  );

  const simpleVectorStore = new SimpleVectorStore(effectiveKey);
  await simpleVectorStore.addDocuments(chunks);

  const topKChunks: DocumentChunk[] = [];
  const queries: string[] = [
    "What are the fundamental concepts and definitions of the subject?",
    "What are the important facts, principles, and rules related to the subject?",
    "What are the relationships and differences between the key concepts?",
    "What are the processes, methods, and steps related to the subject?",
    "What are the applications and illustrative examples of the subject?",
    "What are the exceptions, limitations, and common mistakes related to the subject?",
  ];

  for (const query of queries) {
    const chunks = await simpleVectorStore.similaritySearch(query, 5);
    if (topKChunks.some((c) => c.id === chunks[0]?.id)) continue;
    topKChunks.push(...chunks);
  }

  const questions: Question[] = await ragService.generateQuestionWitRag(
    queries,
    topKChunks,
    questionCount,
    difficulty,
    "English",
  );

  if (questions.length === 0) {
    return Response.json(
      { message: "Failed to generate valid questions. Please try again." },
      { status: HttpStatusCode.BAD_GATEWAY },
    );
  }

  return new Response(JSON.stringify({ success: true, questions }), {
    status: HttpStatusCode.OK,
  });
}
