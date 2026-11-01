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
import { Gender, UserStatus } from "./enums";
import { Department } from "./academics";
import { Request } from "./requests";
import {
  RequestActivity,
  RequestComment,
  RequestAttachment,
  RequestAssignment,
  RequestWatcher,
  RoutingRule,
} from "./request-operations";

export const User = pgTable("User", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  ssoId: text("ssoId").unique(),
  username: text("username").unique(),
  fullName: text("fullName"),
  fatherName: text("fatherName"),
  role: text("role").notNull().default("STUDENT"),
  email: text("email").notNull().unique(),
  degree: text("degree"),
  specialization: text("specialization"),
  mobile: text("mobile"),
  photo: text("photo"),
  rollNumber: text("rollNumber").unique(),
  mobileNumber: text("mobileNumber"),
  batch: integer("batch"),
  dateOfBirth: timestamp("dateOfBirth", { precision: 3 }),
  gender: Gender("gender"),
  status: UserStatus("status").notNull().default("PENDING"),
  designation: text("designation"),
  rights: text("rights").array().notNull().default([]),
  departmentId: text("departmentId").references((): AnyPgColumn => Department.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  emailVerified: boolean("emailVerified").notNull().default(false),
  phoneVerified: boolean("phoneVerified").notNull().default(false),
  profileImage: text("profileImage"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const UserRelations = relations(User, ({ one, many }) => ({
  department: one(Department, {
    relationName: "DepartmentUsers",
    fields: [User.departmentId],
    references: [Department.id],
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

