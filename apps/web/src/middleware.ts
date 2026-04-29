import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/modules", "/settings"];
const AUTH_ROUTES = ["/login", "/register", "/onboarding"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // Subdomain routing
  const isAppSubdomain = hostname.startsWith("app.");

  // If accessing root domain without www → redirect to www
  if (hostname === "modulajar.app") {
    const url = request.nextUrl.clone();
    url.hostname = "www.modulajar.app";
    return NextResponse.redirect(url);
  }

  // App subdomain: redirect / to /dashboard if not auth'd
  if (isAppSubdomain && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  let user: { id: string } | null = null;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseKey) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const accessToken = request.cookies.get("sb-access-token")?.value;
      const refreshToken = request.cookies.get("sb-refresh-token")?.value;

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!sessionError) {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          user = authUser;
        }
      }

      // Admin route check
      if (user && pathname.startsWith("/admin")) {
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role !== "super_admin") {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
    }
  } catch (err) {
    console.warn("[middleware] Auth check failed:", err);
  }

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
