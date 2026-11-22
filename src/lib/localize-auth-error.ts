import type { TranslationKey } from "@/providers/localization-provider";

const authErrors = new Map<string, TranslationKey>([
  ["Please enter a valid email address.", "validEmail"],
  ["Email is required and must be a string.", "requiredField"],
  ["Password is required and must be a string.", "requiredField"],
  ["Username is required and must be a string.", "requiredField"],
  ["Password must be at least 6 characters long.", "passwordTooShort"],
  ["Username must be at least 3 characters long.", "usernameTooShort"],
  ["Username must be at most 20 characters long.", "usernameTooLong"],
  ["Please enter an API key.", "apiKeyRequired"],
  ["API key must be at most 255 characters long.", "apiKeyTooLong"],
  ["This email address is already in use.", "emailAlreadyInUse"],
  ["Invalid email or password.", "invalidEmailOrPassword"],
]);

export function getAuthErrorKey(message: unknown, fallback: TranslationKey): TranslationKey {
  return typeof message === "string" ? (authErrors.get(message) ?? fallback) : fallback;
}
