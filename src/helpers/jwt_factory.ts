import { Handler, type Context } from 'elysia';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { error_codes } from '../constants/error_codes';
import { HandlerResult } from '../types';
import crypto from 'crypto';

type JwtConfig<T extends JwtPayload> = {
  keyPairs: {
    privateKey: string;
    publicKey: string;
    defaultSignOptions?: SignOptions;
    kid?: string; // Key ID, optional but recommended if you want to identify which key
  }[];
  payloadType?: T;
};

type JwtElysiaPackage<T extends JwtPayload> = {
  generateToken: (payload: T, options?: SignOptions & { kid?: string | number }) => string;
  verifyToken: (token: string) => (T & { exp?: number }) | { expired: true } | null;
  middleware: (config?: { attachToContext?: boolean }) => (ctx: Context) => Promise<void> | void;
  createAuthMiddleware: (config?: { attachToContext?: boolean }) => Handler;
};

type ErrorResponse = {
  message: string;
  code: string;
  details: string;
};

export function createElysiaJwt<T extends JwtPayload = JwtPayload>(
  config: JwtConfig<T>
  ): JwtElysiaPackage<T> {
  if (!Array.isArray(config.keyPairs) || config.keyPairs.length === 0) {
    throw new Error('You must provide at least one keyPair');
  }

  // Generate with a specific key (by kid or by array index)
  const generateToken = (
    payload: T,
    options?: SignOptions & { kid?: string | number }
  ) => {
    let keyPair;

    if (options?.kid !== undefined) {
      if (typeof options.kid === 'number') {
        keyPair = config.keyPairs[options.kid];
      } else if (typeof options.kid === 'string') {
        keyPair = config.keyPairs.find((k) => k.kid === options.kid);
      }
    }
    if (!keyPair) {
      keyPair = config.keyPairs[0]; // fallback to first key
    }

    // Determine the correct algorithm based on key type
    const detectAlgorithm = (privateKey: string): jwt.Algorithm => {
      const keyObject = crypto.createPrivateKey(privateKey);

      if (keyObject.asymmetricKeyType === 'ec') {
        const curve = keyObject.asymmetricKeyDetails?.namedCurve;
        console.log('Curve:', curve);
        
        switch (curve) {
          case 'prime256v1': return 'ES256';
          case 'secp521r1': return 'ES512';
          default:
            throw new Error(`Unsupported EC curve: ${curve}`);
        }
      }

      throw new Error(`Unsupported key type: ${keyObject.asymmetricKeyType}`);
    };
    const algorithm = detectAlgorithm(keyPair.privateKey);
    console.log(`Using algorithm: ${algorithm}`);
    
    // const algorithm = keyPair.privateKey === keyPair.publicKey ? 'ES512' : 'ES256';

    const mergedOptions: SignOptions = {
      algorithm,
      ...(keyPair.defaultSignOptions ?? {}),
      ...options,
    };

    // Set the kid in header, if present
    if (keyPair.kid) {
      mergedOptions.header = { ...(mergedOptions.header ?? {}), kid: keyPair.kid, alg: algorithm };
    } else if (mergedOptions.header && !mergedOptions.header.alg) {
      // Ensure 'alg' is present if header is set, to match the algorithm
      mergedOptions.header = { ...mergedOptions.header, alg: algorithm };
    }

    return jwt.sign(payload, keyPair.privateKey, mergedOptions);
  };

  // Try to verify with all public keys, return on first success
  const verifyToken = (
    token: string
  ): (T & { exp?: number }) | { expired: true } | null => {
    for (const keyPair of config.keyPairs) {
      try {
        return jwt.verify(token, keyPair.publicKey) as T & { exp?: number };
      } catch (err: any) {
        if (err.name === 'TokenExpiredError') return { expired: true };
        // If "invalid signature" or other, try next key
      }
    }
    return null;
  };

  // Elysia-specific middleware
  const middleware = ({ attachToContext = true } = {}) =>
    async (ctx: Context) => {
      const { headers, set, store }: any = ctx;
      const authHeader = headers['authorization'];

      if (!authHeader?.startsWith('Bearer ')) {
        set.status = 401;
        throw new Error('Missing token');
      }

      const result = verifyToken(authHeader.split(' ')[1]);

      if (!result || 'expired' in result) {
        set.status = 401;
        throw new Error(result?.expired ? 'Token expired' : 'Invalid token');
      }

      if (attachToContext) {
        store.jwt = result;
        headers['x-jwt-payload'] = JSON.stringify(result);
      }
    };

  const errorResponse = (
    message: string,
    code: string,
    details: string
  ): HandlerResult => ({
    error: {
      message,
      code,
      details,
    },
  });

  const createAuthMiddleware = ({ attachToContext = true } = {}): Handler => {
    return ({ request, headers, set, store, log }: any) => {
      if (request.method === 'OPTIONS') {
        return;
      }

      const authHeader = headers['authorization'];

      if (!authHeader?.startsWith('Bearer ')) {
        log?.error?.('[authMiddleware] Missing authentication token');
        set.status = 401;
        return errorResponse(
          'Unauthorized',
          error_codes.UNAUTHORIZED,
          'Missing authentication token'
        );
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        set.status = 401;
        log?.error?.('[authMiddleware] Invalid token');
        return errorResponse(
          'Forbidden',
          error_codes.INVALID_TOKEN,
          'Invalid token'
        );
      }

      const result = verifyToken(token);
      if (!result || 'expired' in result) {
        set.status = 401;
        if (result?.expired) {
          log?.error?.('[authMiddleware] Token expired');
          return errorResponse(
            'Forbidden',
            error_codes.TOKEN_EXPIRED,
            'Token expired'
          );
        } else {
          log?.error?.('[authMiddleware] Invalid token');
          return errorResponse(
            'Forbidden',
            error_codes.INVALID_TOKEN,
            'Invalid token'
          );
        }
      }

      if (attachToContext) {
        store.jwt = result;
        // headers['x-user'] = JSON.stringify(result);
      }
    };
  };

  return { generateToken, verifyToken, middleware, createAuthMiddleware };
}
