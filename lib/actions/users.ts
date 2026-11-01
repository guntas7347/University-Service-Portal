"use server";

import prisma from "../prisma";
import { cookies } from "next/headers";
import { Gender } from "@/prisma/generated/prisma/enums";
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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
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
      let course = await prisma.course.findFirst({
        where: { name: data.enrolledCourse },
      });
      if (!course) {
        const code =
          data.enrolledCourse
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase() + Math.floor(Math.random() * 1000);

        course = await prisma.course.create({
          data: {
            name: data.enrolledCourse,
            code: code,
          },
        });
      }
      courseId = course.id;
    }

    // 3. Update database record
    const dateOfBirth = data.dob ? new Date(data.dob) : null;
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        fullName: data.name,
        email: data.email,
        mobileNumber: data.mobileNumber || null,
        dateOfBirth,
        gender: genderEnum,
        courseId,
        designation: data.designation || null,
      },
    });

    console.log(
      "Successfully updated profile for user:",
      updatedUser.email,
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
