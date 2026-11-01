"use server";

import { db, User, eq, and, desc, Gender, UserStatus } from "@/db/drizzel";
import { requireRights } from "./auth";

/**
 * Fetch student user records (Department managers see students in their department, Admins see all)
 */
export async function getStudents() {
  try {
    const activeUser = await requireRights(["MANAGE_STUDENTS", "MANAGE_DEPARTMENT"]);

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN") || rights.includes("MANAGE_STUDENTS");
    const isDeptManager = rights.includes("MANAGE_DEPARTMENT");

    const conditions = [eq(User.role, "STUDENT")];

    if (isDeptManager && !isAdmin && activeUser.departmentId) {
      conditions.push(eq(User.departmentId, activeUser.departmentId));
    }

    const students = await db.query.User.findMany({
      where: and(...conditions),
      with: {
        department: true,
      },
      orderBy: [desc(User.createdAt)],
    });

    return {
      success: true,
      students: students.map((u: any) => ({
        id: u.id,
        name: u.fullName || "",
        email: u.email,
        rollNumber: u.rollNumber || "",
        mobileNumber: u.mobile || u.mobileNumber || "",
        batch: u.batch || null,
        role: u.role,
        status: u.status,
        gender: u.gender || "",
        departmentId: u.departmentId || "",
        departmentName: u.department?.name || "",
        degree: u.degree || "",
        specialization: u.specialization || "",
        courseId: u.degree || "",
        courseName: u.specialization || u.degree || "",
      })),
      userRole: activeUser.role,
      userRights: activeUser.rights || [],
      userDeptId: activeUser.departmentId || "",
    };
  } catch (error: any) {
    console.error("Error fetching students:", error);
    return {
      success: false,
      message: error.message || "Failed to retrieve student records from database.",
    };
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
    degree?: string;
    specialization?: string;
    status?: string;
  },
) {
  try {
    if (!id) return { success: false, message: "Student ID is required." };

    const activeUser = await requireRights(["MANAGE_STUDENTS", "MANAGE_DEPARTMENT"]);

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN") || rights.includes("MANAGE_STUDENTS");
    const isDeptManager = rights.includes("MANAGE_DEPARTMENT");

    const existingStudent = await db.query.User.findFirst({
      where: eq(User.id, id),
    });
    if (!existingStudent || existingStudent.role !== "STUDENT") {
      return { success: false, message: "Student account not found." };
    }

    // Department managers can only update students belonging to their department
    if (isDeptManager && !isAdmin) {
      if (
        !activeUser.departmentId ||
        existingStudent.departmentId !== activeUser.departmentId
      ) {
        return {
          success: false,
          message:
            "Access Denied. You can only update student accounts in your department.",
        };
      }
    }

    if (!data.name.trim() || !data.email.trim() || !data.rollNumber.trim()) {
      return {
        success: false,
        message: "Name, Email, and Roll Number are required.",
      };
    }

    // Check email uniqueness
    const emailDup = await db.query.User.findFirst({
      where: eq(User.email, data.email.trim()),
    });
    if (emailDup && emailDup.id !== id) {
      return {
        success: false,
        message: "A user with this email address already exists.",
      };
    }

    // Check roll number uniqueness
    const rollDup = await db.query.User.findFirst({
      where: eq(User.rollNumber, data.rollNumber.trim()),
    });
    if (rollDup && rollDup.id !== id) {
      return {
        success: false,
        message: "A student with this roll number already exists.",
      };
    }

    // Check mobile number uniqueness
    if (data.mobileNumber?.trim()) {
      const mobileDup = await db.query.User.findFirst({
        where: eq(User.mobileNumber, data.mobileNumber.trim()),
      });
      if (mobileDup && mobileDup.id !== id) {
        return {
          success: false,
          message: "A user with this mobile number already exists.",
        };
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

    // Target department: Department managers can assign to their department
    const targetDeptId = isDeptManager && !isAdmin
      ? activeUser.departmentId
      : data.departmentId;

    const [updatedStudent] = await db
      .update(User)
      .set({
        fullName: data.name.trim(),
        email: data.email.trim(),
        rollNumber: data.rollNumber.trim(),
        mobile: data.mobileNumber?.trim() || null,
        mobileNumber: data.mobileNumber?.trim() || null,
        batch: data.batch ? Number(data.batch) : null,
        gender: genderEnum,
        departmentId: targetDeptId || null,
        degree: data.degree || undefined,
        specialization: data.specialization || undefined,
        status: statusEnum,
      })
      .where(eq(User.id, id))
      .returning();

    console.log("Successfully updated student account:", updatedStudent);
    return { success: true, message: "Student account updated successfully!" };
  } catch (error: any) {
    console.error("Error updating student:", error);
    return {
      success: false,
      message: error.message || "Failed to update student account due to database error.",
    };
  }
}

/**
 * Delete a student account
 */
export async function deleteStudent(id: string) {
  try {
    if (!id) return { success: false, message: "Student ID is required." };

    const activeUser = await requireRights(["MANAGE_STUDENTS", "MANAGE_DEPARTMENT"]);

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN") || rights.includes("MANAGE_STUDENTS");
    const isDeptManager = rights.includes("MANAGE_DEPARTMENT");

    const student = await db.query.User.findFirst({
      where: eq(User.id, id),
      with: {
        requests: {
          limit: 1,
        },
      },
    });

    if (!student || student.role !== "STUDENT") {
      return { success: false, message: "Student record not found." };
    }

    if (isDeptManager && !isAdmin) {
      if (
        !activeUser.departmentId ||
        student.departmentId !== activeUser.departmentId
      ) {
        return {
          success: false,
          message:
            "Access Denied. You can only delete students belonging to your department.",
        };
      }
    }

    // Safety check: check if student has submitted requests
    if (student.requests && student.requests.length > 0) {
      return {
        success: false,
        message:
          "Cannot delete student because they have submitted grievance request tickets in the system. Suspend the account instead.",
      };
    }

    await db.delete(User).where(eq(User.id, id));

    console.log(`Successfully deleted student account with ID: ${id}`);
    return { success: true, message: "Student account deleted successfully!" };
  } catch (error: any) {
    console.error("Error deleting student account:", error);
    return {
      success: false,
      message: error.message || "Failed to delete student account.",
    };
  }
}
