import { Elysia } from "elysia";
import todoRoutes from "./todos";
import userRoutes from "./user";
import adminRoutes from "./admin";

const taskRoutes = new Elysia({prefix: "/task-manager"})
.use(adminRoutes)
.use(userRoutes)
.use(todoRoutes); 
export default taskRoutes;