import { connectToDatabase } from "@/lib/mongodb";
import { HttpStatusCode } from "@/lib/utils";
import User from "@/models/user";
import { hash } from "bcrypt";
import * as z from "zod";

const registerSchema = z.object({
  email: z
    .string({ error: "Email is required and must be a string." })
    .email("Please enter a valid email address."),
  password: z
    .string({ error: "Password is required and must be a string." })
    .min(6, "Password must be at least 6 characters long."),
  username: z
    .string({ error: "Username is required and must be a string." })
    .min(3, "Username must be at least 3 characters long."),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsedBody = registerSchema.safeParse(body);

  if (parsedBody.error)
    return new Response(
      JSON.stringify({
        errors: parsedBody.error.issues.map((issue) => issue.message),
        message: "Invalid credentials",
      }),
      {
        status: HttpStatusCode.BAD_REQUEST,
      },
    );

  await connectToDatabase();

  const passwordHash = await hash(parsedBody.data.password, 12);

  await User.create({
    email: parsedBody.data.email,
    passwordHash,
    username: parsedBody.data.username,
  });

  return Response.json(
    { message: "User created" },
    { status: HttpStatusCode.CREATED },
  );
}
