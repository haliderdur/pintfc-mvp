import { NextResponse } from "next/server";

// The one error shape every Route Handler returns (api.md, rules.md §4).
export type ErrorCode =
  | "INVALID_CREDENTIALS"
  | "UNAUTHENTICATED"
  | "RSVP_CUTOFF_PASSED"
  | "NOT_FOUND"
  | "FORBIDDEN_MINOR_CONSENT"
  | "VALIDATION_ERROR";

export function errorResponse(code: ErrorCode, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}
