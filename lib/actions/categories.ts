"use server";

import { db, Category, desc, eq } from "@/db/drizzel";
import { requireRights } from "./auth";

/**
 * Fetch all category records sorted by creation date
 */
export async function getCategories() {
  try {
    const categories = await db.query.Category.findMany({
      orderBy: [desc(Category.createdAt)],
    });
    return { success: true, categories };
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      message: error.message || "Failed to retrieve categories from database.",
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
    await requireRights(["MANAGE_CONFIGS"]);

    if (!data.name.trim()) {
      return { success: false, message: "Category name is required." };
    }

    // Check unique name constraint
    const existingCategory = await db.query.Category.findFirst({
      where: eq(Category.name, data.name.trim()),
    });
    if (existingCategory) {
      return {
        success: false,
        message: `A category with name '${data.name.trim()}' already exists.`,
      };
    }

    const [newCategory] = await db
      .insert(Category)
      .values({
        name: data.name.trim(),
        description: data.description?.trim() || null,
      })
      .returning();

    console.log("Successfully created category:", newCategory);
    return { success: true, message: "Category created successfully!" };
  } catch (error: any) {
    console.error("Error creating category:", error);
    return {
      success: false,
      message: error.message || "Failed to create category due to database error.",
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

    await requireRights(["MANAGE_CONFIGS"]);

    if (!data.name.trim()) {
      return { success: false, message: "Category name is required." };
    }

    // Check unique name constraint (excluding current record)
    const existingCategory = await db.query.Category.findFirst({
      where: eq(Category.name, data.name.trim()),
    });
    if (existingCategory && existingCategory.id !== id) {
      return {
        success: false,
        message: `A category with name '${data.name.trim()}' already exists.`,
      };
    }

    const [updatedCategory] = await db
      .update(Category)
      .set({
        name: data.name.trim(),
        description: data.description?.trim() || null,
      })
      .where(eq(Category.id, id))
      .returning();

    console.log("Successfully updated category:", updatedCategory);
    return { success: true, message: "Category updated successfully!" };
  } catch (error: any) {
    console.error("Error updating category:", error);
    return {
      success: false,
      message: error.message || "Failed to update category due to database error.",
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

    await requireRights(["MANAGE_CONFIGS"]);

    // Verify if there are active requests under this category
    const categoryWithRequests = await db.query.Category.findFirst({
      where: eq(Category.id, id),
      with: {
        requests: {
          limit: 1,
        },
      },
    });

    if (categoryWithRequests && categoryWithRequests.requests && categoryWithRequests.requests.length > 0) {
      return {
        success: false,
        message:
          "Cannot delete this category because there are grievances filed under it. Reassign or delete those grievances first.",
      };
    }

    await db.delete(Category).where(eq(Category.id, id));

    console.log(`Successfully deleted category with ID: ${id}`);
    return { success: true, message: "Category deleted successfully!" };
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return {
      success: false,
      message: error.message || "Failed to delete category due to database error.",
    };
  }
}
