"use server";

import prisma from "../prisma";
import { getAuthenticatedUser, requireUser, requireRights } from "./auth";
import {
  RequestType,
  Priority,
  RequestStatus,
  ActivityType,
} from "@/prisma/generated/prisma/enums";

/**
 * File a new grievance or query request in the database
 */
export async function createRequest(data: {
  type: string;
  subject: string;
  description: string;
  priority: string;
  isAnonymous: boolean;
  raiseMode: "CATEGORY" | "DEPARTMENT";
  categoryId?: string;
  departmentId?: string;
  assignedUserIds?: string[];
  watcherUserIds?: string[];
}) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) {
      return {
        success: false,
        message: "Not authenticated. Session token missing or invalid.",
      };
    }

    // Input validations
    if (
      !data.type ||
      !data.subject.trim() ||
      !data.description.trim() ||
      !data.raiseMode
    ) {
      return {
        success: false,
        message:
          "Request type, subject, description, and raise mode are required.",
      };
    }

    if (data.raiseMode === "CATEGORY" && !data.categoryId) {
      return { success: false, message: "Category is required." };
    }

    if (data.raiseMode === "DEPARTMENT" && !data.departmentId) {
      return { success: false, message: "Department is required." };
    }

    // 1. Map type string to RequestType enum
    let typeEnum: RequestType;
    switch (data.type.toUpperCase()) {
      case "COMPLAINT":
        typeEnum = RequestType.COMPLAINT;
        break;
      case "GRIEVANCE":
        typeEnum = RequestType.GRIEVANCE;
        break;
      case "SERVICE_REQUEST":
      case "SERVICE REQUEST":
        typeEnum = RequestType.SERVICE_REQUEST;
        break;
      case "INQUIRY":
        typeEnum = RequestType.INQUIRY;
        break;
      case "SUGGESTION":
        typeEnum = RequestType.SUGGESTION;
        break;
      case "APPEAL":
        typeEnum = RequestType.APPEAL;
        break;
      default:
        typeEnum = RequestType.COMPLAINT;
    }

    // 2. Map priority string to Priority enum
    let priorityEnum: Priority;
    switch (data.priority.toUpperCase()) {
      case "LOW":
        priorityEnum = Priority.LOW;
        break;
      case "MEDIUM":
        priorityEnum = Priority.MEDIUM;
        break;
      case "HIGH":
        priorityEnum = Priority.HIGH;
        break;
      case "URGENT":
        priorityEnum = Priority.URGENT;
        break;
      default:
        priorityEnum = Priority.MEDIUM;
    }

    // 3. Verify category/department exists in DB
    if (data.raiseMode === "CATEGORY" && data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        return { success: false, message: "Selected category does not exist." };
      }
    } else if (data.raiseMode === "DEPARTMENT" && data.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });
      if (!department) {
        return {
          success: false,
          message: "Selected department does not exist.",
        };
      }
    }

    // 4. Generate public tracking Ticket ID
    const ticketId = `SBS-REQ-${Date.now().toString().slice(-5)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Create Request record in transaction
    const newRequest = await prisma.$transaction(async (tx) => {
      const req = await tx.request.create({
        data: {
          ticketId,
          type: typeEnum,
          subject: data.subject.trim(),
          description: data.description.trim(),
          priority: priorityEnum,
          isAnonymous: data.isAnonymous,
          createdById: activeUser.id,
          status: RequestStatus.SUBMITTED,
          categoryId: data.raiseMode === "CATEGORY" ? data.categoryId : null,
          departmentId:
            data.raiseMode === "DEPARTMENT" ? data.departmentId : null,
        },
      });

      // 6. Automatically resolve assignments
      const assignedIds = new Set<string>();

      if (data.raiseMode === "CATEGORY" && data.categoryId) {
        // Look up active Level 1 RoutingRules for this category
        const level1Rules = await tx.routingRule.findMany({
          where: {
            categoryId: data.categoryId,
            level: 1,
            isActive: true,
          },
        });

        if (level1Rules.length > 0) {
          level1Rules.forEach((r) => assignedIds.add(r.userId));
        } else {
          // Fallback to lowest level active rule for this category
          const fallbackRules = await tx.routingRule.findMany({
            where: {
              categoryId: data.categoryId,
              isActive: true,
            },
            orderBy: { level: "asc" },
            take: 1,
          });
          fallbackRules.forEach((r) => assignedIds.add(r.userId));
        }

        // If no category rules at all, fallback to Central Escalation Level 1
        if (assignedIds.size === 0) {
          const centralRules = await tx.routingRule.findMany({
            where: {
              isCentral: true,
              level: 1,
              isActive: true,
            },
          });
          centralRules.forEach((r) => assignedIds.add(r.userId));
        }
      } else if (data.raiseMode === "DEPARTMENT" && data.departmentId) {
        // Raise by Department
        if (data.assignedUserIds && data.assignedUserIds.length > 0) {
          data.assignedUserIds.forEach((id) => assignedIds.add(id));
        } else {
          // If no specific users are chosen, auto-assign to the HOD of that department
          const dept = await tx.department.findUnique({
            where: { id: data.departmentId },
            select: { hodId: true },
          });
          if (dept?.hodId) {
            assignedIds.add(dept.hodId);
          }
        }
      }

      // Create RequestAssignment records
      if (assignedIds.size > 0) {
        await tx.requestAssignment.createMany({
          data: Array.from(assignedIds).map((userId) => ({
            requestId: req.id,
            userId: userId,
            assignedById: activeUser.id,
            role: "PRIMARY",
            status: "PENDING",
          })),
        });
      }

      // Create RequestWatcher records
      if (data.watcherUserIds && data.watcherUserIds.length > 0) {
        await tx.requestWatcher.createMany({
          data: data.watcherUserIds.map((userId) => ({
            requestId: req.id,
            userId: userId,
            addedById: activeUser.id,
          })),
        });
      }

      // Log initial activity
      const assignedUserNames =
        assignedIds.size > 0
          ? "Auto-assigned on creation."
          : "Unassigned initially.";

      await tx.requestActivity.create({
        data: {
          requestId: req.id,
          actorId: activeUser.id,
          type: ActivityType.CREATED,
          message: `Grievance ticket created successfully. ${assignedUserNames}`,
        },
      });

      return req;
    });

    console.log("Successfully created request:", newRequest);
    return {
      success: true,
      message: "Grievance filed successfully!",
      ticketId: newRequest.ticketId,
    };
  } catch (error: any) {
    console.error("Error creating request:", error);
    return {
      success: false,
      message: "Failed to submit request due to database error.",
    };
  }
}

/**
 * Fetch all request records filed by the currently authenticated student
 */
export async function getStudentRequests() {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) {
      return {
        success: false,
        message: "Not authenticated. Session token missing.",
      };
    }

    const requests = await prisma.request.findMany({
      where: { createdById: activeUser.id },
      include: {
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        ticketId: r.ticketId,
        type: r.type,
        category: r.category?.name || "N/A",
        subject: r.subject,
        status: r.status,
        priority: r.priority,
        date: r.createdAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("Error fetching student requests:", error);
    return {
      success: false,
      message: "Failed to load requests due to database error.",
    };
  }
}

/**
 * Fetch all requests (Staff get all, Students get only their own)
 */
export async function getAllRequests() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, message: "Not authenticated." };
    }

    let requests;
    const rights = user.rights || [];
    const isAdmin = rights.includes("ADMIN") || rights.includes("VIEW_ALL_REQUESTS");
    const isDeptManager = rights.includes("MANAGE_DEPARTMENT");
    const hasStaffRights =
      rights.includes("RESOLVE_GRIEVANCES") ||
      rights.includes("MANAGE_ROUTING") ||
      rights.includes("MANAGE_CONFIGS") ||
      rights.includes("MANAGE_USERS") ||
      rights.includes("MANAGE_STUDENTS") ||
      rights.includes("MANAGE_DEPARTMENT");

    if (isAdmin) {
      requests = await prisma.request.findMany({
        include: {
          category: { select: { name: true } },
          department: { select: { name: true } },
          createdBy: { select: { fullName: true, rollNumber: true } },
          assignments: {
            include: {
              user: { select: { id: true, fullName: true, role: true } },
            },
          },
          watchers: { select: { userId: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (isDeptManager && user.departmentId) {
      requests = await prisma.request.findMany({
        where: {
          OR: [
            { departmentId: user.departmentId },
            {
              createdBy: {
                departmentId: user.departmentId,
              },
            },
            {
              assignments: {
                some: { userId: user.id },
              },
            },
            {
              watchers: {
                some: { userId: user.id },
              },
            },
            { createdById: user.id },
          ],
        },
        include: {
          category: { select: { name: true } },
          department: { select: { name: true } },
          createdBy: { select: { fullName: true, rollNumber: true } },
          assignments: {
            include: {
              user: { select: { id: true, fullName: true, role: true } },
            },
          },
          watchers: { select: { userId: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (hasStaffRights) {
      // Staff with resolution/assignment rights
      requests = await prisma.request.findMany({
        where: {
          OR: [
            {
              assignments: {
                some: { userId: user.id },
              },
            },
            {
              watchers: {
                some: { userId: user.id },
              },
            },
            { createdById: user.id },
          ],
        },
        include: {
          category: { select: { name: true } },
          department: { select: { name: true } },
          createdBy: { select: { fullName: true, rollNumber: true } },
          assignments: {
            include: {
              user: { select: { id: true, fullName: true, role: true } },
            },
          },
          watchers: { select: { userId: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Regular user / student: view self-created requests and requests where they are watching
      requests = await prisma.request.findMany({
        where: {
          OR: [
            { createdById: user.id },
            {
              watchers: {
                some: { userId: user.id },
              },
            },
          ],
        },
        include: {
          category: { select: { name: true } },
          department: { select: { name: true } },
          createdBy: { select: { fullName: true, rollNumber: true } },
          assignments: {
            include: {
              user: { select: { id: true, fullName: true, role: true } },
            },
          },
          watchers: { select: { userId: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return {
      success: true,
      requests: requests.map((r: any) => {
        const primaryAssignee = r.assignments.find(
          (a: any) => a.role === "PRIMARY",
        )?.user;
        const assignedNames = r.assignments
          .map((a: any) => a.user.fullName)
          .join(", ");
        const isWatcher = r.watchers?.some((w: any) => w.userId === user.id) || false;

        return {
          id: r.id,
          ticketId: r.ticketId,
          type: r.type,
          category: r.category?.name || "N/A",
          department: r.department?.name || "General",
          subject: r.subject,
          description: r.description,
          status: r.status,
          priority: r.priority,
          studentName: r.isAnonymous ? "Anonymous" : r.createdBy.fullName,
          createdByName: r.isAnonymous ? "Anonymous" : r.createdBy.fullName,
          studentRoll: r.isAnonymous ? "N/A" : r.createdBy.rollNumber || "N/A",
          assignedToId: primaryAssignee?.id || null,
          assignedToName: assignedNames || "Unassigned",
          date: r.createdAt.toISOString(),
          isAnonymous: r.isAnonymous,
          escalationLevel: r.escalationLevel || 0,
          isEscalated: r.isEscalated || false,
          tags: r.tags || [],
          isWatcher,
        };
      }),
      userRole: user.role,
      userRights: user.rights || [],
      userId: user.id,
      userDeptId: user.departmentId || "",
    };
  } catch (error: any) {
    console.error("Error fetching all requests:", error);
    return {
      success: false,
      message: "Failed to load requests due to database error.",
    };
  }
}

/**
 * Fetch detailed request data including comments, activities and files
 */
export async function getRequestDetails(requestId: string) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) {
      return { success: false, message: "Not authenticated." };
    }

    const reqDetails = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        category: true,
        department: true,
        createdBy: {
          include: {
            department: true,
            course: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: true,
                designation: true,
                email: true,
              },
            },
          },
        },
        watchers: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: true,
                designation: true,
                email: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                role: true,
                designation: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        activities: {
          include: {
            actor: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        attachments: {
          include: {
            uploadedBy: {
              select: {
                fullName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!reqDetails) {
      return { success: false, message: "Request not found." };
    }

    // Access control evaluation
    let hasAccess = false;
    const isCreator = reqDetails.createdById === activeUser.id;
    const isAssigned = reqDetails.assignments.some(
      (a) => a.userId === activeUser.id,
    );
    const isWatcher = reqDetails.watchers.some(
      (w) => w.userId === activeUser.id,
    );

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN") || rights.includes("VIEW_ALL_REQUESTS");
    const isDeptManager =
      rights.includes("MANAGE_DEPARTMENT") &&
      activeUser.departmentId &&
      (reqDetails.departmentId === activeUser.departmentId ||
        reqDetails.createdBy.departmentId === activeUser.departmentId);

    if (isAdmin || isDeptManager) {
      hasAccess = true;
    } else {
      hasAccess = isCreator || isAssigned || isWatcher;
    }

    if (!hasAccess) {
      return {
        success: false,
        message:
          "Access Denied. You do not have permission to view this ticket.",
      };
    }

    const hasStaffRights =
      rights.length > 0 || isAssigned || isWatcher || isDeptManager || isAdmin;

    const visibleComments = reqDetails.comments.filter((c) => {
      if (!c.internal) return true;
      return hasStaffRights;
    });

    const mappedDetails = {
      id: reqDetails.id,
      ticketId: reqDetails.ticketId,
      type: reqDetails.type,
      subject: reqDetails.subject,
      description: reqDetails.description,
      status: reqDetails.status,
      priority: reqDetails.priority,
      createdAt: reqDetails.createdAt.toISOString(),
      updatedAt: reqDetails.updatedAt.toISOString(),
      isAnonymous: reqDetails.isAnonymous,
      categoryId: reqDetails.categoryId || "",
      categoryName: reqDetails.category?.name || "General",
      departmentId: reqDetails.departmentId || "",
      departmentName: reqDetails.department?.name || "",
      departmentHodId: reqDetails.department?.hodId || "",
      student: {
        id: reqDetails.createdById,
        name: reqDetails.isAnonymous
          ? "Anonymous Student"
          : reqDetails.createdBy.fullName,
        fullName: reqDetails.isAnonymous
          ? "Anonymous Student"
          : reqDetails.createdBy.fullName,
        email: reqDetails.isAnonymous ? "N/A" : reqDetails.createdBy.email,
        rollNumber: reqDetails.isAnonymous
          ? "N/A"
          : reqDetails.createdBy.rollNumber || "N/A",
        mobileNumber: reqDetails.isAnonymous
          ? "N/A"
          : reqDetails.createdBy.mobileNumber || "N/A",
        courseName: reqDetails.createdBy.course?.name || "N/A",
        departmentId: reqDetails.createdBy.departmentId || "",
        departmentName: reqDetails.createdBy.department?.name || "N/A",
      },
      creator: {
        id: reqDetails.createdById,
        name: reqDetails.isAnonymous
          ? "Anonymous Student"
          : reqDetails.createdBy.fullName,
        fullName: reqDetails.isAnonymous
          ? "Anonymous Student"
          : reqDetails.createdBy.fullName,
        email: reqDetails.isAnonymous ? "N/A" : reqDetails.createdBy.email,
        rollNumber: reqDetails.isAnonymous
          ? "N/A"
          : reqDetails.createdBy.rollNumber || "N/A",
        mobileNumber: reqDetails.isAnonymous
          ? "N/A"
          : reqDetails.createdBy.mobileNumber || "N/A",
        courseName: reqDetails.createdBy.course?.name || "N/A",
        departmentId: reqDetails.createdBy.departmentId || "",
        departmentName: reqDetails.createdBy.department?.name || "N/A",
      },
      assignments: reqDetails.assignments.map((a) => ({
        id: a.id,
        userId: a.userId,
        name: a.user.fullName,
        email: a.user.email,
        role: a.user.role,
        designation: a.user.designation || "",
        assignmentRole: a.role,
        status: a.status,
        assignedAt: a.assignedAt.toISOString(),
        user: {
          id: a.user.id,
          name: a.user.fullName,
          fullName: a.user.fullName,
          email: a.user.email,
          role: a.user.role,
          designation: a.user.designation || "",
        },
      })),
      watchers: reqDetails.watchers.map((w) => ({
        id: w.userId,
        userId: w.userId,
        name: w.user.fullName,
        email: w.user.email,
        role: w.user.role,
        designation: w.user.designation || "",
        user: {
          id: w.user.id,
          name: w.user.fullName,
          fullName: w.user.fullName,
          email: w.user.email,
          role: w.user.role,
          designation: w.user.designation || "",
        },
      })),
      comments: visibleComments.map((c) => ({
        id: c.id,
        message: c.message,
        authorId: c.authorId,
        authorName: c.author.fullName,
        authorRole: c.author.role,
        authorDesignation: c.author.designation || "",
        createdAt: c.createdAt.toISOString(),
        internal: c.internal,
      })),
      activities: reqDetails.activities.map((a) => ({
        id: a.id,
        type: a.type,
        oldValue: a.oldValue,
        newValue: a.newValue,
        message: a.message,
        createdAt: a.createdAt.toISOString(),
        actorName: a.actor?.fullName || "System",
        actorRole: a.actor?.role || "SYSTEM",
      })),
      attachments: reqDetails.attachments.map((att) => ({
        id: att.id,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        uploadedByName: att.uploadedBy.fullName,
        createdAt: att.createdAt.toISOString(),
      })),
      escalationLevel: reqDetails.escalationLevel || 0,
      lastEscalatedAt: reqDetails.lastEscalatedAt ? reqDetails.lastEscalatedAt.toISOString() : null,
      isEscalated: reqDetails.isEscalated || false,
      tags: reqDetails.tags || [],
      canEscalate: (() => {
        const isTerminal = (
          [
            RequestStatus.RESOLVED,
            RequestStatus.CLOSED,
            RequestStatus.REJECTED,
            RequestStatus.CANCELLED,
          ] as RequestStatus[]
        ).includes(reqDetails.status);
        if (isTerminal) return false;
        const isCreatorOrAdmin = isCreator || rights.includes("ADMIN");
        if (!isCreatorOrAdmin) return false;
        const baseDate = reqDetails.lastEscalatedAt || reqDetails.createdAt;
        const msPassed = Date.now() - new Date(baseDate).getTime();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        return msPassed >= sevenDaysMs;
      })(),
      daysUntilEscalation: (() => {
        const baseDate = reqDetails.lastEscalatedAt || reqDetails.createdAt;
        const msPassed = Date.now() - new Date(baseDate).getTime();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        return Math.max(0, Math.ceil((sevenDaysMs - msPassed) / (24 * 60 * 60 * 1000)));
      })(),
    };

    return {
      success: true,
      request: mappedDetails,
      userRole: activeUser.role,
      userRights: activeUser.rights,
      userId: activeUser.id,
      userDeptId: activeUser.departmentId || "",
    };
  } catch (error: any) {
    console.error("Error retrieving request details:", error);
    return {
      success: false,
      message: "Failed to retrieve ticket information.",
    };
  }
}

/**
 * Manually escalate a grievance request by the student creator
 * Automatically forwards to the next authority (next level or central escalation)
 */
export async function escalateRequest(requestId: string, reason?: string) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) {
      return { success: false, message: "Not authenticated." };
    }

    const req = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        category: true,
        department: true,
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, role: true } },
          },
        },
      },
    });

    if (!req) {
      return { success: false, message: "Request not found." };
    }

    const isAdmin = activeUser.rights?.includes("ADMIN");

    // Must be the creator of the request (or admin)
    if (req.createdById !== activeUser.id && !isAdmin) {
      return {
        success: false,
        message: "Only the creator of this request or an administrator can escalate it.",
      };
    }

    // Cannot escalate closed or resolved requests
    const isTerminal = (
      [
        RequestStatus.RESOLVED,
        RequestStatus.CLOSED,
        RequestStatus.REJECTED,
        RequestStatus.CANCELLED,
      ] as RequestStatus[]
    ).includes(req.status);

    if (isTerminal) {
      return {
        success: false,
        message: `Cannot escalate a request that is already ${req.status}.`,
      };
    }

    // 7-day cooldown check
    const baseDate = req.lastEscalatedAt || req.createdAt;
    const msPassed = Date.now() - new Date(baseDate).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    if (msPassed < sevenDaysMs && !isAdmin) {
      const daysLeft = Math.ceil(
        (sevenDaysMs - msPassed) / (24 * 60 * 60 * 1000),
      );
      return {
        success: false,
        message: `Escalation is available after 7 days from previous action (${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining).`,
      };
    }

    const currentEscalation = req.escalationLevel;
    const nextEscalation = currentEscalation + 1;
    const targetCategoryLevel = nextEscalation + 1; // Level 2, Level 3...

    let nextAssigneeIds: string[] = [];
    let nextTargetLabel = "";

    // 1. Check if Category-specific routing rule exists for targetCategoryLevel
    if (req.categoryId) {
      const categoryRules = await prisma.routingRule.findMany({
        where: {
          categoryId: req.categoryId,
          level: targetCategoryLevel,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              role: true,
              designation: true,
            },
          },
        },
      });

      if (categoryRules.length > 0) {
        nextAssigneeIds = categoryRules.map((r) => r.userId);
        nextTargetLabel = `Level ${targetCategoryLevel} (${categoryRules.map((r) => r.user.fullName).join(", ")})`;
      }
    }

    // 2. If no category-specific rule found, escalate to Central Escalation Section
    if (nextAssigneeIds.length === 0) {
      const centralRules = await prisma.routingRule.findMany({
        where: {
          isCentral: true,
          isActive: true,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              role: true,
              designation: true,
            },
          },
        },
        orderBy: { level: "asc" },
      });

      if (centralRules.length > 0) {
        const assignedUserIds = new Set(req.assignments.map((a) => a.userId));
        const unassignedCentral = centralRules.filter(
          (r) => !assignedUserIds.has(r.userId),
        );

        const targetCentral =
          unassignedCentral.length > 0
            ? unassignedCentral[0]
            : centralRules[centralRules.length - 1];
        nextAssigneeIds = [targetCentral.userId];
        nextTargetLabel = `Central Authority Level ${targetCentral.level} (${targetCentral.user.fullName})`;
      } else {
        // Fallback: If no central rules configured, find administrator
        const adminUsers = await prisma.user.findMany({
          where: {
            rights: { has: "ADMIN" },
            status: "ACTIVE",
          },
          take: 1,
        });
        if (adminUsers.length > 0) {
          nextAssigneeIds = [adminUsers[0].id];
          nextTargetLabel = `Central Administration (${adminUsers[0].fullName})`;
        }
      }
    }

    if (nextAssigneeIds.length === 0) {
      return {
        success: false,
        message: "No escalation authority could be resolved in the system.",
      };
    }

    // Execute escalation in transaction
    const newTag = `escalated-${nextEscalation}`;
    const updatedTags = Array.from(new Set([...(req.tags || []), newTag]));

    const nextPriority =
      req.priority === Priority.LOW
        ? Priority.MEDIUM
        : req.priority === Priority.MEDIUM
        ? Priority.HIGH
        : Priority.URGENT;

    await prisma.$transaction(async (tx) => {
      // Update request metadata
      await tx.request.update({
        where: { id: req.id },
        data: {
          escalationLevel: nextEscalation,
          lastEscalatedAt: new Date(),
          isEscalated: true,
          tags: updatedTags,
          priority: nextPriority,
          status: RequestStatus.UNDER_REVIEW,
        },
      });

      // Move existing primary assignments to SECONDARY
      await tx.requestAssignment.updateMany({
        where: {
          requestId: req.id,
          role: "PRIMARY",
        },
        data: {
          role: "SECONDARY",
        },
      });

      // Upsert new primary assignees
      for (const newUserId of nextAssigneeIds) {
        const existing = await tx.requestAssignment.findUnique({
          where: {
            requestId_userId: {
              requestId: req.id,
              userId: newUserId,
            },
          },
        });

        if (existing) {
          await tx.requestAssignment.update({
            where: { id: existing.id },
            data: {
              role: "PRIMARY",
              status: "PENDING",
            },
          });
        } else {
          await tx.requestAssignment.create({
            data: {
              requestId: req.id,
              userId: newUserId,
              assignedById: activeUser.id,
              role: "PRIMARY",
              status: "PENDING",
            },
          });
        }
      }

      // Add timeline log activity
      await tx.requestActivity.create({
        data: {
          requestId: req.id,
          actorId: activeUser.id,
          type: ActivityType.ESCALATED,
          oldValue:
            currentEscalation === 0
              ? "Standard (Level 1)"
              : `Escalated Level ${currentEscalation}`,
          newValue: `Escalated Level ${nextEscalation}`,
          message: reason?.trim()
            ? `Request escalated by student to ${nextTargetLabel}. Reason: "${reason.trim()}"`
            : `Request escalated by student to ${nextTargetLabel} following 7-day resolution threshold.`,
        },
      });
    });

    return {
      success: true,
      message: `Request successfully escalated to Level ${nextEscalation} (${nextTargetLabel}).`,
    };
  } catch (error: any) {
    console.error("Error escalating request:", error);
    return {
      success: false,
      message: "Failed to escalate request due to an internal error.",
    };
  }
}

/**
 * Update request status & log activity
 */
export async function updateRequestStatus(
  requestId: string,
  newStatus: string,
  commentMessage?: string,
) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) return { success: false, message: "Not authenticated." };

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        assignments: true,
        watchers: true,
      },
    });
    if (!request)
      return { success: false, message: "Request ticket not found." };

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN") || rights.includes("RESOLVE_GRIEVANCES");
    const isAssigned = request.assignments.some((a) => a.userId === activeUser.id);
    const isDeptManager =
      rights.includes("MANAGE_DEPARTMENT") &&
      activeUser.departmentId &&
      (request.departmentId === activeUser.departmentId);
    const isWatcher = request.watchers.some((w) => w.userId === activeUser.id);

    // Watchers who are not admin, assigned handler, or dept manager have read-only access
    if (isWatcher && !isAdmin && !isAssigned && !isDeptManager) {
      return {
        success: false,
        message: "Access Denied. Watchers have read-only access and cannot update ticket status.",
      };
    }

    // Map status string to RequestStatus enum
    let statusEnum = newStatus.toUpperCase() as RequestStatus;

    // Update status
    await prisma.request.update({
      where: { id: requestId },
      data: { status: statusEnum },
    });

    // Log status activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: activeUser.id,
        type: ActivityType.STATUS_CHANGED,
        oldValue: request.status,
        newValue: statusEnum,
        message:
          commentMessage ||
          `Status changed from ${request.status} to ${statusEnum}.`,
      },
    });

    return { success: true, message: "Status updated successfully!" };
  } catch (error: any) {
    console.error("Error changing request status:", error);
    return { success: false, message: "Database error during status update." };
  }
}

/**
 * Assign / Forward request to another staff member
 */
export async function assignRequest(
  requestId: string,
  assignedToId: string,
  message?: string,
) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) return { success: false, message: "Not authenticated." };

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { assignments: true, createdBy: true },
    });
    if (!request) return { success: false, message: "Request not found." };

    // Authorization checks
    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN");
    const hasRoutingRight = rights.includes("MANAGE_ROUTING");
    const hasDeptRight =
      rights.includes("MANAGE_DEPARTMENT") &&
      activeUser.departmentId &&
      (request.departmentId === activeUser.departmentId ||
        request.createdBy.departmentId === activeUser.departmentId);

    if (!isAdmin && !hasRoutingRight && !hasDeptRight) {
      return {
        success: false,
        message:
          "Access Denied. You do not have permissions to manually assign handlers for this request.",
      };
    }

    // Fetch details of assigned staff member
    const staff = await prisma.user.findUnique({
      where: { id: assignedToId },
    });
    if (!staff || (staff.role === "STUDENT" && staff.rights.length === 0)) {
      return {
        success: false,
        message: "Cannot assign: Assigned user is not a valid staff member.",
      };
    }

    // Check if duplicate assignment exists
    const existing = request.assignments.find((a) => a.userId === assignedToId);
    if (existing) {
      return {
        success: false,
        message: `${staff.fullName} is already assigned to this request.`,
      };
    }

    // Update request status to ASSIGNED if SUBMITTED
    const nextStatus =
      request.status === RequestStatus.SUBMITTED
        ? RequestStatus.ASSIGNED
        : request.status;

    await prisma.$transaction(async (tx) => {
      // Create request assignment
      await tx.requestAssignment.create({
        data: {
          requestId,
          userId: assignedToId,
          assignedById: activeUser.id,
          role: "PRIMARY",
          status: "PENDING",
        },
      });

      // Update request status
      if (nextStatus !== request.status) {
        await tx.request.update({
          where: { id: requestId },
          data: { status: nextStatus },
        });
      }
    });

    // Log Assignment Activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: activeUser.id,
        type: ActivityType.ASSIGNED,
        newValue: staff.fullName,
        message: message || `Request assigned to ${staff.fullName}.`,
      },
    });

    // If status changes to ASSIGNED, log that as well
    if (nextStatus !== request.status) {
      await prisma.requestActivity.create({
        data: {
          requestId,
          actorId: activeUser.id,
          type: ActivityType.STATUS_CHANGED,
          oldValue: request.status,
          newValue: nextStatus,
          message: `Status auto-changed to ${nextStatus} on assignment.`,
        },
      });
    }

    return {
      success: true,
      message: `Request successfully assigned to ${staff.fullName}!`,
    };
  } catch (error: any) {
    console.error("Error assigning request:", error);
    return { success: false, message: "Database error during assignment." };
  }
}

/**
 * Add comment to a request & log commented activity
 */
export async function addRequestComment(
  requestId: string,
  message: string,
  internal: boolean,
) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) return { success: false, message: "Not authenticated." };

    if (!message.trim()) {
      return { success: false, message: "Comment message cannot be empty." };
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        assignments: true,
        watchers: true,
      },
    });

    if (!request) return { success: false, message: "Request not found." };

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN");
    const isCreator = request.createdById === activeUser.id;
    const isAssigned = request.assignments.some((a) => a.userId === activeUser.id);
    const isDeptManager =
      rights.includes("MANAGE_DEPARTMENT") &&
      activeUser.departmentId &&
      (request.departmentId === activeUser.departmentId);
    const isWatcher = request.watchers.some((w) => w.userId === activeUser.id);

    // Watchers who are not admin, creator, assigned handler, or dept manager have read-only access
    if (isWatcher && !isAdmin && !isCreator && !isAssigned && !isDeptManager) {
      return {
        success: false,
        message: "Access Denied. Watchers have read-only access to this grievance timeline.",
      };
    }

    // Insert comment
    await prisma.requestComment.create({
      data: {
        requestId,
        authorId: activeUser.id,
        message: message.trim(),
        internal,
      },
    });

    // Log activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: activeUser.id,
        type: ActivityType.COMMENTED,
        message: internal
          ? "Added an internal comment (Staff Only)."
          : "Added a public comment.",
      },
    });

    return { success: true, message: "Comment added successfully!" };
  } catch (error: any) {
    console.error("Error writing request comment:", error);
    return { success: false, message: "Database error adding comment." };
  }
}

/**
 * Add an attachment to a request & log activity
 */
export async function addRequestAttachment(
  requestId: string,
  fileName: string,
  fileSize: number,
  fileUrl: string,
) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) return { success: false, message: "Not authenticated." };

    if (!fileName.trim() || !fileUrl.trim()) {
      return { success: false, message: "File name and URL are required." };
    }

    const mime = fileName.split(".").pop() || "txt";

    // Insert attachment
    const newAttachment = await prisma.requestAttachment.create({
      data: {
        requestId,
        uploadedById: activeUser.id,
        fileName: fileName.trim(),
        fileUrl: fileUrl.trim(),
        mimeType: mime,
        fileSize: Number(fileSize),
      },
    });

    // Log Activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: activeUser.id,
        type: ActivityType.ATTACHMENT_ADDED,
        message: `Attached file: ${fileName.trim()}`,
      },
    });

    console.log("Successfully added attachment:", newAttachment);
    return { success: true, message: "Attachment added successfully!" };
  } catch (error: any) {
    console.error("Error adding attachment:", error);
    return { success: false, message: "Failed to add attachment." };
  }
}

/**
 * Remove assignee from request
 */
export async function unassignRequest(requestId: string, userId: string) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) return { success: false, message: "Not authenticated." };

    const assignment = await prisma.requestAssignment.findUnique({
      where: {
        requestId_userId: {
          requestId,
          userId,
        },
      },
      include: {
        user: { select: { fullName: true } },
      },
    });

    if (!assignment) {
      return { success: false, message: "Assignment not found." };
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { createdBy: true },
    });
    if (!request) return { success: false, message: "Request not found." };

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN");
    const hasRoutingRight = rights.includes("MANAGE_ROUTING");
    const hasDeptRight =
      rights.includes("MANAGE_DEPARTMENT") &&
      activeUser.departmentId &&
      (request.departmentId === activeUser.departmentId ||
        request.createdBy.departmentId === activeUser.departmentId);

    if (!isAdmin && !hasRoutingRight && !hasDeptRight) {
      return {
        success: false,
        message:
          "Access Denied. You do not have permissions to modify assignments for this request.",
      };
    }

    await prisma.requestAssignment.delete({
      where: {
        requestId_userId: {
          requestId,
          userId,
        },
      },
    });

    // Log Unassignment Activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: activeUser.id,
        type: ActivityType.FORWARDED,
        oldValue: assignment.user.fullName,
        message: `Removed ${assignment.user.fullName} from assigned handlers.`,
      },
    });

    return {
      success: true,
      message: `Removed ${assignment.user.fullName} from assigned handlers.`,
    };
  } catch (error: any) {
    console.error("Error unassigning user:", error);
    return { success: false, message: "Failed to remove assignment." };
  }
}

/**
 * Add a watcher to a request
 */
export async function addRequestWatcher(requestId: string, userId: string) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) return { success: false, message: "Not authenticated." };

    const existing = await prisma.requestWatcher.findUnique({
      where: {
        requestId_userId: {
          requestId,
          userId,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        message: "User is already watching this request.",
      };
    }

    const staff = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

    if (!staff) {
      return { success: false, message: "Staff user not found." };
    }

    await prisma.requestWatcher.create({
      data: {
        requestId,
        userId,
        addedById: activeUser.id,
      },
    });

    // Log Activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: activeUser.id,
        type: ActivityType.COMMENTED,
        message: `Added ${staff.fullName} as a watcher.`,
      },
    });

    return { success: true, message: `Added ${staff.fullName} as a watcher.` };
  } catch (error: any) {
    console.error("Error adding watcher:", error);
    return { success: false, message: "Failed to add watcher." };
  }
}

/**
 * Remove a watcher from a request
 */
export async function removeRequestWatcher(requestId: string, userId: string) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) return { success: false, message: "Not authenticated." };

    const watcher = await prisma.requestWatcher.findUnique({
      where: {
        requestId_userId: {
          requestId,
          userId,
        },
      },
      include: {
        user: { select: { fullName: true } },
      },
    });

    if (!watcher) {
      return { success: false, message: "Watcher not found on this request." };
    }

    const isSelf = activeUser.id === userId;
    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN");
    const hasRoutingRight = rights.includes("MANAGE_ROUTING");

    if (!isSelf && !isAdmin && !hasRoutingRight) {
      // Check if caller is department manager
      const req = await prisma.request.findUnique({
        where: { id: requestId },
        select: { departmentId: true, createdBy: { select: { departmentId: true } } },
      });
      const isDeptManager =
        rights.includes("MANAGE_DEPARTMENT") &&
        activeUser.departmentId &&
        (req?.departmentId === activeUser.departmentId ||
          req?.createdBy?.departmentId === activeUser.departmentId);

      if (!isDeptManager) {
        return {
          success: false,
          message: "Access Denied. You do not have permission to remove this watcher.",
        };
      }
    }

    await prisma.requestWatcher.delete({
      where: {
        requestId_userId: {
          requestId,
          userId,
        },
      },
    });

    const activityMsg = isSelf
      ? `${watcher.user.fullName} stopped watching this ticket.`
      : `Removed ${watcher.user.fullName} from watchers list.`;

    // Log Activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: activeUser.id,
        type: ActivityType.COMMENTED,
        message: activityMsg,
      },
    });

    return {
      success: true,
      message: isSelf
        ? "You have stopped watching this request."
        : `Removed ${watcher.user.fullName} from watchers list.`,
    };
  } catch (error: any) {
    console.error("Error removing watcher:", error);
    return { success: false, message: "Failed to remove watcher." };
  }
}

/**
 * Change request category or department assignment
 */
export async function updateRequestTarget(
  requestId: string,
  targetType: "CATEGORY" | "DEPARTMENT",
  targetId: string,
) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) return { success: false, message: "Not authenticated." };

    // Authorization Gate: admin or department manager
    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN");
    const isDeptManager = rights.includes("MANAGE_DEPARTMENT");

    if (!isAdmin && !isDeptManager) {
      return {
        success: false,
        message:
          "Access Denied. Only Admins or Department Managers can change request category/department.",
      };
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { category: true, department: true },
    });
    if (!request) return { success: false, message: "Request not found." };

    // Log Activity and Update
    let oldTargetName = "";
    let newTargetName = "";

    if (targetType === "CATEGORY") {
      const newCat = await prisma.category.findUnique({
        where: { id: targetId },
      });
      if (!newCat)
        return { success: false, message: "Selected category not found." };

      oldTargetName = request.category
        ? request.category.name
        : request.department
          ? `Dept: ${request.department.name}`
          : "General";
      newTargetName = newCat.name;

      await prisma.request.update({
        where: { id: requestId },
        data: {
          categoryId: targetId,
          departmentId: null,
        },
      });
    } else {
      const newDept = await prisma.department.findUnique({
        where: { id: targetId },
      });
      if (!newDept)
        return { success: false, message: "Selected department not found." };

      oldTargetName = request.category
        ? request.category.name
        : request.department
          ? `Dept: ${request.department.name}`
          : "General";
      newTargetName = `Dept: ${newDept.name}`;

      await prisma.request.update({
        where: { id: requestId },
        data: {
          categoryId: null,
          departmentId: targetId,
        },
      });
    }

    // Log re-assignment activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: activeUser.id,
        type: ActivityType.STATUS_CHANGED,
        oldValue: oldTargetName,
        newValue: newTargetName,
        message: `Request target updated from ${oldTargetName} to ${newTargetName} by ${activeUser.fullName}.`,
      },
    });

    return {
      success: true,
      message: `Successfully updated request target to ${newTargetName}!`,
    };
  } catch (error: any) {
    console.error("Error updating request target:", error);
    return { success: false, message: "Failed to update request target." };
  }
}

/**
 * Forward request from currently assigned faculty member to another staff member
 */
export async function forwardRequest(
  requestId: string,
  targetUserId: string,
  message?: string,
) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) return { success: false, message: "Not authenticated." };

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        assignments: true,
        watchers: true,
      },
    });

    if (!request) return { success: false, message: "Request not found." };

    // Verify active user is assigned
    const activeUserAssignment = request.assignments.find(
      (a) => a.userId === activeUser.id,
    );
    if (!activeUserAssignment) {
      return {
        success: false,
        message:
          "Access Denied. Only assigned handlers can forward this request.",
      };
    }

    // Verify target user is staff
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser || (targetUser.role === "STUDENT" && targetUser.rights.length === 0)) {
      return {
        success: false,
        message: "Cannot forward: Target user is not a valid staff member.",
      };
    }

    // Verify duplicate assignment
    const existing = request.assignments.find((a) => a.userId === targetUserId);
    if (existing) {
      return {
        success: false,
        message: `${targetUser.fullName} is already assigned to this request.`,
      };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Remove active user from assignees
      await tx.requestAssignment.delete({
        where: {
          requestId_userId: {
            requestId,
            userId: activeUser.id,
          },
        },
      });

      // 2. Add active user as watcher (if not already watching)
      const isAlreadyWatcher = request.watchers.some(
        (w) => w.userId === activeUser.id,
      );
      if (!isAlreadyWatcher) {
        await tx.requestWatcher.create({
          data: {
            requestId,
            userId: activeUser.id,
            addedById: activeUser.id,
          },
        });
      }

      // 3. Add target user as assignee
      await tx.requestAssignment.create({
        data: {
          requestId,
          userId: targetUserId,
          assignedById: activeUser.id,
          role: "PRIMARY",
          status: "PENDING",
        },
      });
    });

    // 4. Log Forward Activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: activeUser.id,
        type: ActivityType.FORWARDED,
        oldValue: activeUser.fullName,
        newValue: targetUser.fullName,
        message:
          message ||
          `Request forwarded from ${activeUser.fullName} to ${targetUser.fullName}.`,
      },
    });

    return {
      success: true,
      message: `Request forwarded to ${targetUser.fullName} successfully!`,
    };
  } catch (error: any) {
    console.error("Error forwarding request:", error);
    return { success: false, message: "Database error during forward." };
  }
}
