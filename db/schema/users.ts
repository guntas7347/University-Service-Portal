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
import { Department, Course } from "./academics";
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
  fullName: text("fullName").notNull(),
  email: text("email").notNull().unique(),
  rollNumber: text("rollNumber").unique(),
  mobileNumber: text("mobileNumber").unique(),
  batch: integer("batch"),
  dateOfBirth: timestamp("dateOfBirth", { precision: 3 }),
  gender: Gender("gender"),
  role: text("role").notNull().default("STUDENT"),
  status: UserStatus("status").notNull().default("PENDING"),
  designation: text("designation"),
  rights: text("rights").array().notNull().default([]),
  departmentId: text("departmentId").references((): AnyPgColumn => Department.id, {
    onDelete: "cascade",
    onUpdate: "cascade",
  }),
  courseId: text("courseId").references((): AnyPgColumn => Course.id, {
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
