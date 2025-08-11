import { Context } from "elysia";
import { DbType } from "./db";
import { Logger } from "@bogeychan/elysia-logger/types";

export type ContextWithDB = {
  db: DbType;
  log : Logger;
};

export type AppContext = Context & {
  db : DbType;
  log : Logger;
};

export type HandlerResult<T = any> = {
  data?: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
};

export enum PdfType{
  Cert = 1,
  Receipt
}

export type UserInfo = {
  id: string,
  name: string,
  name_en: string,
  loginCode: string,
  role: string,
  // ... other user fields
};

export type SettingsUpdateItem = {
  key: string;
  value: string | null;
};
