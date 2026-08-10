"use server";

import prisma from "../prisma";

/**
 * Fetch all course records sorted by creation date
 */
export async function getCourses() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, courses };
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
}) {
  try {
    if (!data.code.trim() || !data.name.trim()) {
      return {
        success: false,
        message: "Course code and course name are required.",
      };
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
  data: { code: string; name: string; duration?: number },
) {
  try {
    if (!id) {
      return { success: false, message: "Course ID is required for updates." };
    }
    if (!data.code.trim() || !data.name.trim()) {
      return { success: false, message: "Course code and name are required." };
    }

    // Check unique code constraint (excluding current record)
    const existingCourse = await prisma.course.findUnique({
      where: { code: data.code.trim() },
    });
    if (existingCourse && existingCourse.id !== id) {
      return {
        success: false,
        message: `A course with code '${data.code.trim()}' already exists.`,
      };
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        code: data.code.trim(),
        name: data.name.trim(),
        duration: data.duration ? Number(data.duration) : null,
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

    // Verify if there are students enrolled before deletion
    const courseWithStudents = await prisma.course.findUnique({
      where: { id },
      include: { students: { take: 1 } },
    });

    if (courseWithStudents && courseWithStudents.students.length > 0) {
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
