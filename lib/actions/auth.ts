"use server";

import { db, User, eq } from "@/db/drizzel";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/auth";

/**
 * Retrieve current authenticated user from session token.
 */
export async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) return null;

    const payload = await verifyToken(token);

    if (!payload?.userId) return null;

    const user = await db.query.User.findFirst({
      where: eq(User.id, payload.userId),
      with: {
        department: true,
        managedDepartment: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      managedDepartment: user.managedDepartment?.[0] || null,
    };
  } catch (err) {
    console.error("Error retrieving authenticated user:", err);
    return null;
  }
}

/**
 * Require authenticated user or throw an authentication error.
 */
export async function requireUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Centralized rights checker.
 *
 * ADMIN automatically satisfies all permission requirements.
 *
 * @param requiredRights Single right or array of rights.
 * @param options.requireAll If true, requires all rights.
 *                     Otherwise, requires at least one.
 * @returns Authenticated user.
 */
export async function requireRights(
  requiredRights: string | string[],
  options: { requireAll?: boolean } = {},
) {
  const user = await requireUser();
  const rights: string[] = user.rights || [];

  // ADMIN automatically has all permissions.
  if (rights.includes("ADMIN")) {
    return user;
  }

  const reqArray = Array.isArray(requiredRights)
    ? requiredRights
    : [requiredRights];

  if (reqArray.length === 0) {
    return user;
  }

  const hasAccess = options.requireAll
    ? reqArray.every((right) => rights.includes(right))
    : reqArray.some((right) => rights.includes(right));

  if (!hasAccess) {
    throw new Error("Insufficient rights");
  }

  return user;
}

/**
 * Check whether a user possesses the required rights.
 * Non-throwing helper for conditional UI rendering.
 */
export async function hasRights(
  userRights: string[],
  requiredRights: string | string[],
  options: { requireAll?: boolean } = {},
): Promise<boolean> {
  if (userRights.includes("ADMIN")) {
    return true;
  }

  const reqArray = Array.isArray(requiredRights)
    ? requiredRights
    : [requiredRights];

  if (reqArray.length === 0) {
    return true;
  }

  return options.requireAll
    ? reqArray.every((right) => userRights.includes(right))
    : reqArray.some((right) => userRights.includes(right));
}
