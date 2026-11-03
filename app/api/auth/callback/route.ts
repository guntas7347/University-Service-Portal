import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForUser } from "@/lib/auth/sso";
import { createJWT, TokenPayload } from "@/lib/auth/auth";
import { upsertUser } from "@/lib/actions/users";

export const runtime = "nodejs";

function getPublicOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host");
  const proto = req.headers.get("x-forwarded-proto");

  if (!host || !proto) {
    throw new Error("Missing forwarded host or protocol");
  }

  // Reject comma-separated values rather than guessing which proxy value
  // represents the public request.
  if (host.includes(",") || proto.includes(",") || /[\s/@\\?#]/.test(host)) {
    throw new Error("Invalid forwarded host or protocol");
  }

  if (proto !== "https" && proto !== "http") {
    throw new Error("Invalid forwarded protocol");
  }

  const url = new URL(`${proto}://${host}`);

  if (
    url.hostname.length === 0 ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("Invalid forwarded origin");
  }

  // Configure your reverse proxy to overwrite forwarded headers and
  // prevent untrusted clients from reaching the app directly.
  return url.origin;
}

async function processCallback(req: NextRequest, code: string | null) {
  if (!code) {
    console.warn("SSO Callback: No authorization code received in request.");
    const origin = getPublicOrigin(req);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "Missing authorization code from SSO");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const ssoUser = await exchangeCodeForUser(code);

    if (!ssoUser) {
      throw new Error("Empty user payload returned from SSO");
    }

    const user = await upsertUser(ssoUser);

    // Embed internal database user ID (user.id) in session JWT payload
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName || undefined,
      rollNumber: user.rollNumber || undefined,
      role: user.role,
    };

    const token = await createJWT(payload);

    // Determine target redirect URL
    const stateParam =
      req.nextUrl.searchParams.get("state") ||
      req.nextUrl.searchParams.get("redirect");
    const destination =
      stateParam && stateParam.startsWith("/") && !stateParam.startsWith("//")
        ? stateParam
        : "/dashboard";

    const origin = getPublicOrigin(req);
    const finalRedirectUrl = new URL(destination, origin).toString();
    const response = NextResponse.redirect(finalRedirectUrl);

    // Persist 7-day session token cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    console.log(
      "SSO Callback: Successfully authenticated user",
      user.id,
      "- redirecting to",
      destination,
    );
    return response;
  } catch (error: unknown) {
    console.error("SSO Callback error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to complete SSO authentication";
    const origin = getPublicOrigin(req);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", message);
    return NextResponse.redirect(loginUrl);
  }
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  return processCallback(req, code);
}

export async function POST(req: NextRequest) {
  let code = req.nextUrl.searchParams.get("code");

  if (!code) {
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await req.json();
        code = body?.code || null;
      } else if (
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data")
      ) {
        const formData = await req.formData();
        code = (formData.get("code") as string) || null;
      }
    } catch (err) {
      console.warn("SSO Callback: Failed to parse POST body:", err);
    }
  }

  return processCallback(req, code);
}
