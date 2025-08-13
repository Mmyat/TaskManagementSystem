import { Elysia } from "elysia";
import todoRoutes from "./todos";
import userRoutes from "./user";

const taskRoutes = new Elysia({prefix: "/admin"})
.use(userRoutes)
.use(todoRoutes); 
export default taskRoutes;