import { randomUUID } from "crypto";
import { unlink } from "fs/promises";
import path from "path";
import { getAuthenticatedUserId, unauthorized } from "@/lib/auth";
import { getStrategy, saveLocalFile } from "@/lib/file";
import { connectToDatabase } from "@/lib/mongodb";
import { HttpStatusCode } from "@/lib/utils";
import Document from "@/models/document";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 1 * 1024 * 1024;
const allowedExtensions = new Set([
  ".pdf",
  ".docx",
  ".md",
  ".markdown",
  ".txt",
]);

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    if (!(error instanceof TypeError)) throw error;
    return NextResponse.json(
      { message: "Please provide a valid multipart form." },
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "A file is required." },
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!allowedExtensions.has(extension)) {
    return NextResponse.json(
      { message: "Only PDF, DOCX, Markdown and TXT files are supported." },
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { message: "File must not exceed 1 MiB." },
      { status: HttpStatusCode.PAYLOAD_TOO_LARGE },
    );
  }

  await connectToDatabase();
  if (!(await User.exists({ _id: userId }))) return unauthorized();

  const filename = `${randomUUID()}${extension}`;
  const content = Buffer.from(await file.arrayBuffer());
  const strategy = getStrategy();
  const uploadPath =
    strategy === "local" ? await saveLocalFile(filename, content) : undefined;

  let document;
  try {
    document = await Document.create({
      userId,
      filename,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      ...(uploadPath ? { uploadPath } : { content }),
    });
  } catch (error) {
    if (uploadPath) {
      try {
        await unlink(uploadPath);
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          "Failed to create document and remove the uploaded file.",
        );
      }
    }
    throw error;
  }

  return NextResponse.json(
    {
      message: "File uploaded successfully.",
      document: {
        id: document._id,
        filename: document.filename,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        status: document.status,
      },
    },
    { status: HttpStatusCode.CREATED },
  );
}
