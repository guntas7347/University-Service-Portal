"use server";

import { db, Department, User, asc, eq, count, } from "@/db/drizzel";
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
      (d) => d.name.trim().toLowerCase() === trimmedName.toLowerCase(),
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
        (data.specializations || []).map((s) => s.trim()).filter(Boolean),
      ),
    );

    // Check for duplicate specializations across any other department
    for (const spec of specializations) {
      const specLower = spec.toLowerCase();
      for (const dept of allDepts) {
        if (
          dept.specializations?.some(
            (s) => s.trim().toLowerCase() === specLower,
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

    const allDepts = await db.query.Department.findMany();

    // Validate department name uniqueness
    const existingName = allDepts.find(
      (d) =>
        d.id !== id &&
        d.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );

    if (existingName) {
      return {
        success: false,
        message: "A department with this name already exists.",
      };
    }

    // Clean and deduplicate specializations
    const specializations = Array.from(
      new Set(
        (data.specializations || []).map((s) => s.trim()).filter(Boolean),
      ),
    );

    // Validate specialization uniqueness across departments
    for (const spec of specializations) {
      const specLower = spec.toLowerCase();

      for (const dept of allDepts) {
        if (
          dept.id !== id &&
          dept.specializations?.some(
            (s) => s.trim().toLowerCase() === specLower,
          )
        ) {
          return {
            success: false,
            message: `Specialization '${spec}' is already allotted to department '${dept.name}'. Duplicates across departments are not permitted.`,
          };
        }
      }
    }

    const hodId = data.hodId && data.hodId.trim() ? data.hodId.trim() : null;

    // Validate HOD uniqueness
    if (hodId) {
      const existingHod = allDepts.find(
        (d) => d.id !== id && d.hodId === hodId,
      );

      if (existingHod) {
        return {
          success: false,
          message: `The selected user is already the HOD of '${existingHod.name}'. A faculty member can only lead one department.`,
        };
      }
    }

    // Find current department and previous HOD
    const currentDept = allDepts.find((d) => d.id === id);

    if (!currentDept) {
      return {
        success: false,
        message: "Department not found.",
      };
    }

    const previousHodId = currentDept.hodId;
    let previousHodName = "";
    let previousHodRights: string[] = [];

    // Fetch previous HOD details so we know whose rights to revoke and what name to show
    if (previousHodId && previousHodId !== hodId) {
      const prevHodUser = await db.query.User.findFirst({
        where: eq(User.id, previousHodId),
      });
      if (prevHodUser) {
        previousHodName = prevHodUser.fullName || "Existing HOD";
        previousHodRights = prevHodUser.rights || [];
      }
    }

    // Fetch new HOD details so we can safely append rights to their existing ones
    let newHodRights: string[] = [];
    if (hodId && previousHodId !== hodId) {
      const newHodUser = await db.query.User.findFirst({
        where: eq(User.id, hodId),
      });
      if (newHodUser) {
        newHodRights = newHodUser.rights || [];
      }
    }

    await db.transaction(async (tx) => {
      // Demote previous HOD if assignment is changing or removed
      if (previousHodId && previousHodId !== hodId) {
        // Strip out the HOD-specific rights securely
        const demotedRights = previousHodRights.filter(
          (r) => r !== "VIEW_DEPARTMENT_TICKETS" && r !== "MANAGE_DEPARTMENT_USERS"
        );

        await tx
          .update(User)
          .set({
            role: "FACULTY",
            rights: demotedRights, // Apply revoked rights
          })
          .where(eq(User.id, previousHodId));
      }

      // Update department
      await tx
        .update(Department)
        .set({
          name: trimmedName,
          hodId,
          specializations,
        })
        .where(eq(Department.id, id));

      // Assign new HOD
      if (hodId && previousHodId !== hodId) {
        // Use a Set to safely append rights without creating duplicates
        const promotedRights = Array.from(
          new Set([...newHodRights, "VIEW_DEPARTMENT_TICKETS", "MANAGE_DEPARTMENT_USERS"])
        );

        await tx
          .update(User)
          .set({
            departmentId: id,
            role: "HOD",
            rights: promotedRights, // Apply new granted rights
          })
          .where(eq(User.id, hodId));
      }
    });

    // Construct the dynamic success message
    let successMessage = "Department updated successfully!";
    if (previousHodId && previousHodId !== hodId && previousHodName) {
      successMessage += ` ${previousHodName} was demoted and their HOD rights were revoked.`;
    }
    if (hodId && previousHodId !== hodId) {
      successMessage += ` New HOD assigned with department management rights.`;
    }

    return {
      success: true,
      message: successMessage,
    };
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
