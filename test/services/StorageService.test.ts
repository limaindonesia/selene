import { StorageService } from '../../src/services/StorageService';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);
const existsAsync = promisify(fs.exists);

jest.mock('../../src/config/envConfig', () => ({
  __esModule: true,
  default: {
    app_env: 'DEV',
    gcs: {
      projectId: '',
      keyFilename: '',
      bucket: '',
      pathPrefix: '',
      bucketPublic: '',
      pathPrefixPublic: '',
    }
  }
}));

describe('StorageService - Local Storage Tests', () => {
  let storageService: StorageService;
  const testDir = path.join(process.cwd(), 'storage', 'local', 'test');
  const testFile = path.join(testDir, 'test-file.txt');
  const testContent = 'This is a test file for local storage';

  beforeAll(async () => {
    if (!(await existsAsync(testDir))) {
      await mkdirAsync(testDir, { recursive: true });
    }
    
    await writeFileAsync(testFile, testContent);
  });

  afterAll(async () => {
    if (await existsAsync(testFile)) {
      await unlinkAsync(testFile);
    }
  });

  beforeEach(() => {
    storageService = new StorageService();
  });

  describe('Local Storage Mode', () => {
    it('should initialize in local storage mode', () => {
      // @ts-ignore - accessing private property for testing
      expect(storageService.isLocalStorage).toBe(true);
      // @ts-ignore - accessing private property for testing
      expect(storageService.storage).toBeNull();
    });

    it('should create local storage directories', async () => {
      const localStoragePath = path.join(process.cwd(), 'storage', 'local');
      const documentsPath = path.join(localStoragePath, 'documents');
      const publicPath = path.join(localStoragePath, 'public');
      
      expect(await existsAsync(localStoragePath)).toBe(true);
      expect(await existsAsync(documentsPath)).toBe(true);
      expect(await existsAsync(publicPath)).toBe(true);
    });
  });

  describe('uploadFile', () => {
    it('should upload a file to local storage', async () => {
      const destination = 'test-upload.txt';
      const result = await storageService.uploadFile(testFile, destination);
      
      const uploadedPath = path.join(process.cwd(), 'storage', 'local', 'documents', destination);
      expect(await existsAsync(uploadedPath)).toBe(true);
      
      expect(result).toBe(`file://${uploadedPath}`);
      
      if (await existsAsync(uploadedPath)) {
        await unlinkAsync(uploadedPath);
      }
    });

    it('should upload a file to public local storage', async () => {
      const destination = 'test-upload-public.txt';
      const result = await storageService.uploadFile(testFile, destination, true);
      
      const uploadedPath = path.join(process.cwd(), 'storage', 'local', 'public', destination);
      expect(await existsAsync(uploadedPath)).toBe(true);
      
      expect(result).toBe(`file://${uploadedPath}`);
      
      if (await existsAsync(uploadedPath)) {
        await unlinkAsync(uploadedPath);
      }
    });
  });

  describe('downloadFile', () => {
    it('should download a file from local storage', async () => {
      const uploadDestination = 'test-download.txt';
      await storageService.uploadFile(testFile, uploadDestination);
      
      const downloadDestination = path.join(testDir, 'downloaded-file.txt');
      const result = await storageService.downloadFile(uploadDestination, downloadDestination);
      
      expect(await existsAsync(downloadDestination)).toBe(true);
      
      const content = await readFileAsync(downloadDestination, 'utf8');
      expect(content).toBe(testContent);
      
      expect(result).toBe(downloadDestination);
      
      const uploadedPath = path.join(process.cwd(), 'storage', 'local', 'documents', uploadDestination);
      if (await existsAsync(uploadedPath)) {
        await unlinkAsync(uploadedPath);
      }
      if (await existsAsync(downloadDestination)) {
        await unlinkAsync(downloadDestination);
      }
    });

    it('should throw an error if the file does not exist', async () => {
      const downloadDestination = path.join(testDir, 'non-existent-file.txt');
      await expect(storageService.downloadFile('non-existent-file.txt', downloadDestination))
        .rejects.toThrow('File not found in local storage');
    });
  });

  describe('fileExists', () => {
    it('should return true if the file exists', async () => {
      const uploadDestination = 'test-exists.txt';
      await storageService.uploadFile(testFile, uploadDestination);
      
      const result = await storageService.fileExists(uploadDestination);
      expect(result).toBe(true);
      
      const uploadedPath = path.join(process.cwd(), 'storage', 'local', 'documents', uploadDestination);
      if (await existsAsync(uploadedPath)) {
        await unlinkAsync(uploadedPath);
      }
    });

    it('should return false if the file does not exist', async () => {
      const result = await storageService.fileExists('non-existent-file.txt');
      expect(result).toBe(false);
    });
  });

  describe('getSignedUrl', () => {
    it('should return a file:// URL for local storage', async () => {
      const uploadDestination = 'test-url.txt';
      await storageService.uploadFile(testFile, uploadDestination);
      
      const result = await storageService.getSignedUrl(uploadDestination);
      
      const expectedPath = path.join(process.cwd(), 'storage', 'local', 'documents', uploadDestination);
      expect(result).toBe(`file://${expectedPath}`);
      
      const uploadedPath = path.join(process.cwd(), 'storage', 'local', 'documents', uploadDestination);
      if (await existsAsync(uploadedPath)) {
        await unlinkAsync(uploadedPath);
      }
    });
  });

  describe('getFileStream', () => {
    it('should return a readable stream for a file', async () => {
      const uploadDestination = 'test-stream.txt';
      await storageService.uploadFile(testFile, uploadDestination);
      
      const stream = storageService.getFileStream(uploadDestination);
      
      expect(stream.readable).toBe(true);
      
      let data = '';
      for await (const chunk of stream) {
        data += chunk;
      }
      
      expect(data).toBe(testContent);
      
      const uploadedPath = path.join(process.cwd(), 'storage', 'local', 'documents', uploadDestination);
      if (await existsAsync(uploadedPath)) {
        await unlinkAsync(uploadedPath);
      }
    });
  });
});
