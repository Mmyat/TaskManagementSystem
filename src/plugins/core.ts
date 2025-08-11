// src/plugins/core.ts
import { Elysia } from 'elysia';
import { db, pool, DbType } from '../db';
import { logger } from './winston_logger';

export const corePlugin = new Elysia()
  .decorate('db', db as DbType)
  .decorate('log', logger)
  .onBeforeHandle(({ request, log }) => {
    //log.info({ url: request.url, method: request.method }, '📥 Incoming request');
    log.debug(`📥 Incoming request - url : ${request.url}, method : ${request.method}`)
  })
  .onError(({ error, set, log }) => {
    //log?.error(error, '❌ Unhandled error');
    log.error('❌ Unhandled error');
    set.status = 500;
    return {
      success: false,
      message: 'Internal Server Error',
      code: 1500,
    };
  })
  .onStop(async () => {
    logger.info('🔌 Closing DB pool...');
    await pool.end();
    logger.info('✅ DB pool closed.');
  });
