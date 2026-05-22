import Redis from 'ioredis';

const globalForRedis = global as unknown as { redis: Redis };

// Khởi tạo Redis client
export const redis = globalForRedis.redis || new Redis(process.env.REDIS_URL!);

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Các hàm helper quản lý Refresh Token
export const saveRefreshTokenRedis = async (token: string, nhanVienId: number) => {
  // Lưu token với TTL là 7 ngày (604800 giây)
  await redis.set(`refresh_token:${token}`, nhanVienId.toString(), 'EX', 7 * 24 * 60 * 60);
};

export const getRefreshTokenRedis = async (token: string): Promise<string | null> => {
  return await redis.get(`refresh_token:${token}`);
};

export const deleteRefreshTokenRedis = async (token: string) => {
  await redis.del(`refresh_token:${token}`);
};