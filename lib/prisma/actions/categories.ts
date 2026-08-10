"use server";

import prisma from "../prisma";

/**
 * Fetch all category records sorted by creation date
 */
export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, categories };
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      message: "Failed to retrieve categories from database.",
    };
  }
}

/**
 * Create a new category record
 */
export async function createCategory(data: {
  name: string;
  description?: string;
}) {
  try {
    if (!data.name.trim()) {
      return { success: false, message: "Category name is required." };
    }

    // Check unique name constraint
    const existingCategory = await prisma.category.findUnique({
      where: { name: data.name.trim() },
    });
    if (existingCategory) {
      return {
        success: false,
        message: `A category with name '${data.name.trim()}' already exists.`,
      };
    }

    const newCategory = await prisma.category.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
      },
    });

    console.log("Successfully created category:", newCategory);
    return { success: true, message: "Category created successfully!" };
  } catch (error: any) {
    console.error("Error creating category:", error);
    return {
      success: false,
      message: "Failed to create category due to database error.",
    };
  }
}

/**
 * Update an existing category record
 */
export async function updateCategory(
  id: string,
  data: { name: string; description?: string },
) {
  try {
    if (!id) {
      return {
        success: false,
        message: "Category ID is required for updates.",
      };
    }
    if (!data.name.trim()) {
      return { success: false, message: "Category name is required." };
    }

    // Check unique name constraint (excluding current record)
    const existingCategory = await prisma.category.findUnique({
      where: { name: data.name.trim() },
    });
    if (existingCategory && existingCategory.id !== id) {
      return {
        success: false,
        message: `A category with name '${data.name.trim()}' already exists.`,
      };
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
      },
    });

    console.log("Successfully updated category:", updatedCategory);
    return { success: true, message: "Category updated successfully!" };
  } catch (error: any) {
    console.error("Error updating category:", error);
    return {
      success: false,
      message: "Failed to update category due to database error.",
    };
  }
}

/**
 * Delete a category record
 */
export async function deleteCategory(id: string) {
  try {
    if (!id) {
      return { success: false, message: "Category ID is required." };
    }

    // Verify if there are active requests under this category
    const categoryWithRequests = await prisma.category.findUnique({
      where: { id },
      include: { requests: { take: 1 } },
    });

    if (categoryWithRequests && categoryWithRequests.requests.length > 0) {
      return {
        success: false,
        message:
          "Cannot delete this category because there are grievances filed under it. Reassign or delete those grievances first.",
      };
    }

    await prisma.category.delete({
      where: { id },
    });

    console.log(`Successfully deleted category with ID: ${id}`);
    return { success: true, message: "Category deleted successfully!" };
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return {
      success: false,
      message: "Failed to delete category due to database error.",
    };
  }
}
