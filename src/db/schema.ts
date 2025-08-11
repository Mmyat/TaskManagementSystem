import { pgTable, serial, text, timestamp, boolean, integer, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { basedcols } from "./columns.helpers"; // Assuming you have this shared columns definition

// Define todo status enum similar to roles enum in reference schema
export const todoStatus = pgEnum('todo_status', [
  'Pending', 
  'InProgress', 
  'Completed', 
  'Archived'
]);

export const todos = pgTable('todos', {
  ...basedcols, // Reuse your base columns if they include id, createdAt, updatedAt, etc.
  
  // Required fields
  title: varchar('title', { length: 255 }).notNull(),
  
  // Optional fields
  description: text('description'),
  
  // Status management (similar to user roles)
  status: todoStatus('status').default('Pending').notNull(),
  
  // Completion flag (boolean like isActive in user table)
  completed: boolean('completed').default(false),
  
  // Dates (similar to reference schema)
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  
  // Priority (could also be an enum if needed)
  priority: integer('priority').default(3), // 1=High, 2=Medium, 3=Low
  
  // // Relationships (similar to departmentId in user table)
  // assignedToId: varchar('assigned_to_id', { length: 32 })
  //   .references(() => user.id),
  
  // Category/tag system (similar to donation categories)
  category: varchar('category', { length: 50 }),
  
  // Metadata (similar to image_url in user table)
  attachmentUrl: varchar('attachment_url'),
});

// Define relations if needed (similar to userRelations)
// export const todoRelations = relations(todos, ({ one }) => ({
//   assignedTo: one(user, {
//     fields: [todos.assignedToId],
//     references: [user.id]
//   }),
// }));

// Type inference (keep your existing types)
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;