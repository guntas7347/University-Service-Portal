export interface SSOUserPayload {
  username?: string;
  fullName?: string;
  name?: string;
  fatherName?: string;
  role?: string;
  email: string;
  degree?: string;
  specialization?: string;
  mobile?: string;
  photo?: string;
  photoUrl?: string;
  [key: string]: any;
}

export interface SSOTokenResponse {
  success: boolean;
  message?: string;
  user?: SSOUserPayload;
}

export function getNormalizedSsoUrl(): string {
  const rawUrl =
    process.env.NEXT_PUBLIC_SSO_URL ||
    process.env.SSO_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "https://sso.sbssu.ac.in";
  let url = (rawUrl || "").trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `http://${url}`;
  }
  return url.replace(/\/+$/, "");
}

export const getSSOUrl = (customClientId?: string) => {
  const baseUrl = getNormalizedSsoUrl();
  const clientId =
    customClientId ||
    process.env.NEXT_PUBLIC_SSO_CLIENT_ID ||
    process.env.SSO_CLIENT_ID ||
    "grievance-dev-live";
  return `${baseUrl}/?callBack=${encodeURIComponent(clientId)}`;
};

export async function exchangeCodeForUser(
  code: string,
): Promise<SSOUserPayload> {
  const baseUrl = getNormalizedSsoUrl();

  // Try /api/auth/token/s1 first, then fallback to /api/token/s1 if 404
  const primaryEndpoint = `${baseUrl}/api/auth/token/s1`;
  const fallbackEndpoint = `${baseUrl}/api/token/s1`;

  let res = await fetch(primaryEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
    cache: "no-store",
  });

  if (res.status === 404) {
    res = await fetch(fallbackEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(
      errorBody.message ||
        `SSO token exchange failed with status ${res.status}`,
    );
  }

  const data: SSOTokenResponse = await res.json();
  if (!data.success || !data.user) {
    throw new Error(data.message || "Invalid or missing user payload from SSO");
  }

  return data.user;
}
