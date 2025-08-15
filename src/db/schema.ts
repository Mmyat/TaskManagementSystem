import { pgTable, serial, text, timestamp, boolean, integer, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { basedcols } from "./columns.helpers"; // Assuming you have this shared columns definition

// Define todo status enum similar to roles enum in reference schema
export const todoStatus = pgEnum('status', [
  'Pending', 
  'InProgress', 
  'Completed', 
  'Archived'
]);
export const todoPriority = pgEnum('todo_priority', [
  'High',
  'Medium',
  'Low',
]);

export const roles = pgEnum('user_role', ['admin', 'user', 'guest']);

export const user = pgTable('users', {
  ...basedcols, // Reuse your base columns if they include id, createdAt, updatedAt, etc.
  username: varchar('username', { length: 50 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).default('user').notNull(),
  profilePicture: varchar('profile_picture', { length: 255 }),
  bio: text('bio'),
});

export const todos = pgTable('todos', {
  ...basedcols, // Reuse your base columns if they include id, createdAt, updatedAt, etc.
  
  // Required fields
  title: varchar('title', { length: 255 }).notNull(),
  
  // Optional fields
  description: text('description'),
  
  // Status management 
  status: todoStatus('status').default('Pending').notNull(),
  
  // Completion flag 
  completed: boolean('completed').default(false),
  
  // Dates 
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  
  // Priority 
  priority: todoPriority('priority').default('Low').notNull(),
  
  // Relationships
  assignedToUserId: varchar('assigned_to_user_id', { length: 32 })
    .references(() => user.id),
  
    // Relationships
  createdByUserId: varchar('created_by_user_id', { length: 32 })
    .references(() => user.id),

  // Category/tag system
  category: varchar('category', { length: 50 }),
  
  // Metadata 
  attachmentUrl: varchar('attachment_url'),
});

export const userRelations = relations(user, ({ many }) => ({
  tasks: many(todos),
}));

export const todoRelations = relations(todos, ({ one }) => ({
  assignedTo: one(user, {
    fields: [todos.assignedToUserId],
    references: [user.id],
  }),
  createdBy: one(user, {
    fields: [todos.createdByUserId],
    references: [user.id],
  }),
}));

// Type inference (keep your existing types)
export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;