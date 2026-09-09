"use server";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { generateCodeChallenge, generateCodeVerifier } from "./pkce";
import prisma from "../prisma/prisma";
import { Role } from "@/prisma/generated/prisma/enums";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function createJWT(payload: object): Promise<string> {
  return jwt.sign(payload, JWT_SECRET);
}

export interface TokenPayload extends jwt.JwtPayload {
  userId: string;
  email?: string;
  fullName?: string;
  rollNumber?: string;
  role?: string;
  id?: string;
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (typeof payload === "string" || !("userId" in payload)) {
      return null;
    }

    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value;
}

export async function getSession(): Promise<TokenPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return verifyToken(token);
}

export async function checkExistingSession(): Promise<boolean> {
  try {
    const session = await getSession();
    return session !== null && !!session.userId;
  } catch (error) {
    console.error("checkExistingSession error:", error);
    return false;
  }
}

export async function handleLoginInit(): Promise<{
  hasSession: boolean;
  redirectUrl: string;
}> {
  try {
    const session = await getSession();
    if (session && session.userId) {
      return { hasSession: true, redirectUrl: "/dashboard" };
    }
  } catch (err) {
    console.error("Error checking session in handleLoginInit:", err);
  }

  const ssoUrl = await loginWithSSO();
  return { hasSession: false, redirectUrl: ssoUrl };
}

export async function loginWithSSO() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const cookieStore = await cookies();

  // Keep verifier server-side
  cookieStore.set("sso_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 5 * 60,
  });

  const params = new URLSearchParams({
    callBack: process.env.SSO_CLIENT_ID!,
    challenge: codeChallenge,
  });

  return `${process.env.SSO_URL}?${params.toString()}`;
}

export const fetchSSOToken = async (code: string) => {
  try {
    const cookieStore = await cookies();
    const codeVerifier = cookieStore.get("sso_code_verifier")?.value;

    if (!codeVerifier) {
      console.warn("fetchSSOToken: sso_code_verifier cookie is missing");
      return {
        success: false,
        message: "Code verifier parameter is missing. Please log in again.",
      };
    }

    const res = await fetch(`${process.env.SSO_URL}/api/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, code_verifier: codeVerifier }),
    });

    const data = await res.json();

    if (!data.success || !data.user) {
      throw new Error(data.message || "SSO token verification failed");
    }

    // Delete verification cookie
    cookieStore.delete("sso_code_verifier");

    const ssoUser = data.user;
    const ssoId = String(ssoUser.userId || ssoUser.ssoId || ssoUser.id);

    if (!ssoId) {
      throw new Error("Invalid SSO user payload: missing user ID");
    }

    const roleMap: Record<string, Role> = {
      student: Role.STUDENT,
      faculty: Role.FACULTY,
      hod: Role.HOD,
      admin: Role.ADMIN,
      super_admin: Role.SUPER_ADMIN,
    };

    const ssoRole = ssoUser.role ? String(ssoUser.role).toLowerCase() : "";
    const role: Role = roleMap[ssoRole] || Role.STUDENT;

    // Find existing user by ssoId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { ssoId: ssoId },
          ...(ssoUser.email ? [{ email: ssoUser.email }] : []),
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          ssoId: ssoId,
          email: ssoUser.email || `${ssoId}@sbsstc.ac.in`,
          fullName: ssoUser.fullName || ssoUser.name || "User",
          rollNumber: ssoUser.rollNumber || null,
          mobileNumber: ssoUser.mobileNumber || null,
          role: role,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ssoId: ssoId,
          ...(ssoUser.fullName || ssoUser.name
            ? { fullName: ssoUser.fullName || ssoUser.name }
            : {}),
          ...(ssoUser.email ? { email: ssoUser.email } : {}),
          ...(ssoUser.rollNumber ? { rollNumber: ssoUser.rollNumber } : {}),
          ...(ssoUser.mobileNumber ? { mobileNumber: ssoUser.mobileNumber } : {}),
        },
      });
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

    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    console.log("SSO LOGIN: Authenticated user", user.id, "(internal ID saved to JWT)");

    return { success: true, user };
  } catch (error: any) {
    console.error("fetchSSOToken error:", error);
    return {
      success: false,
      message: error?.message || "Failed to authenticate with SSO",
    };
  }
};

