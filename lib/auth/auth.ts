"use server";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { generateCodeChallenge, generateCodeVerifier } from "./pkce";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function createJWT(payload: object): Promise<string> {
  return jwt.sign(payload, JWT_SECRET);
}

interface TokenPayload extends jwt.JwtPayload {
  userId: string;
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
    const cookieStores = await cookies();
    const codeVerifier = cookieStores.get("sso_code_verifier")?.value;

    const res = await fetch(`${process.env.SSO_URL}/api/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, code_verifier: codeVerifier }),
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    const token = await createJWT(data.user);

    const cookieStore = await cookies();

    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    console.log("SSO LOGIN TOKEN SAVED");

    return data.user;
  } catch (error) {
    console.log(error);
  }
};
