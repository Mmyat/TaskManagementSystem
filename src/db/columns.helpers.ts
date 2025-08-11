import { createId } from "@paralleldrive/cuid2";
import { boolean, timestamp, varchar } from "drizzle-orm/pg-core";

// columns.helpers.ts
export const basedcols = {
  id: varchar('id', { length: 32 }).primaryKey().$defaultFn(() => createId()),
  isActive: boolean("is_active").default(true).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  updatedAt: timestamp("updated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
}
