"use server";

import prisma from "../prisma";
import { requireRights, getAuthenticatedUser } from "./auth";

/**
 * Fetch all course records sorted by creation date with department info and user context
 */
export async function getCourses() {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) {
      return {
        success: false,
        message: "Not authenticated.",
      };
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
      userRole: activeUser.role,
      userRights: activeUser.rights || [],
      userDeptId: activeUser.departmentId || "",
    };
  } catch (error: any) {
    console.error("Error fetching courses:", error);
    return {
      success: false,
      message: error.message || "Failed to retrieve courses from database.",
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
    const activeUser = await requireRights(["MANAGE_CONFIGS", "MANAGE_DEPARTMENT"]);

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN") || rights.includes("MANAGE_CONFIGS");
    const isDeptManager = rights.includes("MANAGE_DEPARTMENT");

    if (!data.code.trim() || !data.name.trim()) {
      return {
        success: false,
        message: "Course code and course name are required.",
      };
    }

    // Determine target department
    let targetDeptId: string | null = null;
    if (isDeptManager && !isAdmin) {
      if (!activeUser.departmentId) {
        return {
          success: false,
          message:
            "Access Denied. Department manager must belong to a department to create courses.",
        };
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
      message: error.message || "Failed to create course due to database error.",
    };
  }
}

/**
 * Update an existing course record
 */
export async function updateCourse(
  id: string,
  data: {
    code: string;
    name: string;
    duration?: number;
    departmentId?: string;
  },
) {
  try {
    if (!id) {
      return { success: false, message: "Course ID is required for updates." };
    }

    const activeUser = await requireRights(["MANAGE_CONFIGS", "MANAGE_DEPARTMENT"]);

    const existingCourse = await prisma.course.findUnique({
      where: { id },
    });
    if (!existingCourse) {
      return { success: false, message: "Course not found." };
    }

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN") || rights.includes("MANAGE_CONFIGS");
    const isDeptManager = rights.includes("MANAGE_DEPARTMENT");

    if (isDeptManager && !isAdmin) {
      if (
        !activeUser.departmentId ||
        existingCourse.departmentId !== activeUser.departmentId
      ) {
        return {
          success: false,
          message:
            "Access Denied. You can only update courses in your own department.",
        };
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

    // Target department: Department manager can't change department outside their own
    const targetDeptId = isDeptManager && !isAdmin
      ? activeUser.departmentId
      : data.departmentId || existingCourse.departmentId;

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
      message: error.message || "Failed to update course due to database error.",
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

    const activeUser = await requireRights(["MANAGE_CONFIGS", "MANAGE_DEPARTMENT"]);

    const course = await prisma.course.findUnique({
      where: { id },
      include: { students: { take: 1 } },
    });

    if (!course) {
      return { success: false, message: "Course not found." };
    }

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN") || rights.includes("MANAGE_CONFIGS");
    const isDeptManager = rights.includes("MANAGE_DEPARTMENT");

    if (isDeptManager && !isAdmin) {
      if (
        !activeUser.departmentId ||
        course.departmentId !== activeUser.departmentId
      ) {
        return {
          success: false,
          message:
            "Access Denied. You can only delete courses in your own department.",
        };
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
      message: error.message || "Failed to delete course due to database error.",
    };
  }
}
