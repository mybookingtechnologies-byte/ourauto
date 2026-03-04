import crypto from "node:crypto";
import { NextResponse } from "next/server";

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiError = {
  success: false;
  error: string;
};

export function ok<T>(data: T, status = 200) {
  const payload: ApiSuccess<T> = {
    success: true,
    data,
  };

  const response = NextResponse.json(payload, { status });
  response.headers.set("x-request-id", crypto.randomUUID());
  return response;
}

export function fail(error: string, status: number) {
  const payload: ApiError = {
    success: false,
    error,
  };

  const response = NextResponse.json(payload, { status });
  response.headers.set("x-request-id", crypto.randomUUID());
  return response;
}
