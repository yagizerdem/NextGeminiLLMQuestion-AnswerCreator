import { AUTH_TOKEN_MAX_AGE, createAuthToken, getJwtSecret } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { HttpStatusCode } from "@/lib/utils";
import User from "@/models/user";
import { compare } from "bcrypt";
import { NextResponse } from "next/server";
import * as z from "zod";

const signInSchema = z.object({
  email: z
    .string({ error: "Email is required and must be a string." })
    .trim()
    .email("Please enter a valid email address.")
    .toLowerCase(),
  password: z
    .string({ error: "Password is required and must be a string." })
    .min(6, "Password must be at least 6 characters long.")
    .refine(
      (password) => Buffer.byteLength(password, "utf8") <= 72,
      "Password must not exceed 72 UTF-8 bytes.",
    ),
});

export async function POST(request: Request) {
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

  const parsedBody = signInSchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json(
      {
        errors: parsedBody.error.issues.map((issue) => issue.message),
        message: "Invalid credentials",
      },
      { status: HttpStatusCode.BAD_REQUEST },
    );
  }

  const secret = getJwtSecret();

  await connectToDatabase();
  const user = await User.findOne({ email: parsedBody.data.email }).select(
    "+passwordHash",
  );
  if (!user || !(await compare(parsedBody.data.password, user.passwordHash))) {
    return Response.json(
      { message: "Invalid email or password." },
      { status: HttpStatusCode.UNAUTHORIZED },
    );
  }

  const token = await createAuthToken(user._id.toString(), secret);

  const response = NextResponse.json({
    message: "Signed in successfully.",
    user: { id: user._id, email: user.email, username: user.username },
  });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_TOKEN_MAX_AGE,
  });
  return response;
}
