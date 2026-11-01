"use server";

import { db, User, Course, eq, Gender } from "@/db/drizzel";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/auth";

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
        course: true,
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
        name: user.fullName,
        rollNumber: user.rollNumber || "",
        mobileNumber: user.mobileNumber || "",
        dob: user.dateOfBirth
          ? user.dateOfBirth.toISOString().split("T")[0]
          : "",
        gender: user.gender || "",
        enrolledCourse: user.course?.name || "",
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

    // 2. Find or create course
    let courseId: string | null = null;
    if (data.enrolledCourse) {
      let course = await db.query.Course.findFirst({
        where: eq(Course.name, data.enrolledCourse),
      });
      if (!course) {
        const code =
          data.enrolledCourse
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase() + Math.floor(Math.random() * 1000);

        const [newCourse] = await db
          .insert(Course)
          .values({
            name: data.enrolledCourse,
            code: code,
          })
          .returning();
        course = newCourse;
      }
      courseId = course?.id || null;
    }

    // 3. Update database record
    const dateOfBirth = data.dob ? new Date(data.dob) : null;
    const [updatedUser] = await db
      .update(User)
      .set({
        fullName: data.name,
        email: data.email,
        mobileNumber: data.mobileNumber || null,
        dateOfBirth,
        gender: genderEnum,
        courseId,
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
