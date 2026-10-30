import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForUser } from "@/lib/auth/sso";
import { createJWT, TokenPayload } from "@/lib/auth/auth";
import prisma from "@/lib/prisma/prisma";

export const runtime = "nodejs";

async function processCallback(req: NextRequest, code: string | null) {
  if (!code) {
    console.warn("SSO Callback: No authorization code received in request.");
    return NextResponse.redirect(
      new URL("/login?error=" + encodeURIComponent("Missing authorization code from SSO"), req.url),
    );
  }

  try {
    console.log("SSO Callback: Exchanging authorization code for user profile...");
    const ssoUser = await exchangeCodeForUser(code);

    if (!ssoUser) {
      throw new Error("Empty user payload returned from SSO");
    }

    // Determine unique user identifier from SSO
    const ssoId = String(
      ssoUser.ssoId ||
      ssoUser.userId ||
      ssoUser.id ||
      ssoUser.username ||
      ssoUser.email ||
      "",
    ).trim();

    if (!ssoId) {
      throw new Error("Invalid SSO user payload: missing user identifier");
    }

    const ssoRole = ssoUser.role
      ? String(ssoUser.role).toUpperCase()
      : "STUDENT";
    const role: string = ssoRole || "STUDENT";

    // Set initial administrative rights if new administrator/super_admin
    const initialRights =
      role === "ADMIN" || role === "SUPER_ADMIN"
        ? [
            "ADMIN",
            "MANAGE_CONFIGS",
            "MANAGE_DEPARTMENT",
            "MANAGE_USERS",
            "MANAGE_STUDENTS",
            "MANAGE_ROUTING",
            "RESOLVE_GRIEVANCES",
            "VIEW_ALL_REQUESTS",
          ]
        : [];

    const email = (
      ssoUser.email ||
      (ssoUser.username ? `${ssoUser.username}@sbsstc.ac.in` : `${ssoId}@sbsstc.ac.in`)
    ).trim().toLowerCase();

    const fullName =
      ssoUser.fullName ||
      ssoUser.name ||
      ssoUser.username ||
      "User";

    const rollNumber =
      ssoUser.rollNumber ||
      (role === "STUDENT" && ssoUser.username ? ssoUser.username : null) ||
      (ssoUser.username && /^\d+$/.test(ssoUser.username) ? ssoUser.username : null);

    const mobileNumber = ssoUser.mobileNumber || ssoUser.mobile || null;
    const profileImage = ssoUser.photoUrl || ssoUser.photo || null;

    // Look up existing user by ssoId, email, or rollNumber
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { ssoId },
          ...(email ? [{ email }] : []),
          ...(rollNumber ? [{ rollNumber }] : []),
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          ssoId,
          email,
          fullName,
          rollNumber,
          mobileNumber,
          profileImage,
          role,
          rights: initialRights,
        },
      });
      console.log("SSO Callback: Created new user account:", user.id, user.email);
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ssoId,
          ...(fullName ? { fullName } : {}),
          ...(email ? { email } : {}),
          ...(rollNumber ? { rollNumber } : {}),
          ...(mobileNumber ? { mobileNumber } : {}),
          ...(profileImage ? { profileImage } : {}),
        },
      });
      console.log("SSO Callback: Updated existing user account:", user.id, user.email);
    }

    // Embed internal database user ID (user.id) in session JWT payload
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      rollNumber: user.rollNumber || undefined,
      role: user.role,
    };

    const token = await createJWT(payload);

    // Determine target redirect URL
    const stateParam = req.nextUrl.searchParams.get("state") || req.nextUrl.searchParams.get("redirect");
    const destination =
      stateParam && stateParam.startsWith("/") && !stateParam.startsWith("//")
        ? stateParam
        : "/dashboard";

    const response = NextResponse.redirect(new URL(destination, req.url));

    // Persist 7-day session token cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    console.log("SSO Callback: Successfully authenticated user", user.id, "- redirecting to", destination);
    return response;
  } catch (error: unknown) {
    console.error("SSO Callback error:", error);
    const message = error instanceof Error ? error.message : "Failed to complete SSO authentication";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, req.url),
    );
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
