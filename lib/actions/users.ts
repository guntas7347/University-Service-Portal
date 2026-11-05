"use server";

import {
  db,
  User,
  Department,
  eq,
  or,
  Gender,
  isNull,
  and,
} from "@/db/drizzel";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/auth";
import { type SSOUserPayload } from "@/lib/auth/sso";
import { getAuthenticatedUser, requireRights, requireUser } from "./auth";

/**
 * Upsert a user based on SSO profile payload and allot department based on specialization
 */
export async function upsertUser(ssoUser: SSOUserPayload) {
  if (!ssoUser) {
    throw new Error("Empty user payload returned from SSO");
  }

  console.log("SSO Payload received:", ssoUser);

  // Determine unique user identifier from SSO
  const ssoId = String(ssoUser.username || ssoUser.email || "").trim();
  if (!ssoId) {
    throw new Error("Invalid SSO user payload: missing user identifier");
  }

  const role = ssoUser.role ? String(ssoUser.role).toUpperCase() : "STUDENT";
  const initialRights = role === "ADMIN" || role === "SUPER_ADMIN" ? ["ADMIN"] : [];

  const email = (
    ssoUser.email ||
    (ssoUser.username
      ? `${ssoUser.username}@sbsstc.ac.in`
      : `${ssoId}@sbsstc.ac.in`)
  )
    .trim()
    .toLowerCase();

  const username = ssoUser.username?.trim() || null;
  const fullName = ssoUser.fullName?.trim() || null;
  const fatherName = ssoUser.fatherName?.trim() || null;
  const degree = ssoUser.degree?.trim() || null;
  const specialization = ssoUser.specialization?.trim() || null;
  const mobile = ssoUser.mobile?.trim() || null;
  const photo = ssoUser.photo?.trim() || null;
  const rollNumber = ssoUser.username?.trim() || "";

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
  if (email) lookupConditions.push(eq(User.email, email));
  if (username) lookupConditions.push(eq(User.username, username));
  if (rollNumber) lookupConditions.push(eq(User.rollNumber, rollNumber));

  let user = await db.query.User.findFirst({
    where: or(...lookupConditions),
  });

  if (!user) {
    // ----------------------------------------------------
    // CREATE NEW USER
    // ----------------------------------------------------
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
        departmentId: allottedDepartmentId,
        rights: initialRights,
        status: "ACTIVE",
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
    // ----------------------------------------------------
    // UPDATE EXISTING USER (Only if changed and not empty)
    // ----------------------------------------------------
    const updateData: Partial<typeof User.$inferInsert> = {};

    // Helper to apply changes only if the new value is valid and different
    const setIfChanged = (key: keyof typeof updateData, newValue: any) => {
      if (newValue !== null && newValue !== undefined && newValue !== "") {
        // @ts-ignore - Dynamically checking keys
        if (user[key] !== newValue) {
          // @ts-ignore
          updateData[key] = newValue;
        }
      }
    };

    setIfChanged("ssoId", ssoId);
    setIfChanged("username", username);
    setIfChanged("fullName", fullName);
    setIfChanged("fatherName", fatherName);
    // setIfChanged("role", role);
    setIfChanged("email", email);
    setIfChanged("degree", degree);
    setIfChanged("mobile", mobile);
    setIfChanged("photo", photo);
    setIfChanged("rollNumber", rollNumber);

    // Special handling for specialization & department
    if (specialization && specialization !== user.specialization) {
      updateData.specialization = specialization;
      
      // ONLY update departmentId if we successfully matched a new department.
      // This prevents overwriting a manually assigned department with 'null'.
      if (allottedDepartmentId && allottedDepartmentId !== user.departmentId) {
        updateData.departmentId = allottedDepartmentId;
      }
    }

    // Only make the DB call if there are actual fields to update
    if (Object.keys(updateData).length > 0) {
      const [updatedUser] = await db
        .update(User)
        .set(updateData)
        .where(eq(User.id, user.id))
        .returning();
        
      user = updatedUser;
      console.log(
        "SSO Callback: Updated existing user account:",
        user.id,
        "Changed fields:",
        Object.keys(updateData)
      );
    } else {
      console.log(
        "SSO Callback: No changes detected for user, skipping DB update:",
        user.id,
        user.email
      );
    }
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
        email2: user.email2 || "",
        name: user.fullName || "",
        username: user.username || "",
        fatherName: user.fatherName || "",
        rollNumber: user.rollNumber || "",
        mobile: user.mobile || user.mobile || "",
        dob: user.dateOfBirth
          ? user.dateOfBirth.toISOString().split("T")[0]
          : "",
        gender: user.gender || "",
        degree: user.degree || "",
        specialization: user.specialization || "",
        enrolledCourse: [user.degree, user.specialization]
          .filter(Boolean)
          .map((s) => String(s).trim())
          .filter(Boolean)
          .join(" "),
        photo: user.photo || "",
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
 * Update authenticated user's secondary (personal) email
 */
export async function updateSecondaryEmail(email2: string) {
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

    const trimmed = (email2 || "").trim();

    // If clearing secondary email
    if (!trimmed) {
      await db
        .update(User)
        .set({ email2: null })
        .where(eq(User.id, payload.userId));

      return {
        success: true,
        message: "Secondary personal email removed.",
        email2: "",
      };
    }

    // Format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return {
        success: false,
        message: "Please enter a valid email address.",
      };
    }

    // Ensure it is not identical to primary email
    const currentUser = await db.query.User.findFirst({
      where: eq(User.id, payload.userId),
      columns: { email: true },
    });

    if (
      currentUser &&
      currentUser.email.toLowerCase() === trimmed.toLowerCase()
    ) {
      return {
        success: false,
        message:
          "Secondary email cannot be the same as your primary registered university email.",
      };
    }

    await db
      .update(User)
      .set({ email2: trimmed.toLowerCase() })
      .where(eq(User.id, payload.userId));

    return {
      success: true,
      message: "Secondary personal email updated successfully!",
      email2: trimmed.toLowerCase(),
    };
  } catch (error: any) {
    console.error("Error updating secondary email:", error);
    return {
      success: false,
      message: error.message || "Failed to update secondary email.",
    };
  }
}

export async function updateUserDepartment(departmentId: string) {
  try {
    await requireUser();

    const session = await getAuthenticatedUser();
    if (!session) throw Error("No session");
    const userId = session.id;

    if (!departmentId || !departmentId.trim()) {
      return {
        success: false,
        message: "Please select a department.",
      };
    }

    const user = await db.query.User.findFirst({
      where: eq(User.id, userId),
    });

    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    // Department can only be self-assigned once
    if (user.departmentId) {
      return {
        success: false,
        message:
          "Your department has already been assigned. Contact an administrator to change it.",
      };
    }

    // Validate department
    const department = await db.query.Department.findFirst({
      where: eq(Department.id, departmentId),
    });

    if (!department) {
      return {
        success: false,
        message: "Selected department does not exist.",
      };
    }

    // Conditional update prevents concurrent self-assignment
    const result = await db
      .update(User)
      .set({
        departmentId,
      })
      .where(and(eq(User.id, userId), isNull(User.departmentId)))
      .returning({ id: User.id });

    if (result.length === 0) {
      return {
        success: false,
        message:
          "Your department has already been assigned. Contact an administrator to change it.",
      };
    }

    return {
      success: true,
      message: "Department assigned successfully!",
    };
  } catch (error: any) {
    console.error("Error updating user department:", error);

    return {
      success: false,
      message: error.message || "Failed to assign department.",
    };
  }
}
