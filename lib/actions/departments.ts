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
      const defaultDepts = [{ name: "Administration" }];

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
        code: d.id,
        name: d.name,
        specializations: d.specializations || [],
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
export async function createDepartment(data: {
  name: string;
  hodId?: string | null;
  specializations?: string[];
  code?: string;
}) {
  try {
    await requireRights(["MANAGE_CONFIGS"]);

    if (!data.name || !data.name.trim()) {
      return {
        success: false,
        message: "Department name is required.",
      };
    }

    const trimmedName = data.name.trim();

    // Fetch all existing departments for uniqueness validations
    const allDepts = await db.query.Department.findMany();

    const existingName = allDepts.find(
      (d) => d.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingName) {
      return {
        success: false,
        message: "A department with this name already exists.",
      };
    }

    // Clean and deduplicate input specializations
    const specializations = Array.from(
      new Set(
        (data.specializations || [])
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );

    // Check for duplicate specializations across any other department
    for (const spec of specializations) {
      const specLower = spec.toLowerCase();
      for (const dept of allDepts) {
        if (
          dept.specializations?.some(
            (s) => s.trim().toLowerCase() === specLower
          )
        ) {
          return {
            success: false,
            message: `Specialization '${spec}' is already allotted to department '${dept.name}'. Duplicates across departments are not permitted.`,
          };
        }
      }
    }

    // Check if selected HOD is already HOD of another department
    const hodId = data.hodId && data.hodId.trim() ? data.hodId.trim() : null;
    if (hodId) {
      const existingHod = allDepts.find((d) => d.hodId === hodId);
      if (existingHod) {
        return {
          success: false,
          message: `The selected user is already the HOD of '${existingHod.name}'. A faculty member can only lead one department.`,
        };
      }
    }

    const [newDept] = await db
      .insert(Department)
      .values({
        name: trimmedName,
        hodId,
        specializations,
      })
      .returning();

    // If HOD was assigned, set user's department
    if (hodId) {
      await db
        .update(User)
        .set({ departmentId: newDept.id })
        .where(eq(User.id, hodId));
    }

    return {
      success: true,
      message: "Department created successfully!",
      department: newDept,
    };
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
  data: {
    name: string;
    hodId?: string | null;
    specializations?: string[];
    code?: string;
  },
) {
  try {
    if (!id) {
      return { success: false, message: "Department ID is required." };
    }

    await requireRights(["MANAGE_CONFIGS"]);

    if (!data.name || !data.name.trim()) {
      return {
        success: false,
        message: "Department name is required.",
      };
    }

    const trimmedName = data.name.trim();

    // Fetch all existing departments for uniqueness validations
    const allDepts = await db.query.Department.findMany();

    const existingName = allDepts.find(
      (d) => d.id !== id && d.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (existingName) {
      return {
        success: false,
        message: "A department with this name already exists.",
      };
    }

    // Clean and deduplicate input specializations
    const specializations = Array.from(
      new Set(
        (data.specializations || [])
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );

    // Check for duplicate specializations across any other department
    for (const spec of specializations) {
      const specLower = spec.toLowerCase();
      for (const dept of allDepts) {
        if (
          dept.id !== id &&
          dept.specializations?.some(
            (s) => s.trim().toLowerCase() === specLower
          )
        ) {
          return {
            success: false,
            message: `Specialization '${spec}' is already allotted to department '${dept.name}'. Duplicates across departments are not permitted.`,
          };
        }
      }
    }

    // Check if selected HOD is already HOD of another department
    const hodId = data.hodId && data.hodId.trim() ? data.hodId.trim() : null;
    if (hodId) {
      const existingHod = allDepts.find((d) => d.id !== id && d.hodId === hodId);
      if (existingHod) {
        return {
          success: false,
          message: `The selected user is already the HOD of '${existingHod.name}'. A faculty member can only lead one department.`,
        };
      }
    }

    await db
      .update(Department)
      .set({
        name: trimmedName,
        hodId,
        specializations,
      })
      .where(eq(Department.id, id));

    // If HOD was assigned, set user's department
    if (hodId) {
      await db
        .update(User)
        .set({ departmentId: id })
        .where(eq(User.id, hodId));
    }

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
