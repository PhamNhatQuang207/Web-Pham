import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = ["/", "/login", "/tree"];
const ADMIN_ROUTES = ["/admin"];
const EDITOR_ROUTES = ["/edit", "/members/create"];

export default auth(function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // @ts-expect-error - auth augments the request
  const session = req.auth;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user?.role;

  // Admin-only routes
  if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Editor and above routes
  if (EDITOR_ROUTES.some((route) => pathname.startsWith(route))) {
    if (role !== "ADMIN" && role !== "EDITOR") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
