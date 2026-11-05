"use server";

import { db, User, Department, eq, ne, and, desc, Gender } from "@/db/drizzel";
import { requireRights, getAuthenticatedUser } from "./auth";

/**
 * Fetch staff (non-student) user records based on rights
 * - ADMIN: Fetches everyone
 * - MANAGE_DEPARTMENT_USERS: Fetches only users in their own department
 */
export async function getStaffUsers() {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) {
      return { success: false, message: "Not authenticated." };
    }

    const callerRights = activeUser.rights || [];
    const isAdmin = callerRights.includes("ADMIN");
    const isDeptManager = callerRights.includes("MANAGE_DEPARTMENT_USERS");

    if (!isAdmin && !isDeptManager) {
      return { success: false, message: "Access Denied: Insufficient permissions." };
    }

    // Build the query filter based on the user's role
    let whereClause;
    if (isAdmin) {
      whereClause = ne(User.role, "STUDENT");
    } else {
      // Dept Manager sees only their department
      if (!activeUser.departmentId) {
        // If the manager has no department assigned, they shouldn't see anyone
        return { success: true, staff: [], userRights: callerRights, userDeptId: "" };
      }
      whereClause = and(
        ne(User.role, "STUDENT"),
        eq(User.departmentId, activeUser.departmentId)
      );
    }

    const staff = await db.query.User.findMany({
      where: whereClause,
      with: { department: true },
      orderBy: [desc(User.createdAt)],
    });

    return {
      success: true,
      staff: staff.map((u: any) => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        mobile: u.mobile || "",
        role: u.role,
        rights: u.rights,
        status: u.status,
        gender: u.gender || "",
        designation: u.designation || "",
        departmentId: u.departmentId || "",
        departmentName: u.department?.name || "",
      })),
      userRights: callerRights,
      userDeptId: activeUser.departmentId || "",
    };
  } catch (error: any) {
    console.error("Error fetching staff users:", error);
    return {
      success: false,
      message: error.message || "Failed to retrieve staff users from database.",
    };
  }
}

/**
 * Update an existing staff account
 * - ADMIN: Can update everything, with strict HOD validation rules.
 * - MANAGE_DEPARTMENT_USERS: Can only update name, email, and mobile of users in their own dept.
 */
export async function updateStaffUser(
  id: string,
  data: {
    name: string;
    email: string;
    role: string;
    designation?: string;
    departmentId?: string;
    mobile?: string;
    gender?: string;
    rights: string[];
  }
) {
  try {
    if (!id) return { success: false, message: "User ID is required." };
    if (!data.name.trim() || !data.email.trim()) {
      return { success: false, message: "Name and Email are required." };
    }

    const activeUser = await requireRights(["ADMIN", "MANAGE_DEPARTMENT_USERS"]);
    const callerRights = activeUser.rights || [];
    const isAdmin = callerRights.includes("ADMIN");
    const isDeptManager = callerRights.includes("MANAGE_DEPARTMENT_USERS");

    // Fetch the target user to check old state
    const oldUser = await db.query.User.findFirst({
      where: eq(User.id, id),
    });
    if (!oldUser) {
      return { success: false, message: "User not found." };
    }

    // Check email uniqueness constraint (excluding this user)
    const emailCheck = await db.query.User.findFirst({
      where: eq(User.email, data.email.trim()),
    });
    if (emailCheck && emailCheck.id !== id) {
      return { success: false, message: "A user with this email address already exists." };
    }

    // ==========================================
    // DEPT MANAGER LOGIC (Limited Updates)
    // ==========================================
    if (!isAdmin && isDeptManager) {
      if (oldUser.departmentId !== activeUser.departmentId) {
        return { success: false, message: "Access Denied: User is not in your department." };
      }

      await db.update(User)
        .set({
          fullName: data.name.trim(),
          email: data.email.trim(),
          mobile: data.mobile?.trim() || null,
        })
        .where(eq(User.id, id));

      return { success: true, message: "Staff contact details updated successfully!" };
    }

    // ==========================================
    // ADMIN LOGIC (Full Updates & HOD Constraints)
    // ==========================================
    const roleStr = data.role ? data.role.trim().toUpperCase() : oldUser.role;
    const targetDeptId = data.departmentId || null;

    // Constraint 1: HOD department cannot be changed directly
    if (oldUser.role === "HOD" && targetDeptId && targetDeptId !== oldUser.departmentId) {
      return { 
        success: false, 
        message: "HOD department can not be changed directly, first remove as hod, then change department." 
      };
    }

    // Constraint 2: Only one HOD per department
    if (roleStr === "HOD" && targetDeptId) {
      const targetDept = await db.query.Department.findFirst({
        where: eq(Department.id, targetDeptId),
      });
      if (targetDept && targetDept.hodId && targetDept.hodId !== id) {
        return { 
          success: false, 
          message: "Conflict: This department already has an HOD. Only one HOD is allowed per department. Remove HOD first." 
        };
      }
    }

    // Gender mapping
    let genderEnum: Gender | null = oldUser.gender as Gender | null;
    if (data.gender) {
      const g = data.gender.toUpperCase();
      if (g === "MALE") genderEnum = Gender.MALE;
      else if (g === "FEMALE") genderEnum = Gender.FEMALE;
      else if (g === "OTHER") genderEnum = Gender.OTHER;
    }

    // Apply Admin transaction
    await db.transaction(async (tx) => {
      // Update User
      await tx.update(User)
        .set({
          fullName: data.name.trim(),
          email: data.email.trim(),
          role: roleStr,
          designation: data.designation?.trim() || null,
          departmentId: targetDeptId,
          mobile: data.mobile?.trim() || null,
          gender: genderEnum,
          rights: data.rights || [],
        })
        .where(eq(User.id, id));

      const isNowHod = roleStr === "HOD";
      const wasHod = oldUser.role === "HOD";

      // Sync HOD link in Department table
      if (isNowHod && targetDeptId) {
        await tx.update(Department)
          .set({ hodId: id })
          .where(eq(Department.id, targetDeptId));
      } else if (wasHod && !isNowHod && oldUser.departmentId) {
        await tx.update(Department)
          .set({ hodId: null })
          .where(eq(Department.id, oldUser.departmentId));
      }
    });

    return { success: true, message: "Staff user account updated successfully!" };

  } catch (error: any) {
    console.error("Error updating staff user:", error);
    return { success: false, message: error.message || "Failed to update staff user account." };
  }
}

/**
 * Delete a staff account
 * - ONLY allowed by ADMIN
 */
export async function deleteStaffUser(id: string) {
  try {
    if (!id) return { success: false, message: "User ID is required." };

    const activeUser = await requireRights(["ADMIN"]);

    // Safety check: Prevent deletion of self
    if (activeUser.id === id) {
      return {
        success: false,
        message: "Security boundary: You cannot delete your own active account.",
      };
    }

    await db.delete(User).where(eq(User.id, id));

    return { success: true, message: "Staff user account deleted successfully!" };
  } catch (error: any) {
    console.error("Error deleting staff account:", error);
    return { success: false, message: error.message || "Failed to delete user account." };
  }
}