CREATE TYPE "public"."todo_status" AS ENUM('Pending', 'InProgress', 'Completed', 'Archived');--> statement-breakpoint
CREATE TABLE "todos" (
	"id" varchar(32) PRIMARY KEY NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "todo_status" DEFAULT 'Pending' NOT NULL,
	"completed" boolean DEFAULT false,
	"due_date" timestamp,
	"completed_at" timestamp,
	"priority" integer DEFAULT 3,
	"category" varchar(50),
	"attachment_url" varchar
);
