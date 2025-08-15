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

export const adminJwt = createElysiaJwt<{ userId: string; role: string ;token_use: string}>({
  keyPairs: [
    {
      privateKey: ADMIN_KEYS.privateKey,
      publicKey: ADMIN_KEYS.publicKey,
      defaultSignOptions: { expiresIn: "1h" },
      kid: 'admin',
    }
  ]
});

export const userJwt = createElysiaJwt<{ userId: string; role: string;token_use: string }>({
  keyPairs: [
    {
      privateKey: CASHIER_KEYS.privateKey,
      publicKey: CASHIER_KEYS.publicKey,
      defaultSignOptions: { expiresIn: "1h" },
      kid: 'user', 
    }
  ]
});

export const commonJwt = createElysiaJwt({
  keyPairs: [
    { privateKey: ADMIN_KEYS.privateKey, 
      publicKey: ADMIN_KEYS.publicKey, 
      kid: 'admin', 
      defaultSignOptions : {expiresIn: "1h",algorithm: 'ES512'} 
    },
    { privateKey: CASHIER_KEYS.privateKey, 
      publicKey: CASHIER_KEYS.publicKey, 
      kid: 'user', 
      defaultSignOptions : {expiresIn: "1h",algorithm: 'ES256'} 
    },
  ]
});