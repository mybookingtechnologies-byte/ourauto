import { NextResponse } from "next/server";

export function success<T>(data: T): NextResponse {
  return NextResponse.json({
    success: true,
    data,
  });
}

export function failure(message: string, status = 400): NextResponse {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status },
  );
}
