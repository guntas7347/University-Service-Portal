"use server";

import { db, Department, User, asc, eq, count } from "@/db/drizzel";
import { requireRights } from "./auth";

/**
 * Fetch all departments (with HOD details) and auto-seed defaults if empty
 */
export async function getDepartments() {
  try {
    let depts = await db.query.Department.findMany({
      with: {
        hod: true,
      },
      orderBy: [asc(Department.name)],
    });

    // Auto-seed default departments if table is empty
    if (depts.length === 0) {
      const defaultDepts = [{ code: "ADMIN", name: "Administration" }];

      await db.insert(Department).values(defaultDepts);

      depts = await db.query.Department.findMany({
        with: {
          hod: true,
        },
        orderBy: [asc(Department.name)],
      });
    }

    return {
      success: true,
      departments: depts.map((d: any) => ({
        id: d.id,
        code: d.code,
        name: d.name,
        hodId: d.hodId || "",
        hodName: d.hod?.fullName || "",
      })),
    };
  } catch (error: any) {
    console.error("Error fetching departments:", error);
    return {
      success: false,
      message: error.message || "Failed to retrieve departments.",
    };
  }
}

/**
 * Create a new department
 */
export async function createDepartment(data: { code: string; name: string }) {
  try {
    await requireRights(["MANAGE_CONFIGS"]);

    if (!data.code.trim() || !data.name.trim()) {
      return {
        success: false,
        message: "Department code and name are required fields.",
      };
    }

    const upperCode = data.code.trim().toUpperCase();
    const existing = await db.query.Department.findFirst({
      where: eq(Department.code, upperCode),
    });

    if (existing) {
      return {
        success: false,
        message: "A department with this code already exists.",
      };
    }

    await db.insert(Department).values({
      code: upperCode,
      name: data.name.trim(),
    });

    return { success: true, message: "Department created successfully!" };
  } catch (error: any) {
    console.error("Error creating department:", error);
    return {
      success: false,
      message: error.message || "Failed to create department.",
    };
  }
}

/**
 * Update an existing department
 */
export async function updateDepartment(
  id: string,
  data: { code: string; name: string },
) {
  try {
    if (!id) {
      return { success: false, message: "Department ID is required." };
    }

    await requireRights(["MANAGE_CONFIGS"]);

    if (!data.code.trim() || !data.name.trim()) {
      return {
        success: false,
        message: "Department code and name are required fields.",
      };
    }

    const upperCode = data.code.trim().toUpperCase();
    const existing = await db.query.Department.findFirst({
      where: eq(Department.code, upperCode),
    });

    if (existing && existing.id !== id) {
      return {
        success: false,
        message: "A department with this code already exists.",
      };
    }

    await db
      .update(Department)
      .set({
        code: upperCode,
        name: data.name.trim(),
      })
      .where(eq(Department.id, id));

    return { success: true, message: "Department updated successfully!" };
  } catch (error: any) {
    console.error("Error updating department:", error);
    return {
      success: false,
      message: error.message || "Failed to update department.",
    };
  }
}

/**
 * Delete a department
 */
export async function deleteDepartment(id: string) {
  try {
    if (!id) {
      return { success: false, message: "Department ID is required." };
    }

    await requireRights(["MANAGE_CONFIGS"]);

    // Safety: check if there are users in this department
    const [{ value: usersCount }] = await db
      .select({ value: count() })
      .from(User)
      .where(eq(User.departmentId, id));

    if (usersCount > 0) {
      return {
        success: false,
        message: `Cannot delete department: ${usersCount} users are currently assigned to it. Re-assign or remove users first.`,
      };
    }

    await db.delete(Department).where(eq(Department.id, id));

    return { success: true, message: "Department deleted successfully!" };
  } catch (error: any) {
    console.error("Error deleting department:", error);
    return {
      success: false,
      message: error.message || "Failed to delete department.",
    };
  }
}
