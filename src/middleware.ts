import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const publicPaths = ["/login", "/register", "/verify-email", "/", "/api/auth", "/api/establishments", "/api/classes", "/api/register", "/api/verify-email", "/api/check-account"];

  const isPublicPath = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname.startsWith("/api/auth")
  );

  if (!isLoggedIn && !isPublicPath) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/api/admin") && role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
