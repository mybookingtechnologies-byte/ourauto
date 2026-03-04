const CSRF_COOKIE_NAME = "ourauto_csrf";

export function getCsrfTokenFromDocumentCookie() {
  if (typeof document === "undefined") {
    return "";
  }

  const token = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CSRF_COOKIE_NAME}=`));

  if (!token) {
    return "";
  }

  return decodeURIComponent(token.split("=").slice(1).join("="));
}

export function withCsrfHeaders(headers: HeadersInit = {}) {
  const token = getCsrfTokenFromDocumentCookie();
  const nextHeaders = new Headers(headers);

  if (token) {
    nextHeaders.set("x-csrf-token", token);
  }

  return nextHeaders;
}
