import { NextRequest, NextResponse } from "next/server";

const ADMIN_USERNAME = "admin";

// Manual constant-time compare - portable regardless of runtime.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="asgkit admin"' },
  });
}

export function proxy(request: NextRequest) {
  // Public: student uploads must never require the admin password.
  if (request.nextUrl.pathname === "/api/submissions" && request.method === "POST") {
    return NextResponse.next();
  }

  const expectedPassword = process.env.ADMIN_PASSWORD ?? "";
  if (!expectedPassword) {
    // Fail closed - a missing env var must never mean "no password required".
    return unauthorized();
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = Buffer.from(authHeader.slice(6), "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");
    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);
    if (safeEqual(username, ADMIN_USERNAME) && safeEqual(password, expectedPassword)) {
      return NextResponse.next();
    }
  }

  return unauthorized();
}

export const config = {
  matcher: ["/admin/:path*", "/api/courses/:path*", "/api/workshops/:path*", "/api/submissions"],
};
