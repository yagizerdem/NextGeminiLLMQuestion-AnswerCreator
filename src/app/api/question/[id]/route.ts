import { getAuthenticatedUserId, unauthorized } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { HttpStatusCode } from "@/lib/utils";
import QuestionSetModel from "@/models/questionset";
import { isObjectIdOrHexString } from "mongoose";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const { id } = await params;
  if (!isObjectIdOrHexString(id)) {
    return Response.json(
      { message: "A valid question set ID is required." },
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }

  await connectToDatabase();
  const questionSet = await QuestionSetModel.findOne({
    _id: id,
    userId,
  }).lean();
  if (!questionSet) {
    return Response.json(
      { message: "Question set not found." },
      { status: HttpStatusCode.NOT_FOUND },
    );
  }

  return Response.json(
    { questionSet },
    { headers: { "Cache-Control": "no-store" } },
  );
}
