import * as bcrypt from "bcrypt";
import { eq, and } from 'drizzle-orm';
import { roles, user } from "../../db/schema";
import { AppContext, HandlerResult } from "../../types";
import { saltRounds } from "../../constants";
import { error_codes } from "../../constants/error_codes";
import { parseRole } from "../../db/enum.helpers";
import { userJwt } from "../../middlewares/jwt_tokens";
import { log } from "console";
import { uploadFile } from "../../helpers/uploadFile";

export const handleUserById = async ({db, log, set, params}: AppContext) : Promise<HandlerResult<any>> => {
  const { id } = params;
  if(!id) {
    set.status = 400;
    return {
      error: {
        message: 'User ID required',
        code: error_codes.USER_ID_REQUIRE
      }
    };
  }

  try {
    const record = await db.query.user.findFirst({
      where: eq(user.id, id),
      columns: {
        id: true,
        username: true,
        email: true,
        role: true,
        profilePicture: true,
        bio: true
      }
    });

    if(!record) {
      set.status = 404;
      return {
        error: {
          message: 'User not found',
          code: error_codes.USER_NOT_FOUND
        }
      };
    }

    return {
      data: record
    };
  }
  catch(error) {
    set.status = 500;
    return {
      error: {
        message: 'Failed to get user',
        code: error_codes.USER_LISTING_FAILED,
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

export const handleCreateUser = async ({db, request, set}: AppContext): Promise<HandlerResult<{ id: string }>> => {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;
  const profilePicture = formData.get("profilePicture") as File | null;
  const bio = formData.get("bio") as string | null;

  // Validate required fields
  if (!username || !email || !password) {
    set.status = 400;
    return {
      error: {
        message: 'Missing required fields',
        code: error_codes.MISSING_REQUIRED_FIELDS,
        details: 'Username, email, and password are required'
      }
    };
  }

  // Check if email exists
  const existingEmail = await db.query.user.findFirst({ 
    where: eq(user.email, email),
    columns: { id: true }
  });
  if (existingEmail) {
    set.status = 409;
    return {
      error: {
        message: `Email (${email}) already exists`,
        code: error_codes.EMAIL_EXISTS
      }
    };
  }

  // Validate role
  const pgRole = parseRole(role);
  if(!pgRole) {
    set.status = 400;
    return {
      error: {
        message: 'Invalid role provided',
        code: error_codes.INVALID_USER_ROLE,
        details: `Role (${role}) is not valid`
      }
    };
  }
  
  if (role === 'admin') {
    set.status = 403;
    return {
      error: {
        message: 'Cannot create user with admin role',
        code: error_codes.UNAUTHORIZED,
        details: 'Creation of admin users is restricted'
      }
    };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const userData = {
      username,
      email,
      password: hashedPassword,
      role: pgRole,
      ...(bio && { bio }),
      // Profile picture handled separately
    };

    const [insertedUser] = await db.insert(user)
      .values(userData)
      .returning({ id: user.id });

    // Handle profile picture upload if present
    if (profilePicture) {
      try {
        const filePath = './public/profile-images';
        const relativeImagePath = await uploadFile(profilePicture, insertedUser.id,filePath);
        if (relativeImagePath) {
          await db.update(user)
            .set({ profilePicture: relativeImagePath })
            .where(eq(user.id, insertedUser.id));
        }
      } catch (uploadError) {
        console.error('Profile picture upload failed:', uploadError);
        // Continue without failing the user creation
      }
    }

    return { data: { id: insertedUser.id } };
  } catch (error) {
    console.error('Database error:', error);
    set.status = 500;
    return {
      error: {
        message: 'Failed to create user',
        code: error_codes.USER_CREATION_FAILED,
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
};

export const handleUpdateUser = async ({db, set, request}: AppContext) : Promise<HandlerResult<any>> => {
  const formData = await request.formData();
  const id = formData.get("id") as string;
  const username = formData.get("username") as string;
  const email = formData.get("email") as string;
  const role = formData.get("role") as string;
  const profilePicture = formData.get("profilePicture") as File | null;
  const bio = formData.get("bio") as string | null;

  const pgRole = parseRole(role);
  if(!pgRole) {
    set.status = 400;
    return {
      error: {
        message: 'Invalid role provided',
        code: error_codes.INVALID_USER_ROLE,
        details: `Role (${role}) is not valid`
      }
    };
  }

  try { 
    let updateData: any = {
      username,
      email,
      role: pgRole,
      ...(bio && { bio })
    };

    if(profilePicture) {
      try {
        const filePath = './public/profile-images';
        const relativeImagePath = await uploadFile(profilePicture, updateData.id,filePath);
        if (relativeImagePath) {
          await db.update(user)
            .set({ profilePicture: relativeImagePath })
            .where(eq(user.id, updateData.id));
        }
      } catch (uploadError) {
        console.error('Profile picture upload failed:', uploadError);
        // Continue without failing the user creation
      }
    }
    
    const [updatedRecord] = await db.update(user)
      .set(updateData)
      .where(eq(user.id, id))
      .returning();

    if(updatedRecord) {
      return { data: updatedRecord };
    }
    
    set.status = 404;
    return {
      error: {
        message: 'User not found',
        code: error_codes.USER_NOT_FOUND
      }
    };
  } catch (error) {
    set.status = 500;
    return {
      error: {
        message: 'Failed to update user',
        code: error_codes.USER_UPDATE_FAILED,
        details: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

export const handleDeleteUser = async ({db, body, set}: AppContext & {
    body: { id: string }
}) : Promise<HandlerResult<any>> => {
    const { id } = body;
    
    try {
        await db.delete(user)
            .where(eq(user.id, id));
            
        return { data: { message: 'User deleted successfully' } };
    } catch (error) {
        set.status = 500;
        return {
            error: {
                message: 'Failed to delete user',
                code: error_codes.USER_DELETE_FAILED,
                details: error instanceof Error ? error.message : String(error)
            }
        };
    }
}

export const handleChangePassword = async ({db, body, set}: AppContext & {
    body: { 
        id: string,
        password: string,
    }
}) : Promise<HandlerResult<any>> => {
    try {
        const { id, password } = body;
        
        if (!password || !id) {
            set.status = 400;
            return {
                error: {
                    message: "User ID and password are required",
                    code: error_codes.USERID_AND_PASSWORD_REQUIRE
                }
            };
        }
        
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        await db.update(user)
            .set({ password: hashedPassword })
            .where(eq(user.id, id));
            
        return { data: { message: 'Password updated successfully' } };
    } catch (error) {
        set.status = 500;
        return {
            error: {
                message: "Failed to update password",
                code: error_codes.USER_UPDATE_PASSWORD_FAILED,
                details: error instanceof Error ? error.message : String(error)
            }
        };
    }
}

export const handleLogin = async ({db, body, set}: AppContext & {
    body: { 
        username: string,
        password: string
    }
}) : Promise<HandlerResult<any>> => {
    const { username, password } = body;

    if (!username || !password) {
        set.status = 400;
        return { 
            error: {
                message: "Username and password are required",
                code: error_codes.INVALID_CREDENTIALS
            }
        };
    }

    try {
        const existingUser = await db.query.user.findFirst({ 
            where: eq(user.username, username),
            columns: { 
                id: true, 
                username: true, 
                password: true, 
                role: true 
            }
        });

        if (!existingUser) {
            set.status = 404;
            return { 
                error: {
                    message: "User not found",
                    code: error_codes.USER_NOT_FOUND 
                }
            };
        }

        if (!existingUser.password) {
            set.status = 401;
            return {
                error: {
                    message: "Invalid user configuration",
                    code: error_codes.INVALID_CREDENTIALS
                }
            };
        }

        const passwordMatch = await bcrypt.compare(password, existingUser.password);        
        if (!passwordMatch) {
            set.status = 401;
            return { 
                error: {
                    message: "Invalid password",
                    code: error_codes.INVALID_PASSWORD
                }
            };
        }
       
        const accessToken = userJwt.generateToken({
            userId: existingUser.id, 
            role: existingUser.role,
            token_use: "access"
        })
        const refreshToken = userJwt.generateToken({
            userId: existingUser.id,
            role: existingUser.role,
            token_use: "refresh"
        }, { expiresIn: '7d' });
        return {
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: existingUser.id,
                    username: existingUser.username,
                    role: existingUser.role
                }
            }
        };
    } catch (error) {
        set.status = 500;
        return {
            error: {
                message: "Login failed",
                code: error_codes.LOGIN_FAILED,
                details: error instanceof Error ? error.message : String(error)
            }
        };
    }
}

export const handleLogout = async ({db, set, store}: AppContext & {
    store: any
}) : Promise<HandlerResult<any>> => {
    const jwt = store.jwt;

    if (!jwt) {
        set.status = 401;
        return { 
            error: {
                message: "Not authenticated",
                code: error_codes.UNAUTHORIZED 
            }
        };
    }

    try {
        // In a real implementation, you might want to:
        // 1. Add the token to a blacklist
        // 2. Record the logout event
        return { 
            data: { 
                message: "Logged out successfully" 
            } 
        };
    } catch (error) {
        set.status = 500;
        return { 
            error: {
                message: "Logout failed",
                code: error_codes.LOGOUT_FAILED,
                details: error instanceof Error ? error.message : String(error)
            }
        };
    }
}

export const handleRefreshToken = async ({db, body, set}: AppContext & {
    body: { 
        refreshToken: string
    }
}) : Promise<HandlerResult<any>> => {
    const { refreshToken } = body;

    if (!refreshToken) {
        set.status = 400;
        return { 
            error: {
                message: "Refresh token is required",
                code: error_codes.REFRESH_TOKEN_REQUIRED
            }
        };
    }

    try {
        const decoded = userJwt.verifyToken(refreshToken,"refresh");
        
        if (decoded === null || (typeof decoded === "object" && "expired" in decoded && decoded.expired)) {
            set.status = 401;
            return {
                error: {
                    message: "Refresh token expired or invalid",
                    code: error_codes.TOKEN_EXPIRED
                }
            };
        }

        if (typeof decoded !== "object" || !("userId" in decoded) || !("role" in decoded)) {
            set.status = 401;
            return {
                error: {
                    message: "Invalid refresh token payload",
                    code: error_codes.INVALID_TOKEN_PAYLOAD
                }
            };
        }

        // Verify the user still exists
        const userExists = await db.query.user.findFirst({
            where: eq(user.id, decoded.userId),
            columns: { id: true }
        });

        if (!userExists) {
            set.status = 401;
            return {
                error: {
                    message: "User no longer exists",
                    code: error_codes.USER_NOT_FOUND
                }
            };
        }

        const newAccessToken = userJwt.generateToken({
            userId: decoded.userId, 
            role: decoded.role,
            token_use: "access"
        });

        return {
            data: {
                accessToken: newAccessToken
            }
        };
    } catch (error) {
        set.status = 500;
        return {
            error: {
                message: "Token refresh failed",
                code: error_codes.TOKEN_REFRESH_FAILED,
                details: error instanceof Error ? error.message : String(error)
            }
        };
    }
}