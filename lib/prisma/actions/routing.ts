"use server";

import prisma from "../prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/auth";
import { Role } from "@/prisma/generated/prisma/enums";

/**
 * Fetch all routing rules in the system
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
            designation: true
          }
        }
      },
      orderBy: { category: { name: "asc" } }
    });

    return {
      success: true,
      rules: rules.map(r => ({
        id: r.id,
        categoryId: r.categoryId,
        categoryName: r.category.name,
        userId: r.userId,
        userName: r.user.fullName,
        userEmail: r.user.email,
        userRole: r.user.role,
        userDesignation: r.user.designation || "",
        isActive: r.isActive
      }))
    };
  } catch (error: any) {
    console.error("Error fetching routing rules:", error);
    return { success: false, message: "Failed to load routing rules." };
  }
}

/**
 * Create a new routing rule
 */
export async function createRoutingRule(data: { categoryId: string; userId: string }) {
  try {
    if (!data.categoryId || !data.userId) {
      return { success: false, message: "Category and User are required fields." };
    }

    // Check if duplicate rule exists
    const existing = await prisma.routingRule.findUnique({
      where: {
        categoryId_userId: {
          categoryId: data.categoryId,
          userId: data.userId
        }
      }
    });

    if (existing) {
      return { success: false, message: "A routing rule already exists for this category and user combination." };
    }

    await prisma.routingRule.create({
      data: {
        categoryId: data.categoryId,
        userId: data.userId,
        isActive: true
      }
    });

    return { success: true, message: "Routing rule created successfully!" };
  } catch (error: any) {
    console.error("Error creating routing rule:", error);
    return { success: false, message: "Failed to create routing rule." };
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

    await prisma.routingRule.update({
      where: { id },
      data: { isActive }
    });

    return { success: true, message: `Routing rule ${isActive ? "enabled" : "disabled"} successfully!` };
  } catch (error: any) {
    console.error("Error toggling routing rule:", error);
    return { success: false, message: "Failed to update routing rule." };
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

    await prisma.routingRule.delete({
      where: { id }
    });

    return { success: true, message: "Routing rule deleted successfully!" };
  } catch (error: any) {
    console.error("Error deleting routing rule:", error);
    return { success: false, message: "Failed to delete routing rule." };
  }
}
