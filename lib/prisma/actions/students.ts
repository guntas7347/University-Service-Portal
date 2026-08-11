"use server";

import prisma from "../prisma";
import { cookies } from "next/headers";
import { Role, Gender, UserStatus } from "@/prisma/generated/prisma/enums";
import { hashPassword, verifyToken } from "@/lib/auth/auth";
import crypto from "crypto";

/**
 * Fetch student user records (HODs only see students in their department, Admins see all)
 */
export async function getStudents() {
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

    const isAdmin = activeUser.role === Role.ADMIN || activeUser.role === Role.SUPER_ADMIN;
    const isHod = activeUser.role === Role.HOD;

    if (!isAdmin && !isHod) {
      return { success: false, message: "Access Denied. Insufficient permissions." };
    }

    let whereClause: any = {
      role: Role.STUDENT
    };

    if (isHod && activeUser.departmentId) {
      whereClause.departmentId = activeUser.departmentId;
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      include: {
        department: true,
        course: true
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      success: true,
      students: students.map(u => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        rollNumber: u.rollNumber || "",
        mobileNumber: u.mobileNumber || "",
        batch: u.batch || null,
        role: u.role,
        status: u.status,
        gender: u.gender || "",
        departmentId: u.departmentId || "",
        departmentName: u.department?.name || "",
        courseId: u.courseId || "",
        courseName: u.course?.name || "",
      })),
      userRole: activeUser.role,
      userDeptId: activeUser.departmentId || ""
    };
  } catch (error: any) {
    console.error("Error fetching students:", error);
    return { success: false, message: "Failed to retrieve student records from database." };
  }
}

/**
 * Create a new student user account
 */
export async function createStudent(data: {
  name: string;
  email: string;
  rollNumber: string;
  mobileNumber?: string;
  batch?: number;
  gender?: string;
  departmentId?: string;
  courseId?: string;
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

    const isAdmin = activeUser.role === Role.ADMIN || activeUser.role === Role.SUPER_ADMIN;
    const isHod = activeUser.role === Role.HOD;

    if (!isAdmin && !isHod) {
      return { success: false, message: "Access Denied. You do not have permission to create student accounts." };
    }

    if (!data.name.trim() || !data.email.trim() || !data.rollNumber.trim()) {
      return { success: false, message: "Full Name, Email, and Roll Number are required fields." };
    }

    // 1. Check unique email constraint
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.trim() },
    });
    if (existingUser) {
      return {
        success: false,
        message: "A user with this email address already exists.",
      };
    }

    // 2. Check unique roll number constraint
    const existingRoll = await prisma.user.findUnique({
      where: { rollNumber: data.rollNumber.trim() },
    });
    if (existingRoll) {
      return {
        success: false,
        message: "A student with this roll number already exists.",
      };
    }

    // 3. Check unique mobile number constraint
    if (data.mobileNumber?.trim()) {
      const existingMobile = await prisma.user.findUnique({
        where: { mobileNumber: data.mobileNumber.trim() },
      });
      if (existingMobile) {
        return {
          success: false,
          message: "A user with this mobile number already exists.",
        };
      }
    }

    // 4. Determine department
    let targetDeptId: string | null = null;
    if (isHod) {
      if (!activeUser.departmentId) {
        return { success: false, message: "Access Denied. HOD must belong to a department to register students." };
      }
      targetDeptId = activeUser.departmentId;
    } else {
      targetDeptId = data.departmentId || null;
    }

    // 5. Gender mapping
    let genderEnum: Gender | null = null;
    if (data.gender) {
      const g = data.gender.toUpperCase();
      if (g === "MALE") genderEnum = Gender.MALE;
      else if (g === "FEMALE") genderEnum = Gender.FEMALE;
      else if (g === "OTHER") genderEnum = Gender.OTHER;
    }

    // 6. Generate random password & hash it
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await hashPassword(randomPassword);

    const newStudent = await prisma.user.create({
      data: {
        fullName: data.name.trim(),
        email: data.email.trim(),
        rollNumber: data.rollNumber.trim(),
        mobileNumber: data.mobileNumber?.trim() || null,
        batch: data.batch ? Number(data.batch) : null,
        gender: genderEnum,
        role: Role.STUDENT,
        status: UserStatus.ACTIVE, // Created by HOD/Admin: directly activated
        departmentId: targetDeptId,
        courseId: data.courseId || null,
        passwordHash: hashedPassword,
      },
    });

    console.log("Successfully created student account:", newStudent);
    return { success: true, message: "Student account created successfully!" };
  } catch (error: any) {
    console.error("Error creating student:", error);
    return { success: false, message: "Failed to create student account due to database error." };
  }
}

/**
 * Update an existing student user account
 */
export async function updateStudent(
  id: string,
  data: {
    name: string;
    email: string;
    rollNumber: string;
    mobileNumber?: string;
    batch?: number;
    gender?: string;
    departmentId?: string;
    courseId?: string;
    status?: string;
  }
) {
  try {
    if (!id) return { success: false, message: "Student ID is required." };

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, message: "Not authenticated." };

    const payload = verifyToken(token);
    if (!payload || !payload.userId) return { success: false, message: "Invalid session." };

    const activeUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!activeUser) return { success: false, message: "User not found." };

    const isAdmin = activeUser.role === Role.ADMIN || activeUser.role === Role.SUPER_ADMIN;
    const isHod = activeUser.role === Role.HOD;

    if (!isAdmin && !isHod) {
      return { success: false, message: "Access Denied. You do not have permission to edit student accounts." };
    }

    const existingStudent = await prisma.user.findUnique({
      where: { id },
    });
    if (!existingStudent || existingStudent.role !== Role.STUDENT) {
      return { success: false, message: "Student account not found." };
    }

    // HODs can only update students belonging to their department
    if (isHod) {
      if (!activeUser.departmentId || existingStudent.departmentId !== activeUser.departmentId) {
        return { success: false, message: "Access Denied. You can only update student accounts in your department." };
      }
    }

    if (!data.name.trim() || !data.email.trim() || !data.rollNumber.trim()) {
      return { success: false, message: "Name, Email, and Roll Number are required." };
    }

    // Check email uniqueness
    const emailDup = await prisma.user.findUnique({
      where: { email: data.email.trim() },
    });
    if (emailDup && emailDup.id !== id) {
      return { success: false, message: "A user with this email address already exists." };
    }

    // Check roll number uniqueness
    const rollDup = await prisma.user.findUnique({
      where: { rollNumber: data.rollNumber.trim() },
    });
    if (rollDup && rollDup.id !== id) {
      return { success: false, message: "A student with this roll number already exists." };
    }

    // Check mobile number uniqueness
    if (data.mobileNumber?.trim()) {
      const mobileDup = await prisma.user.findUnique({
        where: { mobileNumber: data.mobileNumber.trim() },
      });
      if (mobileDup && mobileDup.id !== id) {
        return { success: false, message: "A user with this mobile number already exists." };
      }
    }

    let genderEnum: Gender | null = null;
    if (data.gender) {
      const g = data.gender.toUpperCase();
      if (g === "MALE") genderEnum = Gender.MALE;
      else if (g === "FEMALE") genderEnum = Gender.FEMALE;
      else if (g === "OTHER") genderEnum = Gender.OTHER;
    }

    let statusEnum = existingStudent.status;
    if (data.status) {
      const s = data.status.toUpperCase();
      if (s === "ACTIVE") statusEnum = UserStatus.ACTIVE;
      else if (s === "PENDING") statusEnum = UserStatus.PENDING;
      else if (s === "SUSPENDED") statusEnum = UserStatus.SUSPENDED;
      else if (s === "DELETED") statusEnum = UserStatus.DELETED;
    }

    // Target department: HOD can transition students out or lock them to their department
    const targetDeptId = isHod ? (data.departmentId || activeUser.departmentId) : data.departmentId;

    const updatedStudent = await prisma.user.update({
      where: { id },
      data: {
        fullName: data.name.trim(),
        email: data.email.trim(),
        rollNumber: data.rollNumber.trim(),
        mobileNumber: data.mobileNumber?.trim() || null,
        batch: data.batch ? Number(data.batch) : null,
        gender: genderEnum,
        departmentId: targetDeptId || null,
        courseId: data.courseId || null,
        status: statusEnum,
      },
    });

    console.log("Successfully updated student account:", updatedStudent);
    return { success: true, message: "Student account updated successfully!" };
  } catch (error: any) {
    console.error("Error updating student:", error);
    return { success: false, message: "Failed to update student account due to database error." };
  }
}

/**
 * Delete a student account
 */
export async function deleteStudent(id: string) {
  try {
    if (!id) return { success: false, message: "Student ID is required." };

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, message: "Not authenticated." };

    const payload = verifyToken(token);
    if (!payload || !payload.userId) return { success: false, message: "Invalid session." };

    const activeUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!activeUser) return { success: false, message: "User not found." };

    const isAdmin = activeUser.role === Role.ADMIN || activeUser.role === Role.SUPER_ADMIN;
    const isHod = activeUser.role === Role.HOD;

    if (!isAdmin && !isHod) {
      return { success: false, message: "Access Denied. You do not have permission to delete student accounts." };
    }

    const student = await prisma.user.findUnique({
      where: { id },
      include: { requests: { take: 1 } },
    });

    if (!student || student.role !== Role.STUDENT) {
      return { success: false, message: "Student record not found." };
    }

    if (isHod) {
      if (!activeUser.departmentId || student.departmentId !== activeUser.departmentId) {
        return { success: false, message: "Access Denied. You can only delete students belonging to your department." };
      }
    }

    // Safety check: check if student has submitted requests
    if (student.requests && student.requests.length > 0) {
      return {
        success: false,
        message: "Cannot delete student because they have submitted grievance request tickets in the system. Suspend the account instead.",
      };
    }

    await prisma.user.delete({
      where: { id },
    });

    console.log(`Successfully deleted student account with ID: ${id}`);
    return { success: true, message: "Student account deleted successfully!" };
  } catch (error: any) {
    console.error("Error deleting student account:", error);
    return { success: false, message: "Failed to delete student account." };
  }
}
