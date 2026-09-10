"use server";

import prisma from "../prisma";
import { Gender } from "@/prisma/generated/prisma/enums";
import { requireRights, getAuthenticatedUser } from "./auth";

/**
 * Fetch all staff (non-student) user records
 */
export async function getStaffUsers() {
  try {
    const activeUser = await requireRights(["MANAGE_USERS", "MANAGE_DEPARTMENT"]);

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN") || rights.includes("MANAGE_USERS");
    const isDeptManager = rights.includes("MANAGE_DEPARTMENT");

    let whereClause: any = {
      role: {
        not: "STUDENT",
      },
    };

    if (isDeptManager && !isAdmin && activeUser.departmentId) {
      whereClause.departmentId = activeUser.departmentId;
    }

    const staff = await prisma.user.findMany({
      where: whereClause,
      include: {
        department: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      staff: staff.map((u) => ({
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
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.trim() },
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

    const updatedUser = await prisma.$transaction(async (tx) => {
      // Get previous user state
      const oldUser = await tx.user.findUnique({
        where: { id },
        select: { role: true, departmentId: true, rights: true },
      });

      // Update user
      const user = await tx.user.update({
        where: { id },
        data: {
          fullName: data.name.trim(),
          email: data.email.trim(),
          role: roleStr,
          designation: data.designation?.trim() || null,
          departmentId: data.departmentId || null,
          mobileNumber: data.mobileNumber?.trim() || null,
          gender: genderEnum,
          rights: isAdmin ? assignedRights : oldUser?.rights || [],
        },
      });

      // Sync department HOD link if HOD role or MANAGE_DEPARTMENT right is set
      const isHodDesignation = roleStr === "HOD" || assignedRights.includes("MANAGE_DEPARTMENT");
      if (isHodDesignation && data.departmentId) {
        // Set this user as HOD of the target department
        await tx.department.update({
          where: { id: data.departmentId },
          data: { hodId: id },
        });
      } else if (oldUser?.departmentId && (!data.departmentId || (!isHodDesignation))) {
        // Clear HOD link from previous department if no longer HOD
        await tx.department.updateMany({
          where: { id: oldUser.departmentId, hodId: id },
          data: { hodId: null },
        });
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

    await prisma.user.delete({
      where: { id },
    });

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
