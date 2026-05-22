import { redis } from '../libs/redis';

const REFRESH_TOKEN_PREFIX = 'refresh_token:';
const DEFAULT_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

export const saveRefreshTokenRedis = async (token: string, nhanVienId: number, ttl: number = DEFAULT_TTL) => {
  await redis.set(`${REFRESH_TOKEN_PREFIX}${token}`, nhanVienId.toString(), 'EX', ttl);
};

export const getRefreshTokenRedis = async (token: string): Promise<string | null> => {
  return await redis.get(`${REFRESH_TOKEN_PREFIX}${token}`);
};

export const deleteRefreshTokenRedis = async (token: string): Promise<number> => {
  return await redis.del(`${REFRESH_TOKEN_PREFIX}${token}`);
};
