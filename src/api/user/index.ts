import { Elysia } from "elysia";
import { 
  handleChangePassword, 
  handleCreateUser, 
  handleDeleteUser, 
  handleListUser, 
  handleListUserByRole, 
  handleLogin, 
  handleLogout, 
  handleRefreshToken, 
  handleUpdateUser, 
  handleUserById
} from "./handlers";
import { adminJwt } from "../../middlewares/jwt_tokens";

const userRoutes = new Elysia({prefix: "/user"})
  .post("/login", handleLogin)
  .post("/refreshToken", handleRefreshToken)
  .post("/create", handleCreateUser)
  .onBeforeHandle(adminJwt.createAuthMiddleware())
  .get("/", handleListUser)
  .get("/getUserById/:id", handleUserById)
  .get("/getUserByRole/:role", handleListUserByRole)
  .post("/update", handleUpdateUser)
  .post("/delete", handleDeleteUser)
  .post("/changePassword", handleChangePassword)
  .post("/logout", handleLogout)

export default userRoutes;