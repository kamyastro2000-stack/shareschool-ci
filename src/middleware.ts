import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = [
  "/login", "/register", "/verify-email", "/",
  "/api/auth", "/api/establishments", "/api/classes",
  "/api/register", "/api/verify-email", "/api/check-account",
];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith("/api/auth")
  );

  const token = req.cookies.get("next-auth.session-token")
    || req.cookies.get("__Secure-next-auth.session-token");

  if (!token && !isPublicPath) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/api/admin") && !token) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  if (pathname.startsWith("/admin") && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
