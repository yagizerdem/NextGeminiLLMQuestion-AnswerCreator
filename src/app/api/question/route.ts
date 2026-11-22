import { getAuthenticatedUserId, unauthorized } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { HttpStatusCode } from "@/lib/utils";
import QuestionSetModel from "@/models/questionset";
import { isObjectIdOrHexString } from "mongoose";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  await connectToDatabase();
  const questionSets = await QuestionSetModel.find({ userId })
    .select("-questions")
    .sort({ createdAt: -1 })
    .lean();

  return Response.json(
    { questionSets },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function DELETE(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  const id = request.nextUrl.searchParams.get("id");
  if (!id || !isObjectIdOrHexString(id)) {
    return Response.json(
      { message: "A valid question set ID is required." },
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }

  await connectToDatabase();
  const result = await QuestionSetModel.deleteOne({ _id: id, userId });
  if (result.deletedCount === 0) {
    return Response.json(
      { message: "Question set not found." },
      { status: HttpStatusCode.NOT_FOUND },
    );
  }

  return Response.json({ message: "Question set deleted successfully." });
}