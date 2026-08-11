"use server";

import prisma from "../prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth/auth";
import {
  RequestType,
  Priority,
  RequestStatus,
  ActivityType,
  Role,
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
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return {
        success: false,
        message: "Not authenticated. Session token missing.",
      };
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return { success: false, message: "Invalid or expired session token." };
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
        return { success: false, message: "Selected department does not exist." };
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
          createdById: payload.userId,
          status: RequestStatus.SUBMITTED,
          categoryId: data.raiseMode === "CATEGORY" ? data.categoryId : null,
          departmentId: data.raiseMode === "DEPARTMENT" ? data.departmentId : null,
        },
      });

      // 6. Automatically resolve assignments
      const assignedIds = new Set<string>();

      if (data.raiseMode === "CATEGORY" && data.categoryId) {
        // Look up active RoutingRules for this category
        const rules = await tx.routingRule.findMany({
          where: {
            categoryId: data.categoryId,
            isActive: true
          }
        });
        rules.forEach(r => assignedIds.add(r.userId));
      } else if (data.raiseMode === "DEPARTMENT" && data.departmentId) {
        // Raise by Department
        if (data.assignedUserIds && data.assignedUserIds.length > 0) {
          data.assignedUserIds.forEach(id => assignedIds.add(id));
        } else {
          // If no specific users are chosen, auto-assign to the HOD of that department
          const dept = await tx.department.findUnique({
            where: { id: data.departmentId },
            select: { hodId: true }
          });
          if (dept?.hodId) {
            assignedIds.add(dept.hodId);
          }
        }
      }

      // Create RequestAssignment records
      if (assignedIds.size > 0) {
        await tx.requestAssignment.createMany({
          data: Array.from(assignedIds).map(userId => ({
            requestId: req.id,
            userId: userId,
            assignedById: payload.userId,
            role: "PRIMARY",
            status: "PENDING"
          }))
        });
      }

      // Create RequestWatcher records
      if (data.watcherUserIds && data.watcherUserIds.length > 0) {
        await tx.requestWatcher.createMany({
          data: data.watcherUserIds.map(userId => ({
            requestId: req.id,
            userId: userId,
            addedById: payload.userId
          }))
        });
      }

      // Log initial activity
      const assignedUserNames = assignedIds.size > 0 
        ? "Auto-assigned on creation."
        : "Unassigned initially.";

      await tx.requestActivity.create({
        data: {
          requestId: req.id,
          actorId: payload.userId,
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
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return {
        success: false,
        message: "Not authenticated. Session token missing.",
      };
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return { success: false, message: "Invalid session." };
    }

    const requests = await prisma.request.findMany({
      where: { createdById: payload.userId },
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
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return { success: false, message: "Not authenticated." };
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return { success: false, message: "Invalid session." };
    }

    // Check user role
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) {
      return { success: false, message: "User session not found." };
    }

    let whereClause: any = {};

    if (user.role === Role.STUDENT) {
      // Students can only see their own requests
      whereClause = { createdById: user.id };
    } else if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
      // Admins see all requests
      whereClause = {};
    } else if (user.role === Role.HOD) {
      // HODs see requests related to their department, requests made by students of their department,
      // or requests where they are explicitly assigned, watching, or created.
      const departmentId = user.departmentId;
      
      const hodOrConditions: any[] = [
        { assignments: { some: { userId: user.id } } },
        { watchers: { some: { userId: user.id } } },
        { createdById: user.id }
      ];

      if (departmentId) {
        hodOrConditions.push(
          { departmentId: departmentId },
          { department: { hodId: user.id } },
          {
            createdBy: {
              role: Role.STUDENT,
              departmentId: departmentId
            }
          }
        );
      } else {
        hodOrConditions.push(
          { department: { hodId: user.id } },
          {
            createdBy: {
              role: Role.STUDENT,
              department: { hodId: user.id }
            }
          }
        );
      }

      whereClause = {
        OR: hodOrConditions
      };
    } else {
      // Other staff (FACULTY, etc.) see only requests where they are assigned, watching, or created
      whereClause = {
        OR: [
          { assignments: { some: { userId: user.id } } },
          { watchers: { some: { userId: user.id } } },
          { createdById: user.id }
        ]
      };
    }

    const requests = await prisma.request.findMany({
      where: whereClause,
      include: {
        category: true,
        department: true,
        createdBy: { select: { fullName: true } },
        assignments: {
          include: {
            user: { select: { fullName: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      role: user.role,
      requests: requests.map((r) => {
        const assignedNames = r.assignments
          .map(a => a.user.fullName)
          .join(", ");

        return {
          id: r.id,
          ticketId: r.ticketId,
          subject: r.subject,
          type: r.type,
          priority: r.priority,
          status: r.status,
          category: r.category ? r.category.name : (r.department ? `Dept: ${r.department.name}` : "General"),
          createdByName:
            r.isAnonymous && user.role === Role.STUDENT
              ? "Anonymous"
              : r.createdBy.fullName,
          assignedToName: assignedNames || "Unassigned",
          date: r.createdAt.toISOString(),
        };
      }),
    };
  } catch (error: any) {
    console.error("Error retrieving all requests:", error);
    return { success: false, message: "Database query error." };
  }
}

/**
 * Fetch detailed request data including comments, activities and files
 */
export async function getRequestDetails(requestId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return { success: false, message: "Not authenticated." };
    }

    const payload = verifyToken(token);
    if (!payload || !payload.userId) {
      return { success: false, message: "Invalid session." };
    }

    const activeUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!activeUser) {
      return { success: false, message: "Active user session not found." };
    }

    const reqDetails = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        category: true,
        department: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mobileNumber: true,
            role: true,
            course: { select: { name: true } },
            departmentId: true,
          },
        },
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                designation: true
              }
            }
          }
        },
        watchers: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true
              }
            }
          }
        },
        comments: {
          include: {
            author: { select: { fullName: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        activities: {
          include: {
            actor: { select: { fullName: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        attachments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!reqDetails) {
      return { success: false, message: "Request ticket not found." };
    }

    // Security Gate check based on roles
    let hasAccess = false;
    if (activeUser.role === Role.ADMIN || activeUser.role === Role.SUPER_ADMIN) {
      hasAccess = true;
    } else if (activeUser.role === Role.STUDENT) {
      hasAccess = reqDetails.createdById === activeUser.id;
    } else if (activeUser.role === Role.HOD) {
      const isCreator = reqDetails.createdById === activeUser.id;
      const isAssigned = reqDetails.assignments.some(a => a.user.id === activeUser.id);
      const isWatcher = reqDetails.watchers.some(w => w.user.id === activeUser.id);
      
      const isRelatedDept = reqDetails.departmentId === activeUser.departmentId ||
                            reqDetails.department?.hodId === activeUser.id;

      const isStudentOfDept = reqDetails.createdBy.role === Role.STUDENT &&
                              reqDetails.createdBy.departmentId === activeUser.departmentId;

      hasAccess = isCreator || isAssigned || isWatcher || isRelatedDept || isStudentOfDept;
    } else {
      // FACULTY and other roles
      const isCreator = reqDetails.createdById === activeUser.id;
      const isAssigned = reqDetails.assignments.some(a => a.user.id === activeUser.id);
      const isWatcher = reqDetails.watchers.some(w => w.user.id === activeUser.id);

      hasAccess = isCreator || isAssigned || isWatcher;
    }

    if (!hasAccess) {
      return {
        success: false,
        message: "Access Denied. You do not have permissions to view this ticket.",
      };
    }

    // Filter out internal comments from students
    let comments = reqDetails.comments;
    if (activeUser.role === Role.STUDENT) {
      comments = comments.filter((c) => !c.internal);
    }

    const mappedDetails = {
      id: reqDetails.id,
      ticketId: reqDetails.ticketId,
      subject: reqDetails.subject,
      description: reqDetails.description,
      type: reqDetails.type,
      priority: reqDetails.priority,
      status: reqDetails.status,
      categoryName: reqDetails.category ? reqDetails.category.name : (reqDetails.department ? `Dept: ${reqDetails.department.name}` : "General"),
      categoryId: reqDetails.categoryId,
      departmentId: reqDetails.departmentId,
      departmentName: reqDetails.department?.name || "",
      departmentHodId: reqDetails.department?.hodId || "",
      isAnonymous: reqDetails.isAnonymous,
      createdAt: reqDetails.createdAt.toISOString(),
      creator: {
        id: reqDetails.createdBy.id,
        name:
          reqDetails.isAnonymous && activeUser.role === Role.STUDENT
            ? "Anonymous"
            : reqDetails.createdBy.fullName,
        email:
          reqDetails.isAnonymous && activeUser.role === Role.STUDENT
            ? "N/A"
            : reqDetails.createdBy.email,
        mobileNumber:
          reqDetails.isAnonymous && activeUser.role === Role.STUDENT
            ? "N/A"
            : reqDetails.createdBy.mobileNumber || "N/A",
        courseName: reqDetails.createdBy.course?.name || "N/A",
        departmentId: reqDetails.createdBy.departmentId || "",
      },
      assignments: reqDetails.assignments.map(a => ({
        id: a.id,
        role: a.role,
        status: a.status,
        user: {
          id: a.user.id,
          name: a.user.fullName,
          email: a.user.email,
          role: a.user.role,
          designation: a.user.designation || ""
        }
      })),
      watchers: reqDetails.watchers.map(w => ({
        user: {
          id: w.user.id,
          name: w.user.fullName,
          email: w.user.email,
          role: w.user.role
        }
      })),
      comments: comments.map((c) => ({
        id: c.id,
        message: c.message,
        internal: c.internal,
        createdAt: c.createdAt.toISOString(),
        authorName: c.author.fullName,
        authorRole: c.author.role,
      })),
      activities: reqDetails.activities.map((a) => ({
        id: a.id,
        type: a.type,
        oldValue: a.oldValue,
        newValue: a.newValue,
        message: a.message,
        createdAt: a.createdAt.toISOString(),
        actorName: a.actor?.fullName || "System",
      })),
      attachments: reqDetails.attachments.map((at) => ({
        id: at.id,
        fileName: at.fileName,
        fileUrl: at.fileUrl,
        fileSize: at.fileSize,
        mimeType: at.mimeType,
        createdAt: at.createdAt.toISOString(),
      })),
    };

    return { 
      success: true, 
      request: mappedDetails, 
      userRole: activeUser.role,
      userRights: activeUser.rights,
      userId: activeUser.id,
      userDeptId: activeUser.departmentId || ""
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
 * Update request status & log activity
 */
export async function updateRequestStatus(
  requestId: string,
  newStatus: string,
  commentMessage?: string,
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, message: "Not authenticated." };

    const payload = verifyToken(token);
    if (!payload || !payload.userId)
      return { success: false, message: "Invalid session." };

    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });
    if (!request)
      return { success: false, message: "Request ticket not found." };

    // Map status string to RequestStatus enum
    let statusEnum = newStatus.toUpperCase() as RequestStatus;

    // Update status
    const updatedRequest = await prisma.request.update({
      where: { id: requestId },
      data: { status: statusEnum },
    });

    // Log status activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: payload.userId,
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
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, message: "Not authenticated." };

    const payload = verifyToken(token);
    if (!payload || !payload.userId)
      return { success: false, message: "Invalid session." };

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { assignments: true, createdBy: true }
    });
    if (!request) return { success: false, message: "Request not found." };

    // Fetch active user details
    const activeUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!activeUser) return { success: false, message: "User session not found." };

    // Authorization checks
    const role = activeUser.role;
    const rights = activeUser.rights || [];
    const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
    const hasRoutingRight = rights.includes("MANAGE_ROUTING");

    let isHodOfDept = false;
    if (role === Role.HOD) {
      const isRequestDeptHod = request.departmentId === activeUser.departmentId;
      const isStudentDeptHod = request.createdBy.role === Role.STUDENT && request.createdBy.departmentId === activeUser.departmentId;
      
      let isExplicitHod = false;
      if (request.departmentId) {
        const dept = await prisma.department.findUnique({
          where: { id: request.departmentId },
          select: { hodId: true }
        });
        if (dept?.hodId === activeUser.id) {
          isExplicitHod = true;
        }
      }

      if (isRequestDeptHod || isStudentDeptHod || isExplicitHod) {
        isHodOfDept = true;
      }
    }

    if (!isAdmin && !hasRoutingRight && !isHodOfDept) {
      return {
        success: false,
        message: "Access Denied. You do not have permissions to manually assign handlers for this request.",
      };
    }

    // Fetch details of assigned staff member
    const staff = await prisma.user.findUnique({
      where: { id: assignedToId },
    });
    if (!staff || staff.role === Role.STUDENT) {
      return {
        success: false,
        message: "Cannot assign: Assigned user is not a valid staff member.",
      };
    }

    // Check if duplicate assignment exists
    const existing = request.assignments.find(a => a.userId === assignedToId);
    if (existing) {
      return { success: false, message: `${staff.fullName} is already assigned to this request.` };
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
          assignedById: payload.userId,
          role: "PRIMARY",
          status: "PENDING"
        }
      });

      // Update request status
      if (nextStatus !== request.status) {
        await tx.request.update({
          where: { id: requestId },
          data: { status: nextStatus }
        });
      }
    });

    // Log Assignment Activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: payload.userId,
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
          actorId: payload.userId,
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
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, message: "Not authenticated." };

    const payload = verifyToken(token);
    if (!payload || !payload.userId)
      return { success: false, message: "Invalid session." };

    if (!message.trim()) {
      return { success: false, message: "Comment message cannot be empty." };
    }

    // Insert comment
    const newComment = await prisma.requestComment.create({
      data: {
        requestId,
        authorId: payload.userId,
        message: message.trim(),
        internal,
      },
    });

    // Log activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: payload.userId,
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
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, message: "Not authenticated." };

    const payload = verifyToken(token);
    if (!payload || !payload.userId)
      return { success: false, message: "Invalid session." };

    if (!fileName.trim() || !fileUrl.trim()) {
      return { success: false, message: "File name and URL are required." };
    }

    const mime = fileName.split(".").pop() || "txt";

    // Insert attachment
    const newAttachment = await prisma.requestAttachment.create({
      data: {
        requestId,
        uploadedById: payload.userId,
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
        actorId: payload.userId,
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
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, message: "Not authenticated." };

    const payload = verifyToken(token);
    if (!payload || !payload.userId)
      return { success: false, message: "Invalid session." };

    const assignment = await prisma.requestAssignment.findUnique({
      where: {
        requestId_userId: {
          requestId,
          userId
        }
      },
      include: {
        user: { select: { fullName: true } }
      }
    });

    if (!assignment) {
      return { success: false, message: "Assignment not found." };
    }

    // Fetch active user details
    const activeUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!activeUser) return { success: false, message: "User session not found." };

    // Authorization checks
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { createdBy: true }
    });
    if (!request) return { success: false, message: "Request not found." };

    const role = activeUser.role;
    const rights = activeUser.rights || [];
    const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
    const hasRoutingRight = rights.includes("MANAGE_ROUTING");

    let isHodOfDept = false;
    if (role === Role.HOD) {
      const isRequestDeptHod = request.departmentId === activeUser.departmentId;
      const isStudentDeptHod = request.createdBy.role === Role.STUDENT && request.createdBy.departmentId === activeUser.departmentId;
      
      let isExplicitHod = false;
      if (request.departmentId) {
        const dept = await prisma.department.findUnique({
          where: { id: request.departmentId },
          select: { hodId: true }
        });
        if (dept?.hodId === activeUser.id) {
          isExplicitHod = true;
        }
      }

      if (isRequestDeptHod || isStudentDeptHod || isExplicitHod) {
        isHodOfDept = true;
      }
    }

    if (!isAdmin && !hasRoutingRight && !isHodOfDept) {
      return {
        success: false,
        message: "Access Denied. You do not have permissions to modify assignments for this request.",
      };
    }

    await prisma.requestAssignment.delete({
      where: {
        requestId_userId: {
          requestId,
          userId
        }
      }
    });

    // Log Unassignment Activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: payload.userId,
        type: ActivityType.FORWARDED,
        oldValue: assignment.user.fullName,
        message: `Removed ${assignment.user.fullName} from assigned handlers.`,
      },
    });

    return { success: true, message: `Removed ${assignment.user.fullName} from assigned handlers.` };
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
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, message: "Not authenticated." };

    const payload = verifyToken(token);
    if (!payload || !payload.userId)
      return { success: false, message: "Invalid session." };

    const existing = await prisma.requestWatcher.findUnique({
      where: {
        requestId_userId: {
          requestId,
          userId
        }
      }
    });

    if (existing) {
      return { success: false, message: "User is already watching this request." };
    }

    const staff = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true }
    });

    if (!staff) {
      return { success: false, message: "Staff user not found." };
    }

    await prisma.requestWatcher.create({
      data: {
        requestId,
        userId,
        addedById: payload.userId
      }
    });

    // Log Activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: payload.userId,
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
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, message: "Not authenticated." };

    const payload = verifyToken(token);
    if (!payload || !payload.userId)
      return { success: false, message: "Invalid session." };

    const watcher = await prisma.requestWatcher.findUnique({
      where: {
        requestId_userId: {
          requestId,
          userId
        }
      },
      include: {
        user: { select: { fullName: true } }
      }
    });

    if (!watcher) {
      return { success: false, message: "Watcher not found." };
    }

    await prisma.requestWatcher.delete({
      where: {
        requestId_userId: {
          requestId,
          userId
        }
      }
    });

    // Log Activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: payload.userId,
        type: ActivityType.COMMENTED,
        message: `Removed ${watcher.user.fullName} from watchers list.`,
      },
    });

    return { success: true, message: `Removed ${watcher.user.fullName} from watchers list.` };
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
  targetId: string
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, message: "Not authenticated." };

    const payload = verifyToken(token);
    if (!payload || !payload.userId)
      return { success: false, message: "Invalid session." };

    const activeUser = await prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!activeUser) return { success: false, message: "User not found." };

    // Authorization Gate: admin or HOD
    const isAdmin = activeUser.role === Role.ADMIN || activeUser.role === Role.SUPER_ADMIN;
    const isHod = activeUser.role === Role.HOD;

    if (!isAdmin && !isHod) {
      return { success: false, message: "Access Denied. Only Admins or HODs can change request category/department." };
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { category: true, department: true }
    });
    if (!request) return { success: false, message: "Request not found." };

    // Log Activity and Update
    let oldTargetName = "";
    let newTargetName = "";

    if (targetType === "CATEGORY") {
      const newCat = await prisma.category.findUnique({ where: { id: targetId } });
      if (!newCat) return { success: false, message: "Selected category not found." };
      
      oldTargetName = request.category ? request.category.name : (request.department ? `Dept: ${request.department.name}` : "General");
      newTargetName = newCat.name;

      await prisma.request.update({
        where: { id: requestId },
        data: {
          categoryId: targetId,
          departmentId: null
        }
      });
    } else {
      const newDept = await prisma.department.findUnique({ where: { id: targetId } });
      if (!newDept) return { success: false, message: "Selected department not found." };

      oldTargetName = request.category ? request.category.name : (request.department ? `Dept: ${request.department.name}` : "General");
      newTargetName = `Dept: ${newDept.name}`;

      await prisma.request.update({
        where: { id: requestId },
        data: {
          categoryId: null,
          departmentId: targetId
        }
      });
    }

    // Log re-assignment activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: payload.userId,
        type: ActivityType.STATUS_CHANGED,
        oldValue: oldTargetName,
        newValue: newTargetName,
        message: `Request target updated from ${oldTargetName} to ${newTargetName} by ${activeUser.fullName}.`,
      },
    });

    return { success: true, message: `Successfully updated request target to ${newTargetName}!` };
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
  message?: string
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return { success: false, message: "Not authenticated." };

    const payload = verifyToken(token);
    if (!payload || !payload.userId)
      return { success: false, message: "Invalid session." };

    const activeUserId = payload.userId;

    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        assignments: true,
        watchers: true,
      }
    });

    if (!request) return { success: false, message: "Request not found." };

    // Verify active user is assigned
    const activeUserAssignment = request.assignments.find(a => a.userId === activeUserId);
    if (!activeUserAssignment) {
      return {
        success: false,
        message: "Access Denied. Only assigned handlers can forward this request.",
      };
    }

    // Verify target user is staff
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser || targetUser.role === Role.STUDENT) {
      return {
        success: false,
        message: "Cannot forward: Target user is not a valid staff member.",
      };
    }

    // Verify duplicate assignment
    const existing = request.assignments.find(a => a.userId === targetUserId);
    if (existing) {
      return {
        success: false,
        message: `${targetUser.fullName} is already assigned to this request.`,
      };
    }

    const activeUser = await prisma.user.findUnique({
      where: { id: activeUserId },
    });
    if (!activeUser) return { success: false, message: "Active user session not found." };

    await prisma.$transaction(async (tx) => {
      // 1. Remove active user from assignees
      await tx.requestAssignment.delete({
        where: {
          requestId_userId: {
            requestId,
            userId: activeUserId,
          }
        }
      });

      // 2. Add active user as watcher (if not already watching)
      const isAlreadyWatcher = request.watchers.some(w => w.userId === activeUserId);
      if (!isAlreadyWatcher) {
        await tx.requestWatcher.create({
          data: {
            requestId,
            userId: activeUserId,
            addedById: activeUserId
          }
        });
      }

      // 3. Add target user as assignee
      await tx.requestAssignment.create({
        data: {
          requestId,
          userId: targetUserId,
          assignedById: activeUserId,
          role: "PRIMARY",
          status: "PENDING"
        }
      });
    });

    // 4. Log Forward Activity
    await prisma.requestActivity.create({
      data: {
        requestId,
        actorId: activeUserId,
        type: ActivityType.FORWARDED,
        oldValue: activeUser.fullName,
        newValue: targetUser.fullName,
        message: message || `Request forwarded from ${activeUser.fullName} to ${targetUser.fullName}.`,
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

