import { RedisService } from '../../src/services/RedisService';
import Redis from 'ioredis';

// Mock Redis
jest.mock('ioredis');

describe('RedisService', () => {
  let redisService: RedisService;
  let mockRedisClient: any;

  beforeEach(() => {
    // Clear mock calls between tests
    jest.clearAllMocks();
    
    // Create a mock Redis client
    mockRedisClient = {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn(),
      exists: jest.fn(),
      del: jest.fn().mockResolvedValue(1)
    };
    
    // Mock Redis constructor
    (Redis as jest.MockedClass<typeof Redis>).mockImplementation(() => mockRedisClient);
    
    // Create service instance
    redisService = new RedisService();
  });

  describe('storeDocumentUrl', () => {
    it('should store a URL in Redis with expiration', async () => {
      const key = 'document:123:456:download';
      const url = 'https://storage.googleapis.com/bucket/123.pdf';
      const expiresIn = 3600;
      
      await redisService.storeDocumentUrl(key, url, expiresIn);
      
      expect(mockRedisClient.set).toHaveBeenCalledWith(key, url, 'EX', expiresIn);
    });
  });

  describe('getDocumentUrl', () => {
    it('should return URL when found in Redis', async () => {
      const key = 'document:123:456:download';
      const url = 'https://storage.googleapis.com/bucket/123.pdf';
      
      mockRedisClient.get.mockResolvedValue(url);
      
      const result = await redisService.getDocumentUrl(key);
      
      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toBe(url);
    });

    it('should return null when URL not found in Redis', async () => {
      const key = 'document:123:456:download';
      
      mockRedisClient.get.mockResolvedValue(null);
      
      const result = await redisService.getDocumentUrl(key);
      
      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
      expect(result).toBeNull();
    });
  });

  describe('hasDocumentUrl', () => {
    it('should return true when URL exists in Redis', async () => {
      const key = 'document:123:456:download';
      
      mockRedisClient.exists.mockResolvedValue(1);
      
      const result = await redisService.hasDocumentUrl(key);
      
      expect(mockRedisClient.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(true);
    });

    it('should return false when URL does not exist in Redis', async () => {
      const key = 'document:123:456:download';
      
      mockRedisClient.exists.mockResolvedValue(0);
      
      const result = await redisService.hasDocumentUrl(key);
      
      expect(mockRedisClient.exists).toHaveBeenCalledWith(key);
      expect(result).toBe(false);
    });
  });

  describe('deleteDocumentUrl', () => {
    it('should delete URL from Redis', async () => {
      const key = 'document:123:456:download';
      
      await redisService.deleteDocumentUrl(key);
      
      expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    });
  });
});
