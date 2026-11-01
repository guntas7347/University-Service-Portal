import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  type AnyPgColumn,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { User } from "./users";
import { Request } from "./requests";
import { RoutingRule } from "./request-operations";

export const Department = pgTable("Department", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
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

export const DepartmentRelations = relations(Department, ({ one, many }) => ({
  hod: one(User, {
    relationName: "DepartmentHOD",
    fields: [Department.hodId],
    references: [User.id],
  }),
  users: many(User, {
    relationName: "DepartmentUsers",
  }),
  requests: many(Request),
}));

export const CategoryRelations = relations(Category, ({ many }) => ({
  requests: many(Request),
  routingRules: many(RoutingRule),
}));

