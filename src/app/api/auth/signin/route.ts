import { connectToDatabase } from "@/lib/mongodb";
import { HttpStatusCode } from "@/lib/util";
import User from "@/models/user";
import { compare } from "bcrypt";
import { SignJWT } from "jose";
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

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }

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

  const maxAge = 7 * 24 * 60 * 60;
  const token = await new SignJWT()
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user._id.toString())
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .sign(new TextEncoder().encode(secret));

  const response = NextResponse.json({
    message: "Signed in successfully.",
    user: { id: user._id, email: user.email, username: user.username },
  });
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return response;
}
