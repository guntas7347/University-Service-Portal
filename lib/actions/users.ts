"use server";

import { db, User, Department, eq, or, Gender } from "@/db/drizzel";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/auth";
import { type SSOUserPayload } from "@/lib/auth/sso";

/**
 * Upsert a user based on SSO profile payload and allot department based on specialization
 */
export async function upsertUser(ssoUser: SSOUserPayload) {
  if (!ssoUser) {
    throw new Error("Empty user payload returned from SSO");
  }

  // Determine unique user identifier from SSO
  const ssoId = String(ssoUser.username || ssoUser.email || "").trim();
  if (!ssoId) {
    throw new Error("Invalid SSO user payload: missing user identifier");
  }

  const role = ssoUser.role ? String(ssoUser.role).toUpperCase() : "STUDENT";

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
    (ssoUser.username
      ? `${ssoUser.username}@sbsstc.ac.in`
      : `${ssoId}@sbsstc.ac.in`)
  )
    .trim()
    .toLowerCase();

  const username = ssoUser.username || null;
  const fullName = ssoUser.fullName || null;
  const fatherName = ssoUser.fatherName || null;
  const degree = ssoUser.degree || null;
  const specialization = ssoUser.specialization?.trim() || null;
  const mobile = ssoUser.mobile || null;
  const photo = ssoUser.photo || null;
  const rollNumber = ssoUser.username || "";
  const mobileNumber = ssoUser.mobile || null;
  const profileImage = ssoUser.photo || null;

  // Check if specialization matches any department's specializations array
  let allottedDepartmentId: string | null = null;
  if (specialization) {
    const allDepartments = await db.query.Department.findMany();
    const specLower = specialization.toLowerCase();
    const matchedDept = allDepartments.find((d) =>
      d.specializations?.some((s) => s.trim().toLowerCase() === specLower),
    );
    if (matchedDept) {
      allottedDepartmentId = matchedDept.id;
    }
  }

  // Look up existing user by ssoId, email, username, or rollNumber
  const lookupConditions = [eq(User.ssoId, ssoId)];
  if (email) {
    lookupConditions.push(eq(User.email, email));
  }
  if (username) {
    lookupConditions.push(eq(User.username, username));
  }
  if (rollNumber) {
    lookupConditions.push(eq(User.rollNumber, rollNumber));
  }

  let user = await db.query.User.findFirst({
    where: or(...lookupConditions),
  });

  if (!user) {
    const [newUser] = await db
      .insert(User)
      .values({
        ssoId,
        username,
        fullName,
        fatherName,
        role,
        email,
        degree,
        specialization,
        mobile,
        photo,
        rollNumber,
        mobileNumber,
        profileImage,
        departmentId: allottedDepartmentId,
        rights: initialRights,
      })
      .returning();
    user = newUser;
    console.log(
      "SSO Callback: Created new user account:",
      user.id,
      user.email,
      "Allotted department:",
      allottedDepartmentId,
    );
  } else {
    const updateData: Partial<typeof User.$inferInsert> = {
      ssoId,
    };
    if (username) updateData.username = username;
    if (fullName) updateData.fullName = fullName;
    if (fatherName) updateData.fatherName = fatherName;
    if (role) updateData.role = role;
    if (email) updateData.email = email;
    if (degree) updateData.degree = degree;
    if (specialization) {
      updateData.specialization = specialization;
      updateData.departmentId = allottedDepartmentId;
    }
    if (mobile) {
      updateData.mobile = mobile;
      updateData.mobileNumber = mobile;
    }
    if (photo) {
      updateData.photo = photo;
      updateData.profileImage = photo;
    }
    if (rollNumber) updateData.rollNumber = rollNumber;

    const [updatedUser] = await db
      .update(User)
      .set(updateData)
      .where(eq(User.id, user.id))
      .returning();
    user = updatedUser;
    console.log(
      "SSO Callback: Updated existing user account:",
      user.id,
      user.email,
      "Allotted department:",
      user.departmentId,
    );
  }

  return user;
}

/**
 * Delete session cookie
 */
export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("token");
    return { success: true, message: "Logged out successfully!" };
  } catch (error: any) {
    console.error("Error during logout:", error);
    return {
      success: false,
      message: "Failed to clear authentication cookie.",
    };
  }
}

/**
 * Fetch profile data of currently logged-in user
 */
export async function getProfile() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return {
        success: false,
        message: "Not authenticated. Session cookie missing.",
      };
    }

    const payload = await verifyToken(token);

    if (!payload || !payload.userId) {
      return { success: false, message: "Invalid or expired session token." };
    }

    const user = await db.query.User.findFirst({
      where: eq(User.id, payload.userId),
      with: {
        department: true,
      },
    });

    if (!user) {
      return { success: false, message: "User account could not be found." };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.fullName || "",
        username: user.username || "",
        fatherName: user.fatherName || "",
        rollNumber: user.rollNumber || "",
        mobileNumber: user.mobile || user.mobileNumber || "",
        dob: user.dateOfBirth
          ? user.dateOfBirth.toISOString().split("T")[0]
          : "",
        gender: user.gender || "",
        degree: user.degree || "",
        specialization: user.specialization || "",
        enrolledCourse:
          [user.degree, user.specialization]
            .filter(Boolean)
            .map((s) => String(s).trim())
            .filter(Boolean)
            .join(" "),
        photo: user.photo || user.profileImage || "",
        role: user.role,
        designation: user.designation || "",
        departmentId: user.departmentId || "",
        departmentName: user.department?.name || "",
        rights: user.rights || [],
      },
    };
  } catch (error: any) {
    console.error("Error retrieving user profile:", error);
    return {
      success: false,
      message: "Internal server error while fetching profile.",
    };
  }
}

/**
 * Update authenticated user's profile
 */
export async function updateUserProfile(data: {
  name: string;
  email: string;
  mobileNumber?: string;
  dob?: string;
  gender?: string;
  enrolledCourse?: string;
  degree?: string;
  specialization?: string;
  designation?: string;
}) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return { success: false, message: "Not authenticated." };
    }

    const payload = await verifyToken(token);
    if (!payload || !payload.userId) {
      return { success: false, message: "Invalid session." };
    }

    // 1. Map Gender string to Enum
    let genderEnum: Gender | null = null;
    if (data.gender) {
      const upperGender = data.gender.toUpperCase();
      if (upperGender === "MALE") genderEnum = Gender.MALE;
      else if (upperGender === "FEMALE") genderEnum = Gender.FEMALE;
      else if (upperGender === "OTHER") genderEnum = Gender.OTHER;
      else genderEnum = Gender.PREFER_NOT_TO_SAY;
    }

    // 2. Update database record
    const dateOfBirth = data.dob ? new Date(data.dob) : null;
    const mobileValue = data.mobileNumber || null;

    const [updatedUser] = await db
      .update(User)
      .set({
        fullName: data.name,
        email: data.email,
        mobile: mobileValue,
        mobileNumber: mobileValue,
        dateOfBirth,
        gender: genderEnum,
        degree: data.degree || undefined,
        specialization: data.specialization || data.enrolledCourse || undefined,
        designation: data.designation || null,
      })
      .where(eq(User.id, payload.userId))
      .returning();

    console.log(
      "Successfully updated profile for user:",
      updatedUser?.email,
      updatedUser,
    );
    return { success: true, message: "Profile details updated successfully!" };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      message: "Failed to update profile details.",
    };
  }
}
