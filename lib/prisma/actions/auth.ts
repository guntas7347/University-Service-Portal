"use server";

import prisma from "../prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/auth";

/**
 * Retrieve current authenticated user from session token
 */
export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) return null;

    return await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        department: true,
        course: true,
      },
    });
  } catch (err) {
    console.error("Error retrieving authenticated user:", err);
    return null;
  }
}

/**
 * Require authenticated user or throw an authentication error
 */
export async function requireUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("Insufficient rights: User not authenticated");
  }
  return user;
}

/**
 * Centralized rights checker function.
 * Throws an Error with "Insufficient rights" if the user lacks the required permission(s).
 *
 * @param requiredRights Array of right strings or a single right string (e.g. ["MANAGE_USERS", "MANAGE_DEPARTMENT"] or "MANAGE_CONFIGS")
 * @param options.requireAll If true, requires user to possess all listed rights. Defaults to false (requires at least one).
 * @returns The authenticated user object
 */
export async function requireRights(
  requiredRights: string | string[],
  options: { requireAll?: boolean } = { requireAll: false }
) {
  const user = await requireUser();
  const rights: string[] = user.rights || [];

  // ADMIN right automatically satisfies any rights requirement
  if (rights.includes("ADMIN")) {
    return user;
  }

  const reqArray = Array.isArray(requiredRights) ? requiredRights : [requiredRights];

  if (reqArray.length === 0) {
    return user;
  }

  const hasAccess = options.requireAll
    ? reqArray.every((r) => rights.includes(r))
    : reqArray.some((r) => rights.includes(r));

  if (!hasAccess) {
    throw new Error("Insufficient rights");
  }

  return user;
}

/**
 * Check if user possesses given rights (non-throwing helper)
 */
export async function hasRights(
  userRights: string[],
  requiredRights: string | string[],
  options: { requireAll?: boolean } = { requireAll: false }
): Promise<boolean> {
  if (userRights.includes("ADMIN")) return true;
  const reqArray = Array.isArray(requiredRights) ? requiredRights : [requiredRights];
  if (reqArray.length === 0) return true;

  return options.requireAll
    ? reqArray.every((r) => userRights.includes(r))
    : reqArray.some((r) => userRights.includes(r));
}
