import { Elysia } from "elysia";
import { 
  handleListTodos,
  handleGetTodoById,
  handleCreateTodo,
  handleUpdateTodo,
  handleDeleteTodo,
  handleToggleTodoComplete
} from "./handler";
import { adminJwt, userJwt } from "../../middlewares/jwt_tokens";

export const userTaskRoutes = new Elysia({ prefix: "/task" })
  .onBeforeHandle(userJwt.createAuthMiddleware())
  .post("/", handleCreateTodo)
  .put("/:id", handleUpdateTodo)
  .delete("/:id", handleDeleteTodo)
  .post("/:id/toggle", handleToggleTodoComplete);

export const adminTaskRoutes = new Elysia({ prefix: "/task" })
  .onBeforeHandle(adminJwt.createAuthMiddleware())
  .get("/", handleListTodos)
  .get("/:id", handleGetTodoById);