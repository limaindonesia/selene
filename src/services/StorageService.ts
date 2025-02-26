import { Storage } from '@google-cloud/storage';
import env from '../config/envConfig';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);
const copyFileAsync = promisify(fs.copyFile);
const existsAsync = promisify(fs.exists);

export class StorageService {
  private storage: Storage | null;
  private bucket: string;
  private bucketPublic: string;
  private pathPrefix: string;
  private pathPrefixPublic: string;
  private isLocalStorage: boolean;
  private localStoragePath: string;

  constructor() {
    this.isLocalStorage = env.app_env === 'DEV' && !env.gcs.projectId;
    this.localStoragePath = path.join(process.cwd(), 'storage', 'local');
    
    if (this.isLocalStorage) {
      console.log('Using local storage for development');
      this.storage = null;
      this.bucket = 'documents';
      this.bucketPublic = 'public';
      
      this.initLocalStorage();
    } else {
      this.storage = new Storage({
        projectId: env.gcs.projectId,
        keyFilename: env.gcs.keyFilename,
      });
      this.bucket = env.gcs.bucket;
      this.bucketPublic = env.gcs.bucketPublic;
    }
    
    this.pathPrefix = env.gcs.pathPrefix;
    this.pathPrefixPublic = env.gcs.pathPrefixPublic;
  }
  
  /**
   * Initialize local storage directories
   */
  private async initLocalStorage(): Promise<void> {
    try {
      await mkdirAsync(this.localStoragePath, { recursive: true });
      
      await mkdirAsync(path.join(this.localStoragePath, this.bucket), { recursive: true });
      await mkdirAsync(path.join(this.localStoragePath, this.bucketPublic), { recursive: true });
      
      console.log('Local storage directories created');
    } catch (error) {
      console.error('Error creating local storage directories:', error);
    }
  }

  /**
   * Get the full path with prefix
   * @param path File path
   * @param isPublic Whether to use public bucket
   * @returns Full path with prefix
   */
  private getFullPath(filePath: string, isPublic = false): string {
    const prefix = isPublic ? this.pathPrefixPublic : this.pathPrefix;
    return prefix ? `${prefix}/${filePath}` : filePath;
  }

  /**
   * Upload a file to storage (GCS or local)
   * @param filePath Local file path
   * @param destination Destination path in storage
   * @param isPublic Whether to use public bucket
   * @returns URL of the uploaded file
   */
  async uploadFile(filePath: string, destination: string, isPublic = false): Promise<string> {
    try {
      const bucketName = isPublic ? this.bucketPublic : this.bucket;
      const fullDestination = this.getFullPath(destination, isPublic);
      
      if (this.isLocalStorage) {
        const localDestination = path.join(this.localStoragePath, bucketName, fullDestination);
        
        await mkdirAsync(path.dirname(localDestination), { recursive: true });
        
        await copyFileAsync(filePath, localDestination);
        
        return `file://${localDestination}`;
      } else {
        await this.storage!.bucket(bucketName).upload(filePath, {
          destination: fullDestination,
          metadata: {
            contentType: 'application/pdf',
          },
        });

        if (isPublic) {
          await this.storage!.bucket(bucketName).file(fullDestination).makePublic();
        }

        return `https://storage.googleapis.com/${bucketName}/${fullDestination}`;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Download a file from storage (GCS or local)
   * @param source Source path in storage
   * @param destination Local destination path
   * @param isPublic Whether to use public bucket
   * @returns Local file path
   */
  async downloadFile(source: string, destination: string, isPublic = false): Promise<string> {
    try {
      const bucketName = isPublic ? this.bucketPublic : this.bucket;
      const fullSource = this.getFullPath(source, isPublic);

      const dir = path.dirname(destination);
      await mkdirAsync(dir, { recursive: true });

      if (this.isLocalStorage) {
        const localSource = path.join(this.localStoragePath, bucketName, fullSource);
        
        if (!(await existsAsync(localSource))) {
          throw new Error(`File not found in local storage: ${localSource}`);
        }
        
        await copyFileAsync(localSource, destination);
      } else {
        await this.storage!.bucket(bucketName).file(fullSource).download({
          destination,
        });
      }

      return destination;
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  /**
   * Get a read stream for a file in storage (GCS or local)
   * @param source Source path in storage
   * @param isPublic Whether to use public bucket
   * @returns Read stream
   */
  getFileStream(source: string, isPublic = false) {
    const bucketName = isPublic ? this.bucketPublic : this.bucket;
    const fullSource = this.getFullPath(source, isPublic);
    
    if (this.isLocalStorage) {
      const localSource = path.join(this.localStoragePath, bucketName, fullSource);
      return fs.createReadStream(localSource);
    } else {
      return this.storage!.bucket(bucketName).file(fullSource).createReadStream();
    }
  }

  /**
   * Check if a file exists in storage (GCS or local)
   * @param source Source path in storage
   * @param isPublic Whether to use public bucket
   * @returns Boolean indicating if the file exists
   */
  async fileExists(source: string, isPublic = false): Promise<boolean> {
    try {
      const bucketName = isPublic ? this.bucketPublic : this.bucket;
      const fullSource = this.getFullPath(source, isPublic);
      
      if (this.isLocalStorage) {
        const localSource = path.join(this.localStoragePath, bucketName, fullSource);
        return await existsAsync(localSource);
      } else {
        const [exists] = await this.storage!.bucket(bucketName).file(fullSource).exists();
        return exists;
      }
    } catch (error) {
      console.error('Error checking if file exists:', error);
      throw error;
    }
  }

  /**
   * Get a URL for a file in storage (GCS or local)
   * @param source Source path in storage
   * @param expiresIn Expiration time in seconds (default: 15 minutes)
   * @param isPublic Whether to use public bucket
   * @returns URL to access the file
   */
  async getSignedUrl(source: string, expiresIn = 15 * 60, isPublic = false): Promise<string> {
    try {
      const bucketName = isPublic ? this.bucketPublic : this.bucket;
      const fullSource = this.getFullPath(source, isPublic);
      
      if (this.isLocalStorage) {
        const localSource = path.join(this.localStoragePath, bucketName, fullSource);
        return `file://${localSource}`;
      } else {
        const [url] = await this.storage!.bucket(bucketName).file(fullSource).getSignedUrl({
          action: 'read',
          expires: Date.now() + expiresIn * 1000,
        });
        return url;
      }
    } catch (error) {
      console.error('Error getting URL for file:', error);
      throw error;
    }
  }
}
