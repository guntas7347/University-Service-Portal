import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { ActivityType, AssignmentRole, AssignmentStatus } from "./enums";
import { User } from "./users";
import { Request } from "./requests";
import { Category } from "./academics";

export const RequestActivity = pgTable(
  "RequestActivity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    requestId: text("requestId")
      .notNull()
      .references((): AnyPgColumn => Request.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    actorId: text("actorId").references((): AnyPgColumn => User.id, {
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
    index("RequestActivity_requestId_createdAt_idx").on(t.requestId, t.createdAt),
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
      .references((): AnyPgColumn => Request.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    authorId: text("authorId")
      .notNull()
      .references((): AnyPgColumn => User.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    message: text("message").notNull(),
    internal: boolean("internal").notNull().default(false),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  },
  (t) => [
    index("RequestComment_requestId_createdAt_idx").on(t.requestId, t.createdAt),
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
      .references((): AnyPgColumn => Request.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    uploadedById: text("uploadedById")
      .notNull()
      .references((): AnyPgColumn => User.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    fileName: text("fileName").notNull(),
    fileUrl: text("fileUrl").notNull(),
    mimeType: text("mimeType").notNull(),
    fileSize: integer("fileSize").notNull(),
    createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  },
  (t) => [
    index("RequestAttachment_requestId_idx").on(t.requestId),
  ],
);

export const RoutingRule = pgTable(
  "RoutingRule",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    categoryId: text("categoryId").references((): AnyPgColumn => Category.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    userId: text("userId")
      .notNull()
      .references((): AnyPgColumn => User.id, {
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
      .references((): AnyPgColumn => Request.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("userId")
      .notNull()
      .references((): AnyPgColumn => User.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    assignedById: text("assignedById").references((): AnyPgColumn => User.id, {
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
      .references((): AnyPgColumn => Request.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("userId")
      .notNull()
      .references((): AnyPgColumn => User.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    addedById: text("addedById").references((): AnyPgColumn => User.id, {
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
