import { errors, jwtVerify, SignJWT } from "jose";
import { isObjectIdOrHexString } from "mongoose";
import type { NextRequest } from "next/server";
import { HttpStatusCode } from "./utils";
import { NextResponse } from "next/dist/server/web/spec-extension/response";

export const AUTH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set.");
  }
  return new TextEncoder().encode(secret);
}

export async function createAuthToken(userId: string, secret: Uint8Array) {
  return new SignJWT()
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${AUTH_TOKEN_MAX_AGE}s`)
    .sign(secret);
}

export async function verifyAuthToken(token: string, secret: Uint8Array) {
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
    requiredClaims: ["sub", "exp"],
  });
  return payload;
}

export async function getAuthenticatedUserId(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  if (!token) return null;

  const secret = getJwtSecret();
  try {
    const { sub } = await verifyAuthToken(token, secret);
    return sub && isObjectIdOrHexString(sub) ? sub : null;
  } catch (error) {
    if (error instanceof errors.JOSEError) return null;
    throw error;
  }
}

export const unauthorized = () =>
  NextResponse.json(
    { message: "Unauthorized" },
    {
      status: HttpStatusCode.UNAUTHORIZED,
      headers: { "Cache-Control": "no-store" },
    },
  );
