import Redis from 'ioredis';
import env from '../config/envConfig';

export class RedisService {
  private client: Redis;
  
  constructor() {
    this.client = new Redis({
      host: env.redis.host || 'localhost',
      port: env.redis.port || 6379,
      password: env.redis.password || undefined,
      db: env.redis.db || 0
    });
  }
  
  /**
   * Store a document URL in Redis with an expiration time
   * @param key The key to store (usually documentId:clientId:type)
   * @param url The signed URL
   * @param expiresIn Expiration time in seconds
   */
  async storeDocumentUrl(key: string, url: string, expiresIn: number): Promise<void> {
    await this.client.set(key, url, 'EX', expiresIn);
  }
  
  /**
   * Get a document URL from Redis
   * @param key The key to retrieve (usually documentId:clientId:type)
   * @returns The signed URL or null if not found
   */
  async getDocumentUrl(key: string): Promise<string | null> {
    return await this.client.get(key);
  }
  
  /**
   * Check if a document URL exists in Redis
   * @param key The key to check
   * @returns Boolean indicating if the key exists
   */
  async hasDocumentUrl(key: string): Promise<boolean> {
    return (await this.client.exists(key)) > 0;
  }
  
  /**
   * Delete a document URL from Redis
   * @param key The key to delete
   */
  async deleteDocumentUrl(key: string): Promise<void> {
    await this.client.del(key);
  }
}
