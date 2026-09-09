"use server";

import prisma from "../prisma";
import { cookies } from "next/headers";
import { Role, Gender, UserStatus } from "@/prisma/generated/prisma/enums";
import { verifyToken } from "@/lib/auth/auth";

/**
 * Fetch all staff (non-student) user records
 */
export async function getStaffUsers() {
  try {
    const staff = await prisma.user.findMany({
      where: {
        role: {
          not: Role.STUDENT,
        },
      },
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
    };
  } catch (error: any) {
    console.error("Error fetching staff users:", error);
    return {
      success: false,
      message: "Failed to retrieve staff users from database.",
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

    // Role mapping
    let roleEnum: Role;
    const r = data.role.toUpperCase();
    if (r === "ADMIN") roleEnum = Role.ADMIN;
    else if (r === "SUPER_ADMIN") roleEnum = Role.SUPER_ADMIN;
    else if (r === "HOD") roleEnum = Role.HOD;
    else roleEnum = Role.FACULTY;

    // Gender mapping
    let genderEnum: Gender | null = null;
    if (data.gender) {
      const g = data.gender.toUpperCase();
      if (g === "MALE") genderEnum = Gender.MALE;
      else if (g === "FEMALE") genderEnum = Gender.FEMALE;
      else if (g === "OTHER") genderEnum = Gender.OTHER;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // Get previous user state
      const oldUser = await tx.user.findUnique({
        where: { id },
        select: { role: true, departmentId: true },
      });

      // Update user
      const user = await tx.user.update({
        where: { id },
        data: {
          fullName: data.name.trim(),
          email: data.email.trim(),
          role: roleEnum,
          designation: data.designation?.trim() || null,
          departmentId: data.departmentId || null,
          mobileNumber: data.mobileNumber?.trim() || null,
          gender: genderEnum,
          rights: data.rights,
        },
      });

      // If user was HOD and department changed or role is no longer HOD
      if (oldUser?.role === Role.HOD && oldUser.departmentId) {
        if (
          roleEnum !== Role.HOD ||
          data.departmentId !== oldUser.departmentId
        ) {
          // Clear HOD link from the old department
          await tx.department.updateMany({
            where: { hodId: id },
            data: { hodId: null },
          });
        }
      }

      // If new role is HOD and a department is specified
      if (roleEnum === Role.HOD && data.departmentId) {
        // Demote the previous HOD of this department to FACULTY (if it is a different user)
        const dept = await tx.department.findUnique({
          where: { id: data.departmentId },
          select: { hodId: true },
        });
        if (dept?.hodId && dept.hodId !== id) {
          await tx.user.update({
            where: { id: dept.hodId },
            data: { role: Role.FACULTY },
          });
        }

        // Set this user as HOD of this department
        await tx.department.update({
          where: { id: data.departmentId },
          data: { hodId: id },
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
      message: "Failed to update staff user account.",
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

    // Safety check: Prevent deletion of self (the currently logged in user)
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.userId === id) {
        return {
          success: false,
          message:
            "Security boundary: You cannot delete your own active administrator account.",
        };
      }
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
    return { success: false, message: "Failed to delete user account." };
  }
}
