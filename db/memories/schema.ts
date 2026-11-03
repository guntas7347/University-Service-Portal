import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ==========================================
// ENUMS (8)
// ==========================================

export const Gender = pgEnum("Gender", [
  "MALE",
  "FEMALE",
  "OTHER",
  "PREFER_NOT_TO_SAY",
]);

export const UserStatus = pgEnum("UserStatus", [
  "PENDING",
  "ACTIVE",
  "SUSPENDED",
  "DELETED",
]);

export const RequestType = pgEnum("RequestType", [
  "COMPLAINT",
  "GRIEVANCE",
  "SERVICE_REQUEST",
  "INQUIRY",
  "SUGGESTION",
  "APPEAL",
]);

export const RequestStatus = pgEnum("RequestStatus", [
  "DRAFT",
  "SUBMITTED",
  "ASSIGNED",
  "UNDER_REVIEW",
  "WAITING_FOR_STUDENT",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
  "CLOSED",
  "CANCELLED",
]);

export const Priority = pgEnum("Priority", ["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const ActivityType = pgEnum("ActivityType", [
  "CREATED",
  "ASSIGNED",
  "FORWARDED",
  "STATUS_CHANGED",
  "COMMENTED",
  "ATTACHMENT_ADDED",
  "RESOLVED",
  "CLOSED",
  "REOPENED",
  "ESCALATED",
]);

export const AssignmentRole = pgEnum("AssignmentRole", [
  "PRIMARY",
  "SECONDARY",
]);

export const AssignmentStatus = pgEnum("AssignmentStatus", [
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "DECLINED",
]);

// ==========================================
// TABLES (11)
// ==========================================

export const User = pgTable("User", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  ssoId: text("ssoId").unique(),
  fullName: text("fullName").notNull(),
  email: text("email").notNull().unique(),
  rollNumber: text("rollNumber").unique(),
  mobile: text("mobile").unique(),
  batch: integer("batch"),
  dateOfBirth: timestamp("dateOfBirth", { precision: 3 }),
  gender: Gender("gender"),
  role: text("role").notNull().default("STUDENT"),
  status: UserStatus("status").notNull().default("PENDING"),
  designation: text("designation"),
  rights: text("rights").array().notNull().default([]),
  departmentId: text("departmentId").references(
    (): AnyPgColumn => Department.id,
    {
      onDelete: "cascade",
      onUpdate: "cascade",
    },
  ),
  courseId: text("courseId").references(() => Course.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  emailVerified: boolean("emailVerified").notNull().default(false),
  phoneVerified: boolean("phoneVerified").notNull().default(false),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const Department = pgTable("Department", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  hodId: text("hodId")
    .unique()
    .references((): AnyPgColumn => User.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  specializations: text("specializations").array().notNull().default([]),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const Course = pgTable("Course", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  duration: integer("duration"),
  departmentId: text("departmentId").references(() => Department.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const Category = pgTable("Category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const Request = pgTable("Request", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  ticketId: text("ticketId").notNull().unique(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  type: RequestType("type").notNull(),
  priority: Priority("priority").notNull(),
  status: RequestStatus("status").notNull(),
  createdById: text("createdById")
    .notNull()
    .references(() => User.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  isAnonymous: boolean("isAnonymous").notNull().default(false),
  escalationLevel: integer("escalationLevel").notNull().default(0),
  lastEscalatedAt: timestamp("lastEscalatedAt", { precision: 3 }),
  isEscalated: boolean("isEscalated").notNull().default(false),
  tags: text("tags").array().notNull().default([]),
  categoryId: text("categoryId").references(() => Category.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  departmentId: text("departmentId").references(() => Department.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const RequestActivity = pgTable(
  "RequestActivity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    requestId: text("requestId")
      .notNull()
      .references(() => Request.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    actorId: text("actorId").references(() => User.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    type: ActivityType("type").notNull(),
    oldValue: text("oldValue"),
    newValue: text("newValue"),
    message: text("message"),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  },
  (t) => [
    index("RequestActivity_requestId_createdAt_idx").on(
      t.requestId,
      t.createdAt,
    ),
  ],
);

export const RequestComment = pgTable(
  "RequestComment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    requestId: text("requestId")
      .notNull()
      .references(() => Request.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    authorId: text("authorId")
      .notNull()
      .references(() => User.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    message: text("message").notNull(),
    internal: boolean("internal").notNull().default(false),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  },
  (t) => [
    index("RequestComment_requestId_createdAt_idx").on(
      t.requestId,
      t.createdAt,
    ),
  ],
);

export const RequestAttachment = pgTable(
  "RequestAttachment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    requestId: text("requestId")
      .notNull()
      .references(() => Request.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    uploadedById: text("uploadedById")
      .notNull()
      .references(() => User.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    fileName: text("fileName").notNull(),
    fileUrl: text("fileUrl").notNull(),
    mimeType: text("mimeType").notNull(),
    fileSize: integer("fileSize").notNull(),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  },
  (t) => [index("RequestAttachment_requestId_idx").on(t.requestId)],
);

export const RoutingRule = pgTable(
  "RoutingRule",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    categoryId: text("categoryId").references(() => Category.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    userId: text("userId")
      .notNull()
      .references(() => User.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    level: integer("level").notNull().default(1),
    isCentral: boolean("isCentral").notNull().default(false),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { precision: 3 })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("RoutingRule_categoryId_idx").on(t.categoryId),
    index("RoutingRule_userId_idx").on(t.userId),
    index("RoutingRule_level_idx").on(t.level),
  ],
);

export const RequestAssignment = pgTable(
  "RequestAssignment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    requestId: text("requestId")
      .notNull()
      .references(() => Request.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("userId")
      .notNull()
      .references(() => User.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    assignedById: text("assignedById").references(() => User.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    role: AssignmentRole("role").notNull().default("PRIMARY"),
    status: AssignmentStatus("status").notNull().default("PENDING"),
    assignedAt: timestamp("assignedAt", { precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("RequestAssignment_requestId_userId_key").on(
      t.requestId,
      t.userId,
    ),
    index("RequestAssignment_requestId_idx").on(t.requestId),
    index("RequestAssignment_userId_idx").on(t.userId),
  ],
);

export const RequestWatcher = pgTable(
  "RequestWatcher",
  {
    requestId: text("requestId")
      .notNull()
      .references(() => Request.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("userId")
      .notNull()
      .references(() => User.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    addedById: text("addedById").references(() => User.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({
      name: "RequestWatcher_cpk",
      columns: [t.requestId, t.userId],
    }),
    index("RequestWatcher_userId_idx").on(t.userId),
  ],
);

// ==========================================
// RELATIONS
// ==========================================

export const UserRelations = relations(User, ({ one, many }) => ({
  department: one(Department, {
    relationName: "DepartmentUsers",
    fields: [User.departmentId],
    references: [Department.id],
  }),
  course: one(Course, {
    fields: [User.courseId],
    references: [Course.id],
  }),
  requests: many(Request, {
    relationName: "CreatedRequests",
  }),
  requestActivities: many(RequestActivity),
  requestComments: many(RequestComment),
  requestAttachments: many(RequestAttachment),
  assignments: many(RequestAssignment, {
    relationName: "AssignedUser",
  }),
  createdAssignments: many(RequestAssignment, {
    relationName: "AssignmentCreator",
  }),
  watchedRequests: many(RequestWatcher, {
    relationName: "WatchedUser",
  }),
  createdWatchers: many(RequestWatcher, {
    relationName: "WatcherCreator",
  }),
  managedDepartment: many(Department, {
    relationName: "DepartmentHOD",
  }),
  routingRules: many(RoutingRule),
}));

export const DepartmentRelations = relations(Department, ({ one, many }) => ({
  hod: one(User, {
    relationName: "DepartmentHOD",
    fields: [Department.hodId],
    references: [User.id],
  }),
  users: many(User, {
    relationName: "DepartmentUsers",
  }),
  courses: many(Course),
  requests: many(Request),
}));

export const CourseRelations = relations(Course, ({ one, many }) => ({
  department: one(Department, {
    fields: [Course.departmentId],
    references: [Department.id],
  }),
  students: many(User),
}));

export const CategoryRelations = relations(Category, ({ many }) => ({
  requests: many(Request),
  routingRules: many(RoutingRule),
}));

export const RequestRelations = relations(Request, ({ one, many }) => ({
  createdBy: one(User, {
    relationName: "CreatedRequests",
    fields: [Request.createdById],
    references: [User.id],
  }),
  activities: many(RequestActivity),
  comments: many(RequestComment),
  attachments: many(RequestAttachment),
  assignments: many(RequestAssignment),
  watchers: many(RequestWatcher),
  category: one(Category, {
    fields: [Request.categoryId],
    references: [Category.id],
  }),
  department: one(Department, {
    fields: [Request.departmentId],
    references: [Department.id],
  }),
}));

export const RequestActivityRelations = relations(
  RequestActivity,
  ({ one }) => ({
    request: one(Request, {
      fields: [RequestActivity.requestId],
      references: [Request.id],
    }),
    actor: one(User, {
      fields: [RequestActivity.actorId],
      references: [User.id],
    }),
  }),
);

export const RequestCommentRelations = relations(RequestComment, ({ one }) => ({
  request: one(Request, {
    fields: [RequestComment.requestId],
    references: [Request.id],
  }),
  author: one(User, {
    fields: [RequestComment.authorId],
    references: [User.id],
  }),
}));

export const RequestAttachmentRelations = relations(
  RequestAttachment,
  ({ one }) => ({
    request: one(Request, {
      fields: [RequestAttachment.requestId],
      references: [Request.id],
    }),
    uploadedBy: one(User, {
      fields: [RequestAttachment.uploadedById],
      references: [User.id],
    }),
  }),
);

export const RoutingRuleRelations = relations(RoutingRule, ({ one }) => ({
  category: one(Category, {
    fields: [RoutingRule.categoryId],
    references: [Category.id],
  }),
  user: one(User, {
    fields: [RoutingRule.userId],
    references: [User.id],
  }),
}));

export const RequestAssignmentRelations = relations(
  RequestAssignment,
  ({ one }) => ({
    request: one(Request, {
      fields: [RequestAssignment.requestId],
      references: [Request.id],
    }),
    user: one(User, {
      relationName: "AssignedUser",
      fields: [RequestAssignment.userId],
      references: [User.id],
    }),
    assignedBy: one(User, {
      relationName: "AssignmentCreator",
      fields: [RequestAssignment.assignedById],
      references: [User.id],
    }),
  }),
);

export const RequestWatcherRelations = relations(RequestWatcher, ({ one }) => ({
  request: one(Request, {
    fields: [RequestWatcher.requestId],
    references: [Request.id],
  }),
  user: one(User, {
    relationName: "WatchedUser",
    fields: [RequestWatcher.userId],
    references: [User.id],
  }),
  addedBy: one(User, {
    relationName: "WatcherCreator",
    fields: [RequestWatcher.addedById],
    references: [User.id],
  }),
}));
