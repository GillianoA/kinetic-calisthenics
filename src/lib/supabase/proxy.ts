import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicSupabaseEnv, isSupabaseConfigured } from "@/lib/env";

const protectedPrefixes = [
  "/dashboard",
  "/workouts",
  "/skills",
  "/measurements",
  "/progress",
  "/compare",
  "/goals",
  "/activity",
  "/settings",
  "/join",
];

// Recovery links establish a short-lived authenticated session before landing
// on /reset-password, so that route must remain reachable while signed in.
const authPrefixes = ["/login", "/register", "/forgot-password"];

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured) {
    if (protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("setup", "required");
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request });
  }

  const { url, anonKey } = getPublicSupabaseEnv();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthRoute = authPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
