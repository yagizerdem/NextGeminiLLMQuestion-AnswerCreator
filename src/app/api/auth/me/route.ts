import { getAuthenticatedUserId, unauthorized } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { HttpStatusCode } from "@/lib/utils";
import User from "@/models/user";
import { mongo } from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

function maskGeminiToken(token: string | undefined) {
  const trimmedToken = token?.trim();
  if (!trimmedToken) return null;
  return trimmedToken.length > 8
    ? `${trimmedToken.slice(0, 4)}********${trimmedToken.slice(-4)}`
    : "********";
}

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  await connectToDatabase();
  const user = await User.findById(userId).select("username email +geminiToken");
  if (!user) return unauthorized();

  return NextResponse.json(
    {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        geminiTokenMasked: maskGeminiToken(user.geminiToken),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

const schema = z.object({
  email: z
    .string({ error: "Email is required and must be a string." })
    .trim()
    .email("Please enter a valid email address.")
    .toLowerCase()
    .optional(),
  username: z
    .string({ error: "Username is required and must be a string." })
    .trim()
    .min(3, "Username must be at least 3 characters long.")
    .max(20, "Username must be at most 20 characters long.")
    .optional(),
  geminiToken: z
    .string()
    .trim()
    .min(1, "Please enter an API key.")
    .max(255, "API key must be at most 255 characters long.")
    .optional(),
});

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return Response.json(
      {
        message: "Invalid JSON",
        errors: ["Please provide a valid JSON body."],
      },
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }
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

  const { email, username, geminiToken } = parsedBody.data;
  await connectToDatabase();

  let newUser;
  try {
    newUser = await User.findOneAndUpdate(
      { _id: userId },
      {
        ...(email ? { email } : {}),
        ...(username ? { username } : {}),
        ...(geminiToken ? { geminiToken } : {}),
      },
      { new: true, runValidators: true },
    );
  } catch (error) {
    if (error instanceof mongo.MongoServerError && error.code === 11000) {
      return Response.json(
        { message: "This email address is already in use." },
        { status: HttpStatusCode.CONFLICT },
      );
    }
    throw error;
  }
  if (!newUser) return unauthorized();

  return NextResponse.json(
    {
      message: "User updated",
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        ...(geminiToken && {
          geminiTokenMasked: maskGeminiToken(geminiToken),
        }),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
