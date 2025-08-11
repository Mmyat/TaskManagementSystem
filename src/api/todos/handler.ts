import { eq, and } from 'drizzle-orm';
import { todos } from "../../db/schema";
import { AppContext, HandlerResult } from "../../types";
import { error_codes } from "../../constants/error_codes";
import { logger } from '../../plugins/winston_logger';

export const handleListTodos = async ({db, log, query, set}: AppContext): Promise<HandlerResult<any[]>> => {
  const { completed } = query;
  try {
    const whereClause: any[] = [];

    if (completed !== undefined) {
      whereClause.push((todos: any, { eq }: any) => eq(todos.completed, completed === 'true'));
    }

    const todoItems = await db.query.todos.findMany({
      where: whereClause.length 
        ? (todos, operators) => and(...whereClause.map(fn => fn(todos, operators)))
        : undefined,
      columns: {
        id: true,
        title: true,
        description: true,
        completed: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return {
      data: todoItems
    };
  } catch(error) {
    set.status = 500;
    return {
      error: {
        message: 'Failed to get todos',
        code: error_codes.TODO_LISTING_FAILED,
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

export const handleGetTodoById = async ({db, params, set}: AppContext): Promise<HandlerResult<any>> => {
  const { id } = params;

  if (!id) {
    set.status = 400;
    return {
      error: {
        message: 'Todo ID is required',
        code: error_codes.TODO_ID_REQUIRED
      }
    };
  }

  try {
    const todo = await db.query.todos.findFirst({
      where: eq(todos.id, id),
      columns: {
        id: true,
        title: true,
        description: true,
        completed: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!todo) {
      set.status = 404;
      return {
        error: {
          message: 'Todo not found',
          code: error_codes.TODO_NOT_FOUND
        }
      };
    }

    return {
      data: todo
    };
  } catch(error) {
    set.status = 500;
    return {
      error: {
        message: 'Failed to get todo',
        code: error_codes.TODO_RETRIEVAL_FAILED,
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

export const handleCreateTodo = async ({db, body, set}: AppContext & {
    body: { 
      title: string;
      description: string;
    }
}): Promise<HandlerResult<{ id: string }>> => {
  const { title, description } = body;
  logger.debug(`Creating todo with title: ${title}`);
  if (!title) {
    set.status = 400;
    return {
      error: {
        message: 'Title is required',
        code: error_codes.TODO_TITLE_REQUIRED
      }
    };
  }

  try {
    const [newTodo] = await db.insert(todos)
      .values({
        title,
        description: description || null
      })
      .returning({ id: todos.id });
      logger.info(`Todo created with ID: ${newTodo.id}`);

    return {
      data: {
        id: newTodo.id
      }
    };
  } catch(error) {
    set.status = 500;
    return {
      error: {
        message: 'Failed to create todo',
        code: error_codes.TODO_CREATION_FAILED,
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

export const handleUpdateTodo = async ({db, params, body, set}: AppContext & {
    body: { 
      title: string;
      description: string;
      completed: boolean;
    }
}): Promise<HandlerResult<any>> => {
  const { id } = params;
  const { title, description, completed } = body;

  if (!id) {
    set.status = 400;
    return {
      error: {
        message: 'Todo ID is required',
        code: error_codes.TODO_ID_REQUIRED
      }
    };
  }

  try {
    const updateData: any = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (completed !== undefined) updateData.completed = completed;

    const [updatedTodo] = await db.update(todos)
      .set(updateData)
      .where(eq(todos.id, id))
      .returning();

    if (!updatedTodo) {
      set.status = 404;
      return {
        error: {
          message: 'Todo not found',
          code: error_codes.TODO_NOT_FOUND
        }
      };
    }

    return {
      data: updatedTodo
    };
  } catch(error) {
    set.status = 500;
    return {
      error: {
        message: 'Failed to update todo',
        code: error_codes.TODO_UPDATE_FAILED,
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

export const handleDeleteTodo = async ({db, params, set}: AppContext): Promise<HandlerResult<any>> => {
  const { id } = params;

  if (!id) {
    set.status = 400;
    return {
      error: {
        message: 'Todo ID is required',
        code: error_codes.TODO_ID_REQUIRED
      }
    };
  }

  try {
    const [deletedTodo] = await db.delete(todos)
      .where(eq(todos.id, id))
      .returning();

    if (!deletedTodo) {
      set.status = 404;
      return {
        error: {
          message: 'Todo not found',
          code: error_codes.TODO_NOT_FOUND
        }
      };
    }

    return {
      data: {
        message: 'Todo deleted successfully'
      }
    };
  } catch(error) {
    set.status = 500;
    return {
      error: {
        message: 'Failed to delete todo',
        code: error_codes.TODO_DELETION_FAILED,
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

export const handleToggleTodoComplete = async ({db, params, set}: AppContext): Promise<HandlerResult<any>> => {
  const { id } = params;

  if (!id) {
    set.status = 400;
    return {
      error: {
        message: 'Todo ID is required',
        code: error_codes.TODO_ID_REQUIRED
      }
    };
  }

  try {
    // First get the current state
    const todo = await db.query.todos.findFirst({
      where: eq(todos.id, id),
      columns: {
        completed: true
      }
    });

    if (!todo) {
      set.status = 404;
      return {
        error: {
          message: 'Todo not found',
          code: error_codes.TODO_NOT_FOUND
        }
      };
    }

    // Toggle the completed status
    const [updatedTodo] = await db.update(todos)
      .set({
        completed: !todo.completed,
        updatedAt: new Date()
      })
      .where(eq(todos.id, id))
      .returning();

    return {
      data: updatedTodo
    };
  } catch(error) {
    set.status = 500;
    return {
      error: {
        message: 'Failed to toggle todo status',
        code: error_codes.TODO_UPDATE_FAILED,
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}