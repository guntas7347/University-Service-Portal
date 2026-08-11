"use server";

import prisma from "../prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/auth";
import { Role } from "@/prisma/generated/prisma/enums";

/**
 * Fetch all course records sorted by creation date with department info and user context
 */
export async function getCourses() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return {
        success: false,
        message: "Not authenticated.",
      };
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return { success: false, message: "Invalid session." };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) {
      return { success: false, message: "User profile not found." };
    }

    const courses = await prisma.course.findMany({
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      courses,
      userRole: user.role,
      userDeptId: user.departmentId || "",
    };
  } catch (error: any) {
    console.error("Error fetching courses:", error);
    return {
      success: false,
      message: "Failed to retrieve courses from database.",
    };
  }
}

/**
 * Create a new course record
 */
export async function createCourse(data: {
  code: string;
  name: string;
  duration?: number;
  departmentId?: string;
}) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, message: "Not authenticated." };

    const payload = verifyToken(token);
    if (!payload || !payload.userId) return { success: false, message: "Invalid session." };

    const activeUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!activeUser) return { success: false, message: "User not found." };

    // Authorization
    const isAdmin = activeUser.role === Role.ADMIN || activeUser.role === Role.SUPER_ADMIN;
    const isHod = activeUser.role === Role.HOD;
    const hasRights = activeUser.rights?.includes("MANAGE_COURSES");

    if (!isAdmin && !isHod && !hasRights) {
      return { success: false, message: "Access Denied. You do not have permission to create courses." };
    }

    if (!data.code.trim() || !data.name.trim()) {
      return {
        success: false,
        message: "Course code and course name are required.",
      };
    }

    // Determine target department
    let targetDeptId: string | null = null;
    if (isHod) {
      if (!activeUser.departmentId) {
        return { success: false, message: "Access Denied. HOD must belong to a department to create courses." };
      }
      targetDeptId = activeUser.departmentId;
    } else {
      if (!data.departmentId) {
        return { success: false, message: "Please select a department." };
      }
      targetDeptId = data.departmentId;
    }

    // Check unique code constraint
    const existingCourse = await prisma.course.findUnique({
      where: { code: data.code.trim() },
    });
    if (existingCourse) {
      return {
        success: false,
        message: `A course with code '${data.code.trim()}' already exists.`,
      };
    }

    const newCourse = await prisma.course.create({
      data: {
        code: data.code.trim(),
        name: data.name.trim(),
        duration: data.duration ? Number(data.duration) : null,
        departmentId: targetDeptId,
      },
    });

    console.log("Successfully created course:", newCourse);
    return { success: true, message: "Course created successfully!" };
  } catch (error: any) {
    console.error("Error creating course:", error);
    return {
      success: false,
      message: "Failed to create course due to database error.",
    };
  }
}

/**
 * Update an existing course record
 */
export async function updateCourse(
  id: string,
  data: { code: string; name: string; duration?: number; departmentId?: string },
) {
  try {
    if (!id) {
      return { success: false, message: "Course ID is required for updates." };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, message: "Not authenticated." };

    const payload = verifyToken(token);
    if (!payload || !payload.userId) return { success: false, message: "Invalid session." };

    const activeUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!activeUser) return { success: false, message: "User not found." };

    const existingCourse = await prisma.course.findUnique({
      where: { id },
    });
    if (!existingCourse) {
      return { success: false, message: "Course not found." };
    }

    // Authorization
    const isAdmin = activeUser.role === Role.ADMIN || activeUser.role === Role.SUPER_ADMIN;
    const isHod = activeUser.role === Role.HOD;
    const hasRights = activeUser.rights?.includes("MANAGE_COURSES");

    if (!isAdmin && !isHod && !hasRights) {
      return { success: false, message: "Access Denied. You do not have permission to update courses." };
    }

    if (isHod) {
      if (!activeUser.departmentId || existingCourse.departmentId !== activeUser.departmentId) {
        return { success: false, message: "Access Denied. You can only update courses in your own department." };
      }
    }

    if (!data.code.trim() || !data.name.trim()) {
      return { success: false, message: "Course code and name are required." };
    }

    // Check unique code constraint (excluding current record)
    const existingCourseWithCode = await prisma.course.findUnique({
      where: { code: data.code.trim() },
    });
    if (existingCourseWithCode && existingCourseWithCode.id !== id) {
      return {
        success: false,
        message: `A course with code '${data.code.trim()}' already exists.`,
      };
    }

    // Target department: HOD can't change department, Admin can
    const targetDeptId = isHod ? activeUser.departmentId : (data.departmentId || existingCourse.departmentId);

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        code: data.code.trim(),
        name: data.name.trim(),
        duration: data.duration ? Number(data.duration) : null,
        departmentId: targetDeptId,
      },
    });

    console.log("Successfully updated course:", updatedCourse);
    return { success: true, message: "Course updated successfully!" };
  } catch (error: any) {
    console.error("Error updating course:", error);
    return {
      success: false,
      message: "Failed to update course due to database error.",
    };
  }
}

/**
 * Delete a course record
 */
export async function deleteCourse(id: string) {
  try {
    if (!id) {
      return { success: false, message: "Course ID is required." };
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, message: "Not authenticated." };

    const payload = verifyToken(token);
    if (!payload || !payload.userId) return { success: false, message: "Invalid session." };

    const activeUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!activeUser) return { success: false, message: "User not found." };

    const course = await prisma.course.findUnique({
      where: { id },
      include: { students: { take: 1 } },
    });

    if (!course) {
      return { success: false, message: "Course not found." };
    }

    // Authorization
    const isAdmin = activeUser.role === Role.ADMIN || activeUser.role === Role.SUPER_ADMIN;
    const isHod = activeUser.role === Role.HOD;
    const hasRights = activeUser.rights?.includes("MANAGE_COURSES");

    if (!isAdmin && !isHod && !hasRights) {
      return { success: false, message: "Access Denied. You do not have permission to delete courses." };
    }

    if (isHod) {
      if (!activeUser.departmentId || course.departmentId !== activeUser.departmentId) {
        return { success: false, message: "Access Denied. You can only delete courses in your own department." };
      }
    }

    if (course.students.length > 0) {
      return {
        success: false,
        message:
          "Cannot delete this course because there are students enrolled in it. Reassign students first.",
      };
    }

    await prisma.course.delete({
      where: { id },
    });

    console.log(`Successfully deleted course with ID: ${id}`);
    return { success: true, message: "Course deleted successfully!" };
  } catch (error: any) {
    console.error("Error deleting course:", error);
    return {
      success: false,
      message: "Failed to delete course due to database error.",
    };
  }
}
