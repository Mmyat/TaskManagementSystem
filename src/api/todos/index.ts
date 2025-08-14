import { Elysia } from "elysia";
import { 
  handleListTodos,
  handleGetTodoById,
  handleCreateTodo,
  handleUpdateTodo,
  handleDeleteTodo,
  handleToggleTodoComplete
} from "./handler";

const todoRoutes = new Elysia({ prefix: "/task" })
  // Public routes
  .get("/", handleListTodos)
  .get("/:id", handleGetTodoById)
  
  // Protected routes (require authentication)
  // .onBeforeHandle(adminJwt.createAuthMiddleware())
  .post("/", handleCreateTodo)
  .put("/:id", handleUpdateTodo)
  .delete("/:id", handleDeleteTodo)
  .post("/:id/toggle", handleToggleTodoComplete);

export default todoRoutes;