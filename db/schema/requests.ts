import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { Priority, RequestStatus, RequestType } from "./enums";
import { User } from "./users";
import { Category, Department } from "./academics";
import {
  RequestActivity,
  RequestComment,
  RequestAttachment,
  RequestAssignment,
  RequestWatcher,
} from "./request-operations";

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
    .references((): AnyPgColumn => User.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  isAnonymous: boolean("isAnonymous").notNull().default(false),
  escalationLevel: integer("escalationLevel").notNull().default(0),
  lastEscalatedAt: timestamp("lastEscalatedAt", { precision: 3 }),
  isEscalated: boolean("isEscalated").notNull().default(false),
  tags: text("tags").array().notNull().default([]),
  categoryId: text("categoryId").references((): AnyPgColumn => Category.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  departmentId: text("departmentId").references((): AnyPgColumn => Department.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

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
