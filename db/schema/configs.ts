import {
  pgTable,
  serial,
  varchar,
  jsonb,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

export const configs = pgTable(
  "configs",
  {
    id: serial("id").primaryKey(),

    key: varchar("key", { length: 150 })
      .notNull()
      .unique(),

    value: jsonb("value")
      .$type<Record<string, unknown>>()
      .notNull(),

    description: text("description"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
);