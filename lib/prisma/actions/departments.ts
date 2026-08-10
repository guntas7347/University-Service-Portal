"use server";

import prisma from "../prisma";

/**
 * Fetch all departments (with HOD details) and auto-seed defaults if empty
 */
export async function getDepartments() {
  try {
    let depts = await prisma.department.findMany({
      include: {
        hod: true
      },
      orderBy: { name: "asc" }
    });

    // Auto-seed default departments if table is empty
    if (depts.length === 0) {
      const defaultDepts = [
        { code: "CSE", name: "Computer Science & Engineering" },
        { code: "ECE", name: "Electronics & Communication Engineering" },
        { code: "IT", name: "Information Technology" },
        { code: "ME", name: "Mechanical Engineering" },
        { code: "AS", name: "Applied Sciences" },
        { code: "AD", name: "Administration" }
      ];

      await prisma.department.createMany({
        data: defaultDepts
      });

      depts = await prisma.department.findMany({
        include: {
          hod: true
        },
        orderBy: { name: "asc" }
      });
    }

    return {
      success: true,
      departments: depts.map(d => ({
        id: d.id,
        code: d.code,
        name: d.name,
        hodId: d.hodId || "",
        hodName: d.hod?.fullName || ""
      }))
    };
  } catch (error: any) {
    console.error("Error fetching departments:", error);
    return { success: false, message: "Failed to retrieve departments." };
  }
}

/**
 * Create a new department
 */
export async function createDepartment(data: { code: string; name: string }) {
  try {
    if (!data.code.trim() || !data.name.trim()) {
      return { success: false, message: "Department code and name are required fields." };
    }

    const upperCode = data.code.trim().toUpperCase();
    const existing = await prisma.department.findUnique({
      where: { code: upperCode }
    });

    if (existing) {
      return { success: false, message: "A department with this code already exists." };
    }

    await prisma.department.create({
      data: {
        code: upperCode,
        name: data.name.trim()
      }
    });

    return { success: true, message: "Department created successfully!" };
  } catch (error: any) {
    console.error("Error creating department:", error);
    return { success: false, message: "Failed to create department." };
  }
}

/**
 * Update an existing department
 */
export async function updateDepartment(id: string, data: { code: string; name: string }) {
  try {
    if (!id) {
      return { success: false, message: "Department ID is required." };
    }
    if (!data.code.trim() || !data.name.trim()) {
      return { success: false, message: "Department code and name are required fields." };
    }

    const upperCode = data.code.trim().toUpperCase();
    const existing = await prisma.department.findUnique({
      where: { code: upperCode }
    });

    if (existing && existing.id !== id) {
      return { success: false, message: "A department with this code already exists." };
    }

    await prisma.department.update({
      where: { id },
      data: {
        code: upperCode,
        name: data.name.trim()
      }
    });

    return { success: true, message: "Department updated successfully!" };
  } catch (error: any) {
    console.error("Error updating department:", error);
    return { success: false, message: "Failed to update department." };
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

    // Safety: check if there are users in this department
    const usersCount = await prisma.user.count({
      where: { departmentId: id }
    });

    if (usersCount > 0) {
      return { 
        success: false, 
        message: `Cannot delete department: ${usersCount} users are currently assigned to it. Re-assign or remove users first.` 
      };
    }

    await prisma.department.delete({
      where: { id }
    });

    return { success: true, message: "Department deleted successfully!" };
  } catch (error: any) {
    console.error("Error deleting department:", error);
    return { success: false, message: "Failed to delete department." };
  }
}
