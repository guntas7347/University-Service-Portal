"use server";

import prisma from "../prisma";
import { cookies } from "next/headers";
import { Gender, Role } from "@/prisma/generated/prisma/enums";
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} from "@/lib/auth/auth";
import crypto from "crypto";

/**
 * Create user (Register student) database action
 */
export async function registerUser(data: {
  name: string;
  email: string;
  rollNumber?: string;
  mobileNumber?: string;
  dob?: string;
  gender?: string;
  enrolledCourse?: string;
  password: string;
}) {
  try {
    // 1. Check if email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUserByEmail) {
      return {
        success: false,
        message: "A user with this email address already exists.",
      };
    }

    // 2. Check if roll number already exists
    if (data.rollNumber) {
      const existingUserByRoll = await prisma.user.findUnique({
        where: { rollNumber: data.rollNumber },
      });
      if (existingUserByRoll) {
        return {
          success: false,
          message: "A user with this roll number already exists.",
        };
      }
    }

    // 3. Check if mobile number already exists
    if (data.mobileNumber) {
      const existingUserByMobile = await prisma.user.findUnique({
        where: { mobileNumber: data.mobileNumber },
      });
      if (existingUserByMobile) {
        return {
          success: false,
          message: "A user with this mobile number already exists.",
        };
      }
    }

    // 4. Map Gender string to Enum
    let genderEnum: Gender | null = null;
    if (data.gender) {
      const upperGender = data.gender.toUpperCase();
      if (upperGender === "MALE") genderEnum = Gender.MALE;
      else if (upperGender === "FEMALE") genderEnum = Gender.FEMALE;
      else if (upperGender === "OTHER") genderEnum = Gender.OTHER;
      else genderEnum = Gender.PREFER_NOT_TO_SAY;
    }

    // 5. Find or create Course
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

    // 6. Create the User record with bcrypt hashing
    const hashedPassword = await hashPassword(data.password);
    const dateOfBirth = data.dob ? new Date(data.dob) : null;

    const newUser = await prisma.user.create({
      data: {
        fullName: data.name,
        email: data.email,
        rollNumber: data.rollNumber || null,
        mobileNumber: data.mobileNumber || null,
        passwordHash: hashedPassword,
        dateOfBirth,
        gender: genderEnum,
        courseId,
        role: Role.STUDENT,
      },
    });

    console.log("Successfully created user:", newUser);
    return { success: true, message: "Registration successful!" };
  } catch (error: any) {
    console.error("Error during user registration:", error);
    return {
      success: false,
      message: "Failed to complete registration due to database error.",
    };
  }
}

/**
 * Read user (Login user) database action & set JWT cookie
 */
export async function loginUser(identifier: string, password: string) {
  try {
    if (!identifier || !password) {
      return {
        success: false,
        message: "Username/Email and password are required.",
      };
    }

    // 1. Fetch user by email or roll number (username)
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { rollNumber: identifier }],
      },
    });

    if (!user) {
      return {
        success: false,
        message: "Invalid credentials. User not found.",
      };
    }

    // 2. Verify hashed password using bcrypt
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        success: false,
        message: "Invalid credentials. Incorrect password.",
      };
    }

    // 3. Generate token and set in cookie
    const token = generateToken(user.id);
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    console.log("Successfully authenticated user:", user);
    return {
      success: true,
      message: "Login successful!",
      user: {
        email: user.email,
        name: user.fullName,
        role: user.role,
      },
    };
  } catch (error: any) {
    console.error("Error during user login:", error);
    return {
      success: false,
      message: "Failed to log in due to database error.",
    };
  }
}

/**
 * Delete JWT token cookie
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
        message: "Not authenticated. Token cookie missing.",
      };
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return { success: false, message: "Invalid or expired session token." };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { course: true, department: true },
    });

    if (!user) {
      return { success: false, message: "User account not found." };
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

    const payload = verifyToken(token);
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

/**
 * Initiate password reset flow, allot token with 10 minutes expiry, and print to console
 */
export async function requestPasswordReset(identifier: string) {
  try {
    if (!identifier) {
      return { success: false, message: "Username or email is required." };
    }

    // Find user by email or roll number
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { rollNumber: identifier }],
      },
    });

    if (!user) {
      // Return success message generically to prevent user enumeration security issues,
      // but still let developer know in console if they want to debug.
      console.log(
        `[PASSWORD RESET] User not found for identifier: ${identifier}`,
      );
      return {
        success: true,
        message:
          "If a matching account exists, a reset link has been printed to the server console.",
      };
    }

    // Generate token and set 10 minutes expiry
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 10 * 60 * 1050); // 10 minutes (with tiny buffer for lag)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: expiry,
      },
    });

    // Construct the link (in server action we can fetch the request headers for host/protocol)
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const host = headersList.get("host") || "localhost:3000";
    const proto = headersList.get("x-forwarded-proto") || "http";
    const origin = `${proto}://${host}`;
    const resetLink = `${origin}/login/reset/${token}`;

    console.log(`\n==================================================`);
    console.log(`[PASSWORD RESET LINK FOR ${user.email}]:`);
    console.log(resetLink);
    console.log(`==================================================\n`);

    return {
      success: true,
      message:
        "If a matching account exists, a reset link has been printed to the server console.\n \n (Note: This is a demo version. In a real application, the link would be emailed to the user.)\n " +
        resetLink,
    };
  } catch (error: any) {
    console.error("Error initiating password reset:", error);
    return {
      success: false,
      message: "Failed to generate password reset token.",
    };
  }
}

/**
 * Validate password reset token
 */
export async function validateResetToken(token: string) {
  try {
    if (!token) {
      return { success: false, message: "Token is required." };
    }

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return {
        success: false,
        message: "This password reset link is invalid or has expired.",
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error validating reset token:", error);
    return {
      success: false,
      message: "Failed to validate reset token due to an error.",
    };
  }
}

/**
 * Reset user password and set reset token/expiry to null
 */
export async function resetPassword(token: string, password: string) {
  try {
    if (!token || !password) {
      return {
        success: false,
        message: "Token and new password are required.",
      };
    }

    if (password.length < 8) {
      return {
        success: false,
        message: "Password must be at least 8 characters long.",
      };
    }

    // Find user with matching, non-expired token
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return {
        success: false,
        message: "Invalid or expired password reset token.",
      };
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user record: set new password hash, clear reset fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      },
    });

    console.log(`Successfully reset password for user: ${user.email}`);

    return {
      success: true,
      message: "Your password has been reset successfully. You can now log in.",
    };
  } catch (error: any) {
    console.error("Error resetting password:", error);
    return {
      success: false,
      message: "Failed to reset password.",
    };
  }
}
