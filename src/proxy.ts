import { NextResponse, type NextRequest } from "next/server";
import { getIronSession, nextProxyCookies } from "iron-session";
import { adminSessionOptions, type AdminSession } from "@/lib/auth";

/**
 * First line of defence for the admin panel: anyone without a valid admin
 * session cookie is blocked here, before any page or API route runs. Pages and
 * routes also re-check the admin against the database.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  if (!isAdminPage && !isAdminApi) return NextResponse.next();

  const response = NextResponse.next();
  const session = await getIronSession<AdminSession>(nextProxyCookies(request, response), adminSessionOptions).catch(() => null);
  const isAdmin = Boolean(session?.isLoggedIn && session?.userId);

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    if (isAdmin && pathname === "/admin/login") return NextResponse.redirect(new URL("/admin", request.url));
    return response;
  }

  if (!isAdmin) {
    if (isAdminApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return response;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
