// src/middleware/jwt.ts
import fs from "fs";
import { createElysiaJwt } from "../helpers/jwt_factory";

// Load JWT keys
const ADMIN_KEYS = {
  privateKey: fs.readFileSync("./keys/admin_private_key.pem", "utf8"),
  publicKey: fs.readFileSync("./keys/admin_public_key.pem", "utf8"),
};

const CASHIER_KEYS = {
  privateKey: fs.readFileSync("./keys/user_private_key.pem", "utf8"),
  publicKey: fs.readFileSync("./keys/user_public_key.pem", "utf8"),
};

export const adminJwt = createElysiaJwt<{ userId: string; role: string }>({
  keyPairs: [
    {
      privateKey: ADMIN_KEYS.privateKey,
      publicKey: ADMIN_KEYS.publicKey,
      defaultSignOptions: { expiresIn: "1h" },
    }
  ]
});

export const cashierJwt = createElysiaJwt<{ userId: string; role: string }>({
  keyPairs: [
    {
      privateKey: CASHIER_KEYS.privateKey,
      publicKey: CASHIER_KEYS.publicKey,
      defaultSignOptions: { expiresIn: "1h" },
    }
  ]
});

export const commonJwt = createElysiaJwt({
  keyPairs: [
    { privateKey: ADMIN_KEYS.privateKey, 
      publicKey: ADMIN_KEYS.publicKey, 
      kid: 'admin', 
      defaultSignOptions : {expiresIn: "1h"} 
    },
    { privateKey: CASHIER_KEYS.privateKey, 
      publicKey: CASHIER_KEYS.publicKey, 
      kid: 'cashier', 
      defaultSignOptions : {expiresIn: "1h"} 
    },
  ]
});

// symmetric-jwt.ts
// export const hs256Jwt = createJwtUtils(
//   "shared_secret_key", // Use same key for both params
//   "shared_secret_key",
//   { algorithm: "HS256" } // Override to HMAC
// );