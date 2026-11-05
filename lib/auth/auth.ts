"use server";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { generateCodeChallenge, generateCodeVerifier } from "./pkce";
import { getSSOUrl } from "./sso";
import { db, User, eq, or } from "@/db/drizzel";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function createJWT(payload: object): Promise<string> {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "6h" });
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

  const ssoUrl = await getSSOUrl();
  return { hasSession: false, redirectUrl: ssoUrl };
}
