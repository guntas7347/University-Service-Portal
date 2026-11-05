"use server";

import { db, User, eq, and, desc, Gender, UserStatus } from "@/db/drizzel";
import { requireRights } from "./auth";

/**
 * Fetch student user records
 * - ADMIN: Sees all students
 * - MANAGE_DEPARTMENT_USERS: Sees only students in their department
 */
export async function getStudents() {
  try {
    const activeUser = await requireRights(["ADMIN", "MANAGE_DEPARTMENT_USERS"]);
    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN");

    const conditions = [eq(User.role, "STUDENT")];

    // Restrict department managers to their own department
    if (!isAdmin) {
      if (!activeUser.departmentId) {
        return { success: true, students: [], userRights: rights, userDeptId: "" };
      }
      conditions.push(eq(User.departmentId, activeUser.departmentId));
    }

    const students = await db.query.User.findMany({
      where: and(...conditions),
      with: { department: true },
      orderBy: [desc(User.createdAt)],
    });

    return {
      success: true,
      students: students.map((u: any) => ({
        id: u.id,
        name: u.fullName || "",
        email: u.email,
        rollNumber: u.rollNumber || "",
        mobile: u.mobile || "",
        batch: u.batch || null,
        role: u.role,
        status: u.status,
        gender: u.gender || "",
        departmentId: u.departmentId || "",
        departmentName: u.department?.name || "Unassigned",
        degree: u.degree || "",
        specialization: u.specialization || "",
      })),
      userRights: rights,
      userDeptId: activeUser.departmentId || "",
    };
  } catch (error: any) {
    console.error("Error fetching students:", error);
    return { success: false, message: error.message || "Failed to retrieve student records." };
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
    mobile?: string;
    batch?: number;
    gender?: string;
    departmentId?: string;
    status?: string;
  }
) {
  try {
    if (!id) return { success: false, message: "Student ID is required." };
    if (!data.name.trim() || !data.email.trim() || !data.rollNumber.trim()) {
      return { success: false, message: "Name, Email, and Roll Number are required." };
    }

    const activeUser = await requireRights(["ADMIN", "MANAGE_DEPARTMENT_USERS"]);
    const isAdmin = activeUser.rights?.includes("ADMIN");

    const existingStudent = await db.query.User.findFirst({ where: eq(User.id, id) });
    if (!existingStudent || existingStudent.role !== "STUDENT") {
      return { success: false, message: "Student account not found." };
    }

    // RBAC: Department Managers can only edit their own students
    if (!isAdmin && existingStudent.departmentId !== activeUser.departmentId) {
      return { success: false, message: "Access Denied. You can only update students in your department." };
    }

    // Uniqueness Checks
    const [emailDup, rollDup, mobileDup] = await Promise.all([
      db.query.User.findFirst({ where: eq(User.email, data.email.trim()) }),
      db.query.User.findFirst({ where: eq(User.rollNumber, data.rollNumber.trim()) }),
      data.mobile ? db.query.User.findFirst({ where: eq(User.mobile, data.mobile.trim()) }) : null,
    ]);

    if (emailDup && emailDup.id !== id) return { success: false, message: "Email is already in use." };
    if (rollDup && rollDup.id !== id) return { success: false, message: "Roll number is already in use." };
    if (mobileDup && mobileDup.id !== id) return { success: false, message: "Mobile number is already in use." };

    // Enum Mapping
    const genderEnum = data.gender ? (data.gender.toUpperCase() as Gender) : null;
    let statusEnum = existingStudent.status;
    if (data.status) {
      const s = data.status.toUpperCase();
      if (["ACTIVE", "PENDING", "SUSPENDED", "DELETED"].includes(s)) statusEnum = s as UserStatus;
    }

    // Target Dept: Managers cannot change a student's department
    const targetDeptId = isAdmin ? data.departmentId || null : activeUser.departmentId;

    await db.update(User).set({
      fullName: data.name.trim(),
      email: data.email.trim(),
      rollNumber: data.rollNumber.trim(),
      mobile: data.mobile?.trim() || null,
      batch: data.batch || null,
      gender: genderEnum,
      departmentId: targetDeptId,
      status: statusEnum,
    }).where(eq(User.id, id));

    return { success: true, message: "Student account updated successfully!" };
  } catch (error: any) {
    console.error("Error updating student:", error);
    return { success: false, message: "Failed to update student account." };
  }
}

/**
 * Delete a student account
 */
export async function deleteStudent(id: string) {
  try {
    if (!id) return { success: false, message: "Student ID is required." };

    const activeUser = await requireRights(["ADMIN", "MANAGE_DEPARTMENT_USERS"]);
    const isAdmin = activeUser.rights?.includes("ADMIN");

    const student = await db.query.User.findFirst({
      where: eq(User.id, id),
      with: { requests: { limit: 1 } },
    });

    if (!student || student.role !== "STUDENT") return { success: false, message: "Student not found." };

    if (!isAdmin && student.departmentId !== activeUser.departmentId) {
      return { success: false, message: "Access Denied. You can only delete students in your department." };
    }

    if (student.requests && student.requests.length > 0) {
      return { success: false, message: "Cannot delete student with active grievance tickets. Suspend the account instead." };
    }

    await db.delete(User).where(eq(User.id, id));
    return { success: true, message: "Student account deleted successfully!" };
  } catch (error: any) {
    console.error("Error deleting student:", error);
    return { success: false, message: "Failed to delete student account." };
  }
}