"use server";

import { db, User, Department, eq, ne, and, desc, Gender } from "@/db/drizzel";
import { requireRights, getAuthenticatedUser } from "./auth";

/**
 * Fetch all staff (non-student) user records
 */
export async function getStaffUsers() {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) {
      return { success: false, message: "Not authenticated." };
    }

    const staff = await db.query.User.findMany({
      where: ne(User.role, "STUDENT"),
      with: {
        department: true,
      },
      orderBy: [desc(User.createdAt)],
    });

    return {
      success: true,
      staff: staff.map((u: any) => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        mobileNumber: u.mobileNumber || "",
        role: u.role,
        rights: u.rights,
        status: u.status,
        gender: u.gender || "",
        designation: u.designation || "",
        departmentId: u.departmentId || "",
        departmentName: u.department?.name || "",
      })),
      userRights: activeUser.rights || [],
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
 */
export async function updateStaffUser(
  id: string,
  data: {
    name: string;
    email: string;
    role: string;
    designation?: string;
    departmentId?: string;
    mobileNumber?: string;
    gender?: string;
    rights: string[];
  },
) {
  try {
    if (!id) {
      return { success: false, message: "User ID is required." };
    }
    if (!data.name.trim() || !data.email.trim()) {
      return { success: false, message: "Name and Email are required." };
    }

    const activeUser = await requireRights(["MANAGE_USERS", "MANAGE_DEPARTMENT"]);

    const callerRights = activeUser.rights || [];
    const isAdmin = callerRights.includes("ADMIN") || callerRights.includes("MANAGE_USERS");
    const isDeptManager = callerRights.includes("MANAGE_DEPARTMENT");

    // Check email uniqueness constraint (excluding active edit user)
    const existingUser = await db.query.User.findFirst({
      where: eq(User.email, data.email.trim()),
    });
    if (existingUser && existingUser.id !== id) {
      return {
        success: false,
        message: "A user with this email address already exists.",
      };
    }

    // Department manager safety check
    if (isDeptManager && !isAdmin) {
      if (existingUser && existingUser.departmentId !== activeUser.departmentId) {
        return {
          success: false,
          message: "Access Denied. You can only manage staff within your department.",
        };
      }
    }

    const roleStr = data.role ? data.role.trim().toUpperCase() : "FACULTY";

    // Gender mapping
    let genderEnum: Gender | null = null;
    if (data.gender) {
      const g = data.gender.toUpperCase();
      if (g === "MALE") genderEnum = Gender.MALE;
      else if (g === "FEMALE") genderEnum = Gender.FEMALE;
      else if (g === "OTHER") genderEnum = Gender.OTHER;
    }

    // Rights assignment: non-admins cannot assign rights they don't hold or cannot assign ADMIN
    let assignedRights = data.rights || [];
    if (!isAdmin) {
      assignedRights = assignedRights.filter((r) => r !== "ADMIN" && r !== "MANAGE_USERS");
    }

    const updatedUser = await db.transaction(async (tx) => {
      // Get previous user state
      const oldUser = await tx.query.User.findFirst({
        where: eq(User.id, id),
        columns: {
          role: true,
          departmentId: true,
          rights: true,
        },
      });

      // Update user
      const [user] = await tx
        .update(User)
        .set({
          fullName: data.name.trim(),
          email: data.email.trim(),
          role: roleStr,
          designation: data.designation?.trim() || null,
          departmentId: data.departmentId || null,
          mobileNumber: data.mobileNumber?.trim() || null,
          gender: genderEnum,
          rights: isAdmin ? assignedRights : oldUser?.rights || [],
        })
        .where(eq(User.id, id))
        .returning();

      // Sync department HOD link if HOD role or MANAGE_DEPARTMENT right is set
      const isHodDesignation = roleStr === "HOD" || assignedRights.includes("MANAGE_DEPARTMENT");
      if (isHodDesignation && data.departmentId) {
        // Set this user as HOD of the target department
        await tx
          .update(Department)
          .set({ hodId: id })
          .where(eq(Department.id, data.departmentId));
      } else if (oldUser?.departmentId && (!data.departmentId || (!isHodDesignation))) {
        // Clear HOD link from previous department if no longer HOD
        await tx
          .update(Department)
          .set({ hodId: null })
          .where(and(eq(Department.id, oldUser.departmentId), eq(Department.hodId, id)));
      }

      return user;
    });

    console.log("Successfully updated staff account:", updatedUser);
    return {
      success: true,
      message: "Staff user account updated successfully!",
    };
  } catch (error: any) {
    console.error("Error updating staff user:", error);
    return {
      success: false,
      message: error.message || "Failed to update staff user account.",
    };
  }
}

/**
 * Delete a staff account
 */
export async function deleteStaffUser(id: string) {
  try {
    if (!id) {
      return { success: false, message: "User ID is required." };
    }

    const activeUser = await requireRights(["MANAGE_USERS"]);

    // Safety check: Prevent deletion of self
    if (activeUser.id === id) {
      return {
        success: false,
        message: "Security boundary: You cannot delete your own active account.",
      };
    }

    await db.delete(User).where(eq(User.id, id));

    console.log(`Successfully deleted staff account with ID: ${id}`);
    return {
      success: true,
      message: "Staff user account deleted successfully!",
    };
  } catch (error: any) {
    console.error("Error deleting staff account:", error);
    return {
      success: false,
      message: error.message || "Failed to delete user account.",
    };
  }
}
