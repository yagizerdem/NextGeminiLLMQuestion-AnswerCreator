import { getAuthenticatedUserId, unauthorized } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) return unauthorized();

  await connectToDatabase();
  const user = await User.findById(userId).select("username email");
  if (!user) return unauthorized();

  return NextResponse.json(
    { user: { id: user._id, email: user.email, username: user.username } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
