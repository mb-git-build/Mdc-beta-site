import { NextResponse, type NextRequest } from "next/server";

import { describeAdminAuthRequirement, isAdminRequestAuthorized } from "@/lib/admin-auth";

function buildUnauthorizedResponse(requestedPath: string, isApiRoute: boolean) {
  const requirement = describeAdminAuthRequirement();

  const headers = {
    "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"',
    "Cache-Control": "no-store, no-cache, must-revalidate",
  };

  if (!requirement.authEnabled) {
    return isApiRoute
      ? NextResponse.json(
          {
            ok: false,
            error: "Missing admin auth credentials",
            message: `Admin route ${requestedPath} is intentionally protected in this environment.`,
            path: requestedPath,
          },
          { status: 401, headers },
        )
      : new NextResponse("Admin route is protected and credentials are not configured.", {
          status: 401,
          headers,
        });
  }

  if (isApiRoute) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
        message: `Admin API access requires authentication for ${requestedPath}.`,
      },
      { status: 401, headers },
    );
  }

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: {
      ...headers,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const isAdminArea = url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/admin");

  if (!isAdminArea) {
    return NextResponse.next();
  }

  const authorized = isAdminRequestAuthorized(request);
  if (authorized) {
    return NextResponse.next();
  }

  const isApiRoute = url.pathname.startsWith("/api/");
  return buildUnauthorizedResponse(url.pathname, isApiRoute);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
