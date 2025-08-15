import { Elysia } from "elysia";
import { 
  handleChangePassword, 
  handleCreateUser, 
  handleDeleteUser, 
  handleLogin, 
  handleLogout, 
  handleRefreshToken, 
  handleUpdateUser, 
  handleUserById
} from "./handlers";
import { userJwt } from "../../middlewares/jwt_tokens";

const userRoutes = new Elysia({prefix: "/user"})
  .post("/login", handleLogin)
  .post("/refreshToken", handleRefreshToken)
  .post("/create", handleCreateUser)
  .onBeforeHandle(userJwt.createAuthMiddleware())
  .get("/getUserById/:id", handleUserById)
  .post("/update", handleUpdateUser)
  .post("/delete", handleDeleteUser)
  .post("/changePassword", handleChangePassword)
  .post("/logout", handleLogout)

export default userRoutes;