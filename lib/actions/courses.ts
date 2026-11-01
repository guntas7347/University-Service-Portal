"use server";

import { getAuthenticatedUser } from "./auth";

/**
 * Note: Course table has been removed in favor of user-level degree and specialization,
 * and department-level specializations.
 * These actions return graceful stubs to prevent breakage in legacy components.
 */

export async function getCourses() {
  try {
    const activeUser = await getAuthenticatedUser();
    return {
      success: true,
      courses: [] as any[],
      userRole: activeUser?.role || "STUDENT",
      userRights: activeUser?.rights || [],
      userDeptId: activeUser?.departmentId || "",
    };
  } catch (error: any) {
    console.error("Error fetching courses:", error);
    return {
      success: false,
      courses: [],
      message: error.message || "Course management is deprecated.",
    };
  }
}

export async function createCourse(_data: {
  code?: string;
  name: string;
  duration?: number;
  departmentId?: string;
}) {
  return {
    success: false,
    message: "Courses table has been removed. Store degree and specialization in user profile or department.",
  };
}

export async function updateCourse(
  _id: string,
  _data: {
    code?: string;
    name: string;
    duration?: number;
    departmentId?: string;
  },
) {
  return {
    success: false,
    message: "Courses table has been removed.",
  };
}

export async function deleteCourse(_id: string) {
  return {
    success: false,
    message: "Courses table has been removed.",
  };
}
