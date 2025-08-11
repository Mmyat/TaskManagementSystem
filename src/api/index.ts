import { Elysia } from "elysia";
import todoRoutes from "./todos";

const taskRoutes = new Elysia({prefix: "/admin"})
.use(todoRoutes);  
export default taskRoutes;