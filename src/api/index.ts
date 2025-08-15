import { Elysia } from "elysia";
import userRoutes from "./user";
import adminRoutes from "./admin";
import { adminTaskRoutes, userTaskRoutes } from "./tasks";

const apiRoutes = new Elysia({prefix: "/task-manager"})
.use(adminRoutes)
.use(userRoutes)
.use(userTaskRoutes) 
.use(adminTaskRoutes);
export default apiRoutes;