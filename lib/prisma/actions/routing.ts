"use server";

import prisma from "../prisma";
import { requireRights } from "./auth";

/**
 * Fetch all routing rules in the system (both category-based and central escalation)
 */
export async function getRoutingRules() {
  try {
    const rules = await prisma.routingRule.findMany({
      include: {
        category: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            designation: true,
          },
        },
      },
      orderBy: [
        { isCentral: "asc" },
        { categoryId: "asc" },
        { level: "asc" },
      ],
    });

    return {
      success: true,
      rules: rules.map((r) => ({
        id: r.id,
        categoryId: r.categoryId || "",
        categoryName: r.isCentral ? "Central Escalation (Last Resort)" : (r.category?.name || "Uncategorized"),
        userId: r.userId,
        userName: r.user.fullName,
        userEmail: r.user.email,
        userRole: r.user.role,
        userDesignation: r.user.designation || "",
        level: r.level,
        isCentral: r.isCentral,
        isActive: r.isActive,
      })),
    };
  } catch (error: any) {
    console.error("Error fetching routing rules:", error);
    return {
      success: false,
      message: error.message || "Failed to load routing rules.",
    };
  }
}

/**
 * Create a new routing rule (Category or Central Escalation)
 */
export async function createRoutingRule(data: {
  categoryId?: string | null;
  userId: string;
  level?: number;
  isCentral?: boolean;
}) {
  try {
    await requireRights(["MANAGE_ROUTING"]);

    const isCentral = !!data.isCentral;
    const level = data.level && Number(data.level) > 0 ? Number(data.level) : 1;

    if (!isCentral && !data.categoryId) {
      return { success: false, message: "Category is required for standard routing rules." };
    }
    if (!data.userId) {
      return { success: false, message: "Staff user is required." };
    }

    const categoryId = isCentral ? null : data.categoryId!;

    // Check if duplicate rule exists
    const existing = await prisma.routingRule.findFirst({
      where: {
        isCentral,
        categoryId,
        level,
        userId: data.userId,
      },
    });

    if (existing) {
      return {
        success: false,
        message: `A routing rule already exists for this staff member at Level ${level}.`,
      };
    }

    await prisma.routingRule.create({
      data: {
        isCentral,
        categoryId,
        userId: data.userId,
        level,
        isActive: true,
      },
    });

    return {
      success: true,
      message: isCentral
        ? `Central Escalation Rule (Level ${level}) created successfully!`
        : `Category Routing Rule (Level ${level}) created successfully!`,
    };
  } catch (error: any) {
    console.error("Error creating routing rule:", error);
    return {
      success: false,
      message: error.message || "Failed to create routing rule.",
    };
  }
}

/**
 * Toggle the active state of a routing rule
 */
export async function toggleRoutingRule(id: string, isActive: boolean) {
  try {
    if (!id) {
      return { success: false, message: "Rule ID is required." };
    }

    await requireRights(["MANAGE_ROUTING"]);

    await prisma.routingRule.update({
      where: { id },
      data: { isActive },
    });

    return {
      success: true,
      message: `Routing rule ${isActive ? "enabled" : "disabled"} successfully!`,
    };
  } catch (error: any) {
    console.error("Error toggling routing rule:", error);
    return {
      success: false,
      message: error.message || "Failed to update routing rule.",
    };
  }
}

/**
 * Delete a routing rule
 */
export async function deleteRoutingRule(id: string) {
  try {
    if (!id) {
      return { success: false, message: "Rule ID is required." };
    }

    await requireRights(["MANAGE_ROUTING"]);

    await prisma.routingRule.delete({
      where: { id },
    });

    return { success: true, message: "Routing rule deleted successfully!" };
  } catch (error: any) {
    console.error("Error deleting routing rule:", error);
    return {
      success: false,
      message: error.message || "Failed to delete routing rule.",
    };
  }
}
