import { jwtVerify, SignJWT } from "jose";

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