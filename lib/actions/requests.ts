"use server";

import {
  db,
  Request,
  RequestActivity,
  RequestComment,
  RequestAttachment,
  RequestAssignment,
  RequestWatcher,
  RoutingRule,
  Department,
  Category,
  User,
  RequestType,
  Priority,
  RequestStatus,
  ActivityType,
  eq,
  and,
  or,
  inArray,
  desc,
  asc,
  sql,
  exists,
} from "@/db/drizzel";
import { getAuthenticatedUser } from "./auth";

/**
 * Helper to fetch all department IDs an HOD manages or belongs to
 */
async function getHodDepartmentIds(user: any): Promise<string[]> {
  const deptIds = new Set<string>();
  if (user.departmentId) {
    deptIds.add(user.departmentId);
  }
  if (user.managedDepartment?.id) {
    deptIds.add(user.managedDepartment.id);
  }
  // Also check if any department in the DB has this user configured as hodId
  const depts = await db.query.Department.findMany({
    where: eq(Department.hodId, user.id),
    columns: { id: true },
  });
  depts.forEach((d: any) => deptIds.add(d.id));
  return Array.from(deptIds);
}

/**
 * Check if user is an HOD / Department Manager
 */
function isUserHod(user: any, managedDeptIds: string[]): boolean {
  const rights = user.rights || [];
  return (
    rights.includes("MANAGE_DEPARTMENT") ||
    user.role === "HOD" ||
    managedDeptIds.length > 0 ||
    !!user.managedDepartment
  );
}

/**
 * Check if an HOD manages the department of a request or the student who filed it
 */
function isHodForRequest(
  user: any,
  managedDeptIds: string[],
  request: {
    departmentId?: string | null;
    department?: { id: string; hodId?: string | null } | null;
    createdBy?: {
      id?: string;
      departmentId?: string | null;
      department?: { id: string; hodId?: string | null } | null;
    } | null;
  },
): boolean {
  if (!isUserHod(user, managedDeptIds)) return false;

  // 1. Direct match on target department of request
  if (request.departmentId && managedDeptIds.includes(request.departmentId)) return true;
  if (request.department?.id && managedDeptIds.includes(request.department.id)) return true;
  if (request.department?.hodId === user.id) return true;

  // 2. Direct match on student's department who raised the grievance
  const studentDeptId = request.createdBy?.departmentId;

  if (studentDeptId && managedDeptIds.includes(studentDeptId)) return true;
  if (
    request.createdBy?.department?.id &&
    managedDeptIds.includes(request.createdBy.department.id)
  ) {
    return true;
  }
  if (request.createdBy?.department?.hodId === user.id) return true;

  return false;
}

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
      const category = await db.query.Category.findFirst({
        where: eq(Category.id, data.categoryId),
      });
      if (!category) {
        return { success: false, message: "Selected category does not exist." };
      }
    } else if (data.raiseMode === "DEPARTMENT" && data.departmentId) {
      const department = await db.query.Department.findFirst({
        where: eq(Department.id, data.departmentId),
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
    const newRequest = await db.transaction(async (tx) => {
      const [req] = await tx
        .insert(Request)
        .values({
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
        })
        .returning();

      // 6. Automatically resolve assignments (multiple faculty can be assigned at creation)
      const assignedIds = new Set<string>();

      if (data.raiseMode === "CATEGORY" && data.categoryId) {
        // Look up active Level 1 RoutingRules for this category
        const level1Rules = await tx.query.RoutingRule.findMany({
          where: and(
            eq(RoutingRule.categoryId, data.categoryId),
            eq(RoutingRule.level, 1),
            eq(RoutingRule.isActive, true),
          ),
        });

        if (level1Rules.length > 0) {
          level1Rules.forEach((r) => assignedIds.add(r.userId));
        } else {
          // Fallback to lowest level active rule for this category
          const fallbackRules = await tx.query.RoutingRule.findMany({
            where: and(
              eq(RoutingRule.categoryId, data.categoryId),
              eq(RoutingRule.isActive, true),
            ),
            orderBy: [asc(RoutingRule.level)],
            limit: 1,
          });
          fallbackRules.forEach((r) => assignedIds.add(r.userId));
        }

        // If no category rules at all, fallback to Central Escalation Level 1
        if (assignedIds.size === 0) {
          const centralRules = await tx.query.RoutingRule.findMany({
            where: and(
              eq(RoutingRule.isCentral, true),
              eq(RoutingRule.level, 1),
              eq(RoutingRule.isActive, true),
            ),
          });
          centralRules.forEach((r) => assignedIds.add(r.userId));
        }
      } else if (data.raiseMode === "DEPARTMENT" && data.departmentId) {
        // Raise by Department
        if (data.assignedUserIds && data.assignedUserIds.length > 0) {
          data.assignedUserIds.forEach((id) => assignedIds.add(id));
        } else {
          // If no specific users are chosen, auto-assign to the HOD of that department
          const dept = await tx.query.Department.findFirst({
            where: eq(Department.id, data.departmentId),
            columns: { hodId: true },
          });
          if (dept?.hodId) {
            assignedIds.add(dept.hodId);
          }
        }
      }

      // Create RequestAssignment records
      if (assignedIds.size > 0) {
        await tx.insert(RequestAssignment).values(
          Array.from(assignedIds).map((userId) => ({
            requestId: req.id,
            userId: userId,
            assignedById: activeUser.id,
            role: "PRIMARY" as const,
            status: "PENDING" as const,
          })),
        );
      }

      // Create RequestWatcher records
      if (data.watcherUserIds && data.watcherUserIds.length > 0) {
        const watchersToInsert = data.watcherUserIds
          .filter((userId) => !assignedIds.has(userId))
          .map((userId) => ({
            requestId: req.id,
            userId: userId,
            addedById: activeUser.id,
          }));

        if (watchersToInsert.length > 0) {
          await tx.insert(RequestWatcher).values(watchersToInsert);
        }
      }

      // Log initial activity
      const assignedUserNames =
        assignedIds.size > 0
          ? "Auto-assigned on creation."
          : "Unassigned initially.";

      await tx.insert(RequestActivity).values({
        requestId: req.id,
        actorId: activeUser.id,
        type: ActivityType.CREATED,
        message: `Grievance ticket created successfully. ${assignedUserNames}`,
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

    const requests = await db.query.Request.findMany({
      where: eq(Request.createdById, activeUser.id),
      with: {
        category: {
          columns: {
            name: true,
          },
        },
      },
      orderBy: [desc(Request.createdAt)],
    });

    return {
      success: true,
      requests: requests.map((r: any) => ({
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
 * Fetch all requests based on role, department management, assignments, and watchlists
 */
export async function getAllRequests() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return { success: false, message: "Not authenticated." };
    }

    const rights = user.rights || [];
    const isAdmin = rights.includes("ADMIN") || rights.includes("VIEW_ALL_REQUESTS");
    const managedDeptIds = await getHodDepartmentIds(user);
    const isDeptManager = isUserHod(user, managedDeptIds);

    const standardWith = {
      category: { columns: { name: true } },
      department: { columns: { name: true } },
      createdBy: { columns: { fullName: true, rollNumber: true } },
      assignments: {
        with: {
          user: { columns: { id: true, fullName: true, role: true } },
        },
      },
      watchers: { columns: { userId: true } },
    };

    let requests;

    if (isAdmin) {
      // Admins see all requests
      requests = await db.query.Request.findMany({
        with: standardWith,
        orderBy: [desc(Request.createdAt)],
      });
    } else if (isDeptManager && managedDeptIds.length > 0) {
      // HOD sees:
      // 1. Requests targeted to their department
      // 2. Requests created by students/users of their department
      // 3. Requests assigned to this HOD
      // 4. Requests watched by this HOD
      // 5. Requests created by this HOD
      const studentInDeptCondition = exists(
        db
          .select({ id: User.id })
          .from(User)
          .where(
            and(
              eq(User.id, Request.createdById),
              inArray(User.departmentId, managedDeptIds),
            ),
          ),
      );

      const assignedCondition = exists(
        db
          .select({ id: RequestAssignment.id })
          .from(RequestAssignment)
          .where(
            and(
              eq(RequestAssignment.requestId, Request.id),
              eq(RequestAssignment.userId, user.id),
            ),
          ),
      );

      const watcherCondition = exists(
        db
          .select({ requestId: RequestWatcher.requestId })
          .from(RequestWatcher)
          .where(
            and(
              eq(RequestWatcher.requestId, Request.id),
              eq(RequestWatcher.userId, user.id),
            ),
          ),
      );

      requests = await db.query.Request.findMany({
        where: or(
          inArray(Request.departmentId, managedDeptIds),
          studentInDeptCondition,
          assignedCondition,
          watcherCondition,
          eq(Request.createdById, user.id),
        ),
        with: standardWith,
        orderBy: [desc(Request.createdAt)],
      });
    } else {
      // All other faculty, staff, students, and watchers:
      const assignedCondition = exists(
        db
          .select({ id: RequestAssignment.id })
          .from(RequestAssignment)
          .where(
            and(
              eq(RequestAssignment.requestId, Request.id),
              eq(RequestAssignment.userId, user.id),
            ),
          ),
      );

      const watcherCondition = exists(
        db
          .select({ requestId: RequestWatcher.requestId })
          .from(RequestWatcher)
          .where(
            and(
              eq(RequestWatcher.requestId, Request.id),
              eq(RequestWatcher.userId, user.id),
            ),
          ),
      );

      requests = await db.query.Request.findMany({
        where: or(
          assignedCondition,
          watcherCondition,
          eq(Request.createdById, user.id),
        ),
        with: standardWith,
        orderBy: [desc(Request.createdAt)],
      });
    }

    return {
      success: true,
      requests: requests.map((r: any) => {
        const primaryAssignee = r.assignments.find(
          (a: any) => a.role === "PRIMARY",
        )?.user;
        const assignedNames = r.assignments
          .map((a: any) => a.user?.fullName)
          .filter(Boolean)
          .join(", ");
        const isWatcher = r.watchers?.some((w: any) => w.userId === user.id) || false;
        const isAssigned = r.assignments?.some((a: any) => a.userId === user.id) || false;

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
          studentName: r.isAnonymous ? "Anonymous" : r.createdBy?.fullName || "Student",
          createdByName: r.isAnonymous ? "Anonymous" : r.createdBy?.fullName || "Student",
          studentRoll: r.isAnonymous ? "N/A" : r.createdBy?.rollNumber || "N/A",
          assignedToId: primaryAssignee?.id || null,
          assignedToName: assignedNames || "Unassigned",
          date: r.createdAt.toISOString(),
          isAnonymous: r.isAnonymous,
          escalationLevel: r.escalationLevel || 0,
          isEscalated: r.isEscalated || false,
          tags: r.tags || [],
          isWatcher,
          isAssigned,
        };
      }),
      userRole: user.role,
      userRights: user.rights || [],
      userId: user.id,
      userDeptId: user.departmentId || user.managedDepartment?.id || (managedDeptIds[0] || ""),
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

    const reqDetails = await db.query.Request.findFirst({
      where: eq(Request.id, requestId),
      with: {
        category: true,
        department: true,
        createdBy: {
          with: {
            department: true,
          },
        },
        assignments: {
          with: {
            user: {
              columns: {
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
          with: {
            user: {
              columns: {
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
          with: {
            author: {
              columns: {
                id: true,
                fullName: true,
                role: true,
                designation: true,
              },
            },
          },
          orderBy: [asc(RequestComment.createdAt)],
        },
        activities: {
          with: {
            actor: {
              columns: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
          orderBy: [desc(RequestActivity.createdAt)],
        },
        attachments: {
          with: {
            uploadedBy: {
              columns: {
                fullName: true,
                role: true,
              },
            },
          },
          orderBy: [desc(RequestAttachment.createdAt)],
        },
      },
    });

    if (!reqDetails) {
      return { success: false, message: "Request not found." };
    }

    // Access control evaluation
    const isCreator = reqDetails.createdById === activeUser.id;
    const isAssigned = reqDetails.assignments.some(
      (a: any) => a.userId === activeUser.id,
    );
    const isWatcher = reqDetails.watchers.some(
      (w: any) => w.userId === activeUser.id,
    );

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN") || rights.includes("VIEW_ALL_REQUESTS");
    const managedDeptIds = await getHodDepartmentIds(activeUser);
    const isDeptManager = isHodForRequest(activeUser, managedDeptIds, reqDetails);

    const hasAccess = isAdmin || isDeptManager || isCreator || isAssigned || isWatcher;

    if (!hasAccess) {
      return {
        success: false,
        message:
          "Access Denied. You do not have permission to view this ticket.",
      };
    }

    // Pure watcher: in watchers list, but NOT an admin, NOT department HOD, NOT assigned handler, NOT creator
    const isPureWatcher =
      isWatcher && !isAdmin && !isDeptManager && !isAssigned && !isCreator;

    // Internal comments visibility: Staff, HOD, Admin, and Assignees can view internal notes; students cannot
    const canViewInternalComments =
      isAdmin ||
      isDeptManager ||
      isAssigned ||
      (activeUser.role !== "STUDENT" && (rights.length > 0 || isWatcher));

    const visibleComments = reqDetails.comments.filter((c: any) => {
      if (!c.internal) return true;
      return canViewInternalComments;
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
          : reqDetails.createdBy?.fullName || "Student",
        fullName: reqDetails.isAnonymous
          ? "Anonymous Student"
          : reqDetails.createdBy?.fullName || "Student",
        email: reqDetails.isAnonymous ? "N/A" : reqDetails.createdBy?.email || "N/A",
        rollNumber: reqDetails.isAnonymous
          ? "N/A"
          : reqDetails.createdBy?.rollNumber || "N/A",
        mobileNumber: reqDetails.isAnonymous
          ? "N/A"
          : reqDetails.createdBy?.mobileNumber || "N/A",
        courseName: reqDetails.createdBy?.specialization || reqDetails.createdBy?.degree || "N/A",
        departmentId: reqDetails.createdBy?.departmentId || "",
        departmentName: reqDetails.createdBy?.department?.name || "N/A",
      },
      creator: {
        id: reqDetails.createdById,
        name: reqDetails.isAnonymous
          ? "Anonymous Student"
          : reqDetails.createdBy?.fullName || "Student",
        fullName: reqDetails.isAnonymous
          ? "Anonymous Student"
          : reqDetails.createdBy?.fullName || "Student",
        email: reqDetails.isAnonymous ? "N/A" : reqDetails.createdBy?.email || "N/A",
        rollNumber: reqDetails.isAnonymous
          ? "N/A"
          : reqDetails.createdBy?.rollNumber || "N/A",
        mobileNumber: reqDetails.isAnonymous
          ? "N/A"
          : reqDetails.createdBy?.mobile || reqDetails.createdBy?.mobileNumber || "N/A",
        courseName: reqDetails.createdBy?.specialization || reqDetails.createdBy?.degree || "N/A",
        departmentId: reqDetails.createdBy?.departmentId || "",
        departmentName: reqDetails.createdBy?.department?.name || "N/A",
      },
      assignments: reqDetails.assignments.map((a: any) => ({
        id: a.id,
        userId: a.userId,
        name: a.user?.fullName || "",
        email: a.user?.email || "",
        role: a.user?.role || "",
        designation: a.user?.designation || "",
        assignmentRole: a.role,
        status: a.status,
        assignedAt: a.assignedAt.toISOString(),
        user: {
          id: a.user?.id,
          name: a.user?.fullName,
          fullName: a.user?.fullName,
          email: a.user?.email,
          role: a.user?.role,
          designation: a.user?.designation || "",
        },
      })),
      watchers: reqDetails.watchers.map((w: any) => ({
        id: w.userId,
        userId: w.userId,
        name: w.user?.fullName || "",
        email: w.user?.email || "",
        role: w.user?.role || "",
        designation: w.user?.designation || "",
        user: {
          id: w.user?.id,
          name: w.user?.fullName,
          fullName: w.user?.fullName,
          email: w.user?.email,
          role: w.user?.role,
          designation: w.user?.designation || "",
        },
      })),
      comments: visibleComments.map((c: any) => ({
        id: c.id,
        message: c.message,
        authorId: c.authorId,
        authorName: c.author?.fullName || "",
        authorRole: c.author?.role || "",
        authorDesignation: c.author?.designation || "",
        createdAt: c.createdAt.toISOString(),
        internal: c.internal,
      })),
      activities: reqDetails.activities.map((a: any) => ({
        id: a.id,
        type: a.type,
        oldValue: a.oldValue,
        newValue: a.newValue,
        message: a.message,
        createdAt: a.createdAt.toISOString(),
        actorName: a.actor?.fullName || "System",
        actorRole: a.actor?.role || "SYSTEM",
      })),
      attachments: reqDetails.attachments.map((att: any) => ({
        id: att.id,
        fileName: att.fileName,
        fileUrl: att.fileUrl,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        uploadedByName: att.uploadedBy?.fullName || "",
        createdAt: att.createdAt.toISOString(),
      })),
      escalationLevel: reqDetails.escalationLevel || 0,
      lastEscalatedAt: reqDetails.lastEscalatedAt ? reqDetails.lastEscalatedAt.toISOString() : null,
      isEscalated: reqDetails.isEscalated || false,
      tags: reqDetails.tags || [],
      isPureWatcher,
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
      userDeptId: activeUser.departmentId || activeUser.managedDepartment?.id || (managedDeptIds[0] || ""),
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

    const req = await db.query.Request.findFirst({
      where: eq(Request.id, requestId),
      with: {
        category: true,
        department: true,
        assignments: {
          with: {
            user: { columns: { id: true, fullName: true, role: true } },
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
      const categoryRules = await db.query.RoutingRule.findMany({
        where: and(
          eq(RoutingRule.categoryId, req.categoryId),
          eq(RoutingRule.level, targetCategoryLevel),
          eq(RoutingRule.isActive, true),
        ),
        with: {
          user: {
            columns: {
              id: true,
              fullName: true,
              role: true,
              designation: true,
            },
          },
        },
      });

      if (categoryRules.length > 0) {
        nextAssigneeIds = categoryRules.map((r: any) => r.userId);
        nextTargetLabel = `Level ${targetCategoryLevel} (${categoryRules.map((r: any) => r.user.fullName).join(", ")})`;
      }
    }

    // 2. If no category-specific rule found, escalate to Central Escalation Section
    if (nextAssigneeIds.length === 0) {
      const centralRules = await db.query.RoutingRule.findMany({
        where: and(
          eq(RoutingRule.isCentral, true),
          eq(RoutingRule.isActive, true),
        ),
        with: {
          user: {
            columns: {
              id: true,
              fullName: true,
              role: true,
              designation: true,
            },
          },
        },
        orderBy: [asc(RoutingRule.level)],
      });

      if (centralRules.length > 0) {
        const assignedUserIds = new Set(req.assignments.map((a: any) => a.userId));
        const unassignedCentral = centralRules.filter(
          (r: any) => !assignedUserIds.has(r.userId),
        );

        const targetCentral =
          unassignedCentral.length > 0
            ? unassignedCentral[0]
            : centralRules[centralRules.length - 1];
        nextAssigneeIds = [targetCentral.userId];
        nextTargetLabel = `Central Authority Level ${targetCentral.level} (${targetCentral.user.fullName})`;
      } else {
        // Fallback: If no central rules configured, find administrator
        const adminUsers = await db.query.User.findMany({
          where: and(
            sql`'ADMIN' = ANY(${User.rights})`,
            eq(User.status, "ACTIVE"),
          ),
          limit: 1,
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

    await db.transaction(async (tx) => {
      // Update request metadata
      await tx
        .update(Request)
        .set({
          escalationLevel: nextEscalation,
          lastEscalatedAt: new Date(),
          isEscalated: true,
          tags: updatedTags,
          priority: nextPriority,
          status: RequestStatus.UNDER_REVIEW,
        })
        .where(eq(Request.id, req.id));

      // Move existing primary assignments to SECONDARY
      await tx
        .update(RequestAssignment)
        .set({
          role: "SECONDARY",
        })
        .where(
          and(
            eq(RequestAssignment.requestId, req.id),
            eq(RequestAssignment.role, "PRIMARY"),
          ),
        );

      // Upsert new primary assignees
      for (const newUserId of nextAssigneeIds) {
        const existing = await tx.query.RequestAssignment.findFirst({
          where: and(
            eq(RequestAssignment.requestId, req.id),
            eq(RequestAssignment.userId, newUserId),
          ),
        });

        if (existing) {
          await tx
            .update(RequestAssignment)
            .set({
              role: "PRIMARY",
              status: "PENDING",
            })
            .where(eq(RequestAssignment.id, existing.id));
        } else {
          await tx.insert(RequestAssignment).values({
            requestId: req.id,
            userId: newUserId,
            assignedById: activeUser.id,
            role: "PRIMARY",
            status: "PENDING",
          });
        }

        // If newly escalated user was a watcher, remove them from watchers
        await tx
          .delete(RequestWatcher)
          .where(
            and(
              eq(RequestWatcher.requestId, req.id),
              eq(RequestWatcher.userId, newUserId),
            ),
          );
      }

      // Add timeline log activity
      await tx.insert(RequestActivity).values({
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
      });
    });

    console.log(`Successfully escalated request ${req.ticketId} to Level ${nextEscalation}`);
    return {
      success: true,
      message: `Request successfully escalated to Level ${nextEscalation}!`,
    };
  } catch (error: any) {
    console.error("Error escalating request:", error);
    return {
      success: false,
      message: "Database error during escalation.",
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

    const request = await db.query.Request.findFirst({
      where: eq(Request.id, requestId),
      with: {
        assignments: true,
        watchers: true,
        createdBy: true,
        department: true,
      },
    });
    if (!request) {
      return { success: false, message: "Request ticket not found." };
    }

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN") || rights.includes("RESOLVE_GRIEVANCES");
    const isAssigned = request.assignments.some((a: any) => a.userId === activeUser.id);
    const managedDeptIds = await getHodDepartmentIds(activeUser);
    const isDeptManager = isHodForRequest(activeUser, managedDeptIds, request);
    const isWatcher = request.watchers.some((w: any) => w.userId === activeUser.id);

    // Watchers have strictly read-only access
    if (isWatcher && !isAdmin && !isAssigned && !isDeptManager) {
      return {
        success: false,
        message: "Access Denied. Watchers have read-only access and cannot update ticket status.",
      };
    }

    // Must have assignment, HOD, or resolution authority
    if (!isAdmin && !isAssigned && !isDeptManager) {
      return {
        success: false,
        message: "Access Denied. You do not have permission to update ticket status.",
      };
    }

    // Map status string to RequestStatus enum
    const statusEnum = newStatus.toUpperCase() as RequestStatus;

    // Update status
    await db
      .update(Request)
      .set({ status: statusEnum })
      .where(eq(Request.id, requestId));

    // Log status activity
    await db.insert(RequestActivity).values({
      requestId,
      actorId: activeUser.id,
      type: ActivityType.STATUS_CHANGED,
      oldValue: request.status,
      newValue: statusEnum,
      message:
        commentMessage ||
        `Status changed from ${request.status} to ${statusEnum}.`,
    });

    return { success: true, message: "Status updated successfully!" };
  } catch (error: any) {
    console.error("Error changing request status:", error);
    return { success: false, message: "Database error during status update." };
  }
}

/**
 * Assign request to a staff handler.
 * Any other current assignees on this request are converted into watchers!
 */
export async function assignRequest(
  requestId: string,
  assignedToId: string,
  message?: string,
) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) return { success: false, message: "Not authenticated." };

    const request = await db.query.Request.findFirst({
      where: eq(Request.id, requestId),
      with: {
        assignments: {
          with: {
            user: { columns: { id: true, fullName: true, role: true } },
          },
        },
        watchers: true,
        createdBy: {
          with: { department: true },
        },
        department: true,
      },
    });
    if (!request) return { success: false, message: "Request not found." };

    // Authorization checks: Admin, Routing right, or Department HOD
    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN");
    const hasRoutingRight = rights.includes("MANAGE_ROUTING");
    const managedDeptIds = await getHodDepartmentIds(activeUser);
    const isDeptManager = isHodForRequest(activeUser, managedDeptIds, request);

    if (!isAdmin && !hasRoutingRight && !isDeptManager) {
      return {
        success: false,
        message:
          "Access Denied. You do not have permissions to manually assign handlers for this request.",
      };
    }

    // Fetch details of assigned staff member
    const staff = await db.query.User.findFirst({
      where: eq(User.id, assignedToId),
    });
    if (!staff || (staff.role === "STUDENT" && staff.rights.length === 0)) {
      return {
        success: false,
        message: "Cannot assign: Assigned user is not a valid staff member.",
      };
    }

    // Other current assignees to convert to watchers
    const otherAssignees = request.assignments.filter((a: any) => a.userId !== assignedToId);
    const existingWatcherUserIds = new Set(request.watchers.map((w: any) => w.userId));

    // Update request status to ASSIGNED if SUBMITTED
    const nextStatus =
      request.status === RequestStatus.SUBMITTED
        ? RequestStatus.ASSIGNED
        : request.status;

    await db.transaction(async (tx) => {
      // 1. Remove other assignees from assignments
      if (otherAssignees.length > 0) {
        const otherIds = otherAssignees.map((a: any) => a.userId);
        await tx
          .delete(RequestAssignment)
          .where(
            and(
              eq(RequestAssignment.requestId, requestId),
              inArray(RequestAssignment.userId, otherIds),
            ),
          );

        // 2. Convert them to watchers if not already watching
        const watchersToCreate = otherAssignees
          .filter((a: any) => !existingWatcherUserIds.has(a.userId))
          .map((a: any) => ({
            requestId,
            userId: a.userId,
            addedById: activeUser.id,
          }));

        if (watchersToCreate.length > 0) {
          await tx.insert(RequestWatcher).values(watchersToCreate);
        }
      }

      // 3. Remove assignedToId from watchers if they were watching
      await tx
        .delete(RequestWatcher)
        .where(
          and(
            eq(RequestWatcher.requestId, requestId),
            eq(RequestWatcher.userId, assignedToId),
          ),
        );

      // 4. Assign new handler as PRIMARY
      const existingAssignment = request.assignments.find((a: any) => a.userId === assignedToId);
      if (!existingAssignment) {
        await tx.insert(RequestAssignment).values({
          requestId,
          userId: assignedToId,
          assignedById: activeUser.id,
          role: "PRIMARY",
          status: "PENDING",
        });
      } else {
        await tx
          .update(RequestAssignment)
          .set({ role: "PRIMARY", status: "PENDING" })
          .where(
            and(
              eq(RequestAssignment.requestId, requestId),
              eq(RequestAssignment.userId, assignedToId),
            ),
          );
      }

      // 5. Update request status if needed
      if (nextStatus !== request.status) {
        await tx
          .update(Request)
          .set({ status: nextStatus })
          .where(eq(Request.id, requestId));
      }
    });

    // Log Assignment Activity
    const otherNames = otherAssignees.map((a: any) => a.user?.fullName || "staff").join(", ");
    const conversionNote =
      otherAssignees.length > 0
        ? ` Previous assignee(s) (${otherNames}) converted to watchers.`
        : "";

    await db.insert(RequestActivity).values({
      requestId,
      actorId: activeUser.id,
      type: ActivityType.ASSIGNED,
      newValue: staff.fullName,
      message: message || `Request assigned to ${staff.fullName}.${conversionNote}`,
    });

    if (nextStatus !== request.status) {
      await db.insert(RequestActivity).values({
        requestId,
        actorId: activeUser.id,
        type: ActivityType.STATUS_CHANGED,
        oldValue: request.status,
        newValue: nextStatus,
        message: `Status auto-changed to ${nextStatus} on assignment.`,
      });
    }

    return {
      success: true,
      message: `Request successfully assigned to ${staff.fullName}!${conversionNote}`,
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

    const request = await db.query.Request.findFirst({
      where: eq(Request.id, requestId),
      with: {
        assignments: true,
        watchers: true,
        createdBy: true,
        department: true,
      },
    });

    if (!request) return { success: false, message: "Request not found." };

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN");
    const isCreator = request.createdById === activeUser.id;
    const isAssigned = request.assignments.some((a: any) => a.userId === activeUser.id);
    const managedDeptIds = await getHodDepartmentIds(activeUser);
    const isDeptManager = isHodForRequest(activeUser, managedDeptIds, request);
    const isWatcher = request.watchers.some((w: any) => w.userId === activeUser.id);

    // Watchers have strictly read-only access
    if (isWatcher && !isAdmin && !isCreator && !isAssigned && !isDeptManager) {
      return {
        success: false,
        message: "Access Denied. Watchers have read-only access to this grievance timeline.",
      };
    }

    // Must be authorized to comment
    if (!isAdmin && !isCreator && !isAssigned && !isDeptManager) {
      return {
        success: false,
        message: "Access Denied. You do not have permission to comment on this request.",
      };
    }

    // Disallow regular students from posting internal comments
    if (internal && activeUser.role === "STUDENT" && !isAdmin && !isDeptManager && !isAssigned) {
      return {
        success: false,
        message: "Students cannot post internal comments.",
      };
    }

    // Insert comment
    await db.insert(RequestComment).values({
      requestId,
      authorId: activeUser.id,
      message: message.trim(),
      internal,
    });

    // Log activity
    await db.insert(RequestActivity).values({
      requestId,
      actorId: activeUser.id,
      type: ActivityType.COMMENTED,
      message: internal
        ? "Added an internal comment (Staff Only)."
        : "Added a public comment.",
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

    const request = await db.query.Request.findFirst({
      where: eq(Request.id, requestId),
      with: {
        assignments: true,
        watchers: true,
        createdBy: true,
        department: true,
      },
    });
    if (!request) return { success: false, message: "Request not found." };

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN");
    const isCreator = request.createdById === activeUser.id;
    const isAssigned = request.assignments.some((a: any) => a.userId === activeUser.id);
    const managedDeptIds = await getHodDepartmentIds(activeUser);
    const isDeptManager = isHodForRequest(activeUser, managedDeptIds, request);
    const isWatcher = request.watchers.some((w: any) => w.userId === activeUser.id);

    // Watchers have read-only access
    if (isWatcher && !isAdmin && !isCreator && !isAssigned && !isDeptManager) {
      return {
        success: false,
        message: "Access Denied. Watchers have read-only access and cannot upload attachments.",
      };
    }

    // Must be authorized to attach files
    if (!isAdmin && !isCreator && !isAssigned && !isDeptManager) {
      return {
        success: false,
        message: "Access Denied. You do not have permission to attach files to this request.",
      };
    }

    const mime = fileName.split(".").pop() || "txt";

    // Insert attachment
    const [newAttachment] = await db
      .insert(RequestAttachment)
      .values({
        requestId,
        uploadedById: activeUser.id,
        fileName: fileName.trim(),
        fileUrl: fileUrl.trim(),
        mimeType: mime,
        fileSize: Number(fileSize),
      })
      .returning();

    // Log Activity
    await db.insert(RequestActivity).values({
      requestId,
      actorId: activeUser.id,
      type: ActivityType.ATTACHMENT_ADDED,
      message: `Attached file: ${fileName.trim()}`,
      newValue: fileUrl.trim(),
      oldValue: fileName.trim(),
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

    const assignment = await db.query.RequestAssignment.findFirst({
      where: and(
        eq(RequestAssignment.requestId, requestId),
        eq(RequestAssignment.userId, userId),
      ),
      with: {
        user: { columns: { fullName: true } },
      },
    });

    if (!assignment) {
      return { success: false, message: "Assignment not found." };
    }

    const request = await db.query.Request.findFirst({
      where: eq(Request.id, requestId),
      with: { createdBy: true, department: true },
    });
    if (!request) return { success: false, message: "Request not found." };

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN");
    const hasRoutingRight = rights.includes("MANAGE_ROUTING");
    const managedDeptIds = await getHodDepartmentIds(activeUser);
    const isDeptManager = isHodForRequest(activeUser, managedDeptIds, request);

    if (!isAdmin && !hasRoutingRight && !isDeptManager) {
      return {
        success: false,
        message:
          "Access Denied. You do not have permissions to modify assignments for this request.",
      };
    }

    await db
      .delete(RequestAssignment)
      .where(
        and(
          eq(RequestAssignment.requestId, requestId),
          eq(RequestAssignment.userId, userId),
        ),
      );

    // Log Unassignment Activity
    await db.insert(RequestActivity).values({
      requestId,
      actorId: activeUser.id,
      type: ActivityType.FORWARDED,
      oldValue: assignment.user?.fullName || "staff",
      message: `Removed ${assignment.user?.fullName || "staff"} from assigned handlers.`,
    });

    return {
      success: true,
      message: `Removed ${assignment.user?.fullName || "staff"} from assigned handlers.`,
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

    const request = await db.query.Request.findFirst({
      where: eq(Request.id, requestId),
      with: {
        assignments: true,
        watchers: true,
        createdBy: true,
        department: true,
      },
    });
    if (!request) return { success: false, message: "Request not found." };

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN");
    const hasRoutingRight = rights.includes("MANAGE_ROUTING");
    const isAssigned = request.assignments.some((a: any) => a.userId === activeUser.id);
    const managedDeptIds = await getHodDepartmentIds(activeUser);
    const isDeptManager = isHodForRequest(activeUser, managedDeptIds, request);

    if (!isAdmin && !hasRoutingRight && !isDeptManager && !isAssigned) {
      return {
        success: false,
        message: "Access Denied. You do not have permission to add watchers to this request.",
      };
    }

    const existing = request.watchers.find((w: any) => w.userId === userId);
    if (existing) {
      return {
        success: false,
        message: "User is already watching this request.",
      };
    }

    const staff = await db.query.User.findFirst({
      where: eq(User.id, userId),
      columns: { fullName: true },
    });
    if (!staff) {
      return { success: false, message: "Staff user not found." };
    }

    await db.insert(RequestWatcher).values({
      requestId,
      userId,
      addedById: activeUser.id,
    });

    // Log Activity
    await db.insert(RequestActivity).values({
      requestId,
      actorId: activeUser.id,
      type: ActivityType.COMMENTED,
      message: `Added ${staff.fullName} as a watcher.`,
    });

    return { success: true, message: `Added ${staff.fullName} as a watcher.` };
  } catch (error: any) {
    console.error("Error adding watcher:", error);
    return { success: false, message: "Failed to add watcher." };
  }
}

/**
 * Remove a watcher from a request.
 * Watchers can always remove themselves without requiring admin privileges!
 */
export async function removeRequestWatcher(requestId: string, userId: string) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) return { success: false, message: "Not authenticated." };

    const watcher = await db.query.RequestWatcher.findFirst({
      where: and(
        eq(RequestWatcher.requestId, requestId),
        eq(RequestWatcher.userId, userId),
      ),
      with: {
        user: { columns: { fullName: true } },
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
      const req = await db.query.Request.findFirst({
        where: eq(Request.id, requestId),
        with: { createdBy: true, department: true },
      });
      const managedDeptIds = await getHodDepartmentIds(activeUser);
      const isDeptManager = req ? isHodForRequest(activeUser, managedDeptIds, req) : false;

      if (!isDeptManager) {
        return {
          success: false,
          message: "Access Denied. You do not have permission to remove this watcher.",
        };
      }
    }

    await db
      .delete(RequestWatcher)
      .where(
        and(
          eq(RequestWatcher.requestId, requestId),
          eq(RequestWatcher.userId, userId),
        ),
      );

    const activityMsg = isSelf
      ? `${watcher.user?.fullName || "User"} stopped watching this ticket.`
      : `Removed ${watcher.user?.fullName || "User"} from watchers list.`;

    // Log Activity
    await db.insert(RequestActivity).values({
      requestId,
      actorId: activeUser.id,
      type: ActivityType.COMMENTED,
      message: activityMsg,
    });

    return {
      success: true,
      message: isSelf
        ? "You have stopped watching this request."
        : `Removed ${watcher.user?.fullName || "User"} from watchers list.`,
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

    const request = await db.query.Request.findFirst({
      where: eq(Request.id, requestId),
      with: {
        category: true,
        department: true,
        createdBy: true,
      },
    });
    if (!request) return { success: false, message: "Request not found." };

    const rights = activeUser.rights || [];
    const isAdmin = rights.includes("ADMIN");
    const managedDeptIds = await getHodDepartmentIds(activeUser);
    const isDeptManager = isHodForRequest(activeUser, managedDeptIds, request);

    if (!isAdmin && !isDeptManager) {
      return {
        success: false,
        message:
          "Access Denied. Only Admins or Department Managers can change request category/department.",
      };
    }

    // Log Activity and Update
    let oldTargetName = "";
    let newTargetName = "";

    if (targetType === "CATEGORY") {
      const newCat = await db.query.Category.findFirst({
        where: eq(Category.id, targetId),
      });
      if (!newCat)
        return { success: false, message: "Selected category not found." };

      oldTargetName = request.category
        ? request.category.name
        : request.department
          ? `Dept: ${request.department.name}`
          : "General";
      newTargetName = newCat.name;

      await db
        .update(Request)
        .set({
          categoryId: targetId,
          departmentId: null,
        })
        .where(eq(Request.id, requestId));
    } else {
      const newDept = await db.query.Department.findFirst({
        where: eq(Department.id, targetId),
      });
      if (!newDept)
        return { success: false, message: "Selected department not found." };

      oldTargetName = request.category
        ? request.category.name
        : request.department
          ? `Dept: ${request.department.name}`
          : "General";
      newTargetName = `Dept: ${newDept.name}`;

      await db
        .update(Request)
        .set({
          categoryId: null,
          departmentId: targetId,
        })
        .where(eq(Request.id, requestId));
    }

    // Log re-assignment activity
    await db.insert(RequestActivity).values({
      requestId,
      actorId: activeUser.id,
      type: ActivityType.STATUS_CHANGED,
      oldValue: oldTargetName,
      newValue: newTargetName,
      message: `Request target updated from ${oldTargetName} to ${newTargetName} by ${activeUser.fullName}.`,
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
 * Forward request from currently assigned faculty member to another staff member.
 * Active handler (and other assignees) are converted to watchers.
 */
export async function forwardRequest(
  requestId: string,
  targetUserId: string,
  message?: string,
) {
  try {
    const activeUser = await getAuthenticatedUser();
    if (!activeUser) return { success: false, message: "Not authenticated." };

    const request = await db.query.Request.findFirst({
      where: eq(Request.id, requestId),
      with: {
        assignments: {
          with: {
            user: { columns: { id: true, fullName: true, role: true } },
          },
        },
        watchers: true,
      },
    });

    if (!request) return { success: false, message: "Request not found." };

    // Verify active user is assigned
    const activeUserAssignment = request.assignments.find(
      (a: any) => a.userId === activeUser.id,
    );
    if (!activeUserAssignment) {
      return {
        success: false,
        message:
          "Access Denied. Only assigned handlers can forward this request.",
      };
    }

    // Verify target user is staff
    const targetUser = await db.query.User.findFirst({
      where: eq(User.id, targetUserId),
    });
    if (!targetUser || (targetUser.role === "STUDENT" && targetUser.rights.length === 0)) {
      return {
        success: false,
        message: "Cannot forward: Target user is not a valid staff member.",
      };
    }

    // Current assignees other than target user to be converted to watchers
    const assigneesToConvert = request.assignments.filter((a: any) => a.userId !== targetUserId);
    const existingWatcherUserIds = new Set(request.watchers.map((w: any) => w.userId));

    await db.transaction(async (tx) => {
      // 1. Remove all current assignees from assignments
      if (assigneesToConvert.length > 0) {
        const convertIds = assigneesToConvert.map((a: any) => a.userId);
        await tx
          .delete(RequestAssignment)
          .where(
            and(
              eq(RequestAssignment.requestId, requestId),
              inArray(RequestAssignment.userId, convertIds),
            ),
          );

        // 2. Convert them to watchers
        const watchersToCreate = assigneesToConvert
          .filter((a: any) => !existingWatcherUserIds.has(a.userId))
          .map((a: any) => ({
            requestId,
            userId: a.userId,
            addedById: activeUser.id,
          }));

        if (watchersToCreate.length > 0) {
          await tx.insert(RequestWatcher).values(watchersToCreate);
        }
      }

      // 3. Remove target user from watchers if they were watching
      await tx
        .delete(RequestWatcher)
        .where(
          and(
            eq(RequestWatcher.requestId, requestId),
            eq(RequestWatcher.userId, targetUserId),
          ),
        );

      // 4. Add target user as assignee
      const existingTargetAssign = request.assignments.find((a: any) => a.userId === targetUserId);
      if (!existingTargetAssign) {
        await tx.insert(RequestAssignment).values({
          requestId,
          userId: targetUserId,
          assignedById: activeUser.id,
          role: "PRIMARY",
          status: "PENDING",
        });
      } else {
        await tx
          .update(RequestAssignment)
          .set({ role: "PRIMARY", status: "PENDING" })
          .where(
            and(
              eq(RequestAssignment.requestId, requestId),
              eq(RequestAssignment.userId, targetUserId),
            ),
          );
      }
    });

    // 5. Log Forward Activity
    await db.insert(RequestActivity).values({
      requestId,
      actorId: activeUser.id,
      type: ActivityType.FORWARDED,
      oldValue: activeUser.fullName,
      newValue: targetUser.fullName,
      message:
        message ||
        `Request forwarded from ${activeUser.fullName} to ${targetUser.fullName}. Active handler converted to watcher.`,
    });

    return {
      success: true,
      message: `Request forwarded to ${targetUser.fullName} successfully! You are now watching this request.`,
    };
  } catch (error: any) {
    console.error("Error forwarding request:", error);
    return { success: false, message: "Database error during forward." };
  }
}
