import { getJwtSecret, verifyAuthToken } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { HttpStatusCode } from "@/lib/utils";
import User from "@/models/user";
import { errors } from "jose";
import { isObjectIdOrHexString } from "mongoose";
import { unauthorized } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) return unauthorized();

  const secret = getJwtSecret();

  let userId: string | undefined;
  try {
    const payload = await verifyAuthToken(token, secret);
    userId = payload.sub;
  } catch (error) {
    if (error instanceof errors.JOSEError) return unauthorized();
    throw error;
  }

  if (!userId || !isObjectIdOrHexString(userId)) return unauthorized();

  await connectToDatabase();
  const user = await User.findById(userId).select("username email");
  if (!user) return unauthorized();

  return NextResponse.json(
    { user: { id: user._id, email: user.email, username: user.username } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
