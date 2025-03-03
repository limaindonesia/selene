import dotenv from 'dotenv';

dotenv.config();
const env = {
  app_env: process.env.APP_ENVIRONMENT || 'DEV',
  port: process.env.APP_PORT || '5000',
  log_transport: process.env.LOG_TRANSPORT || 'FILE',   // CONSOLE, FILE
  mongodb1: {
    uri: process.env.MONGO1_URI|| 'mongodb://localhost:27017',
    database: process.env.MONGO1_DBNAME || 'perqara',
    username: process.env.MONGO1_USERNAME || 'root',
    password: process.env.MONGO1_PASSWORD || '',
  },
  mongodb2: {
    uri: process.env.MONGO2_URI|| 'mongodb://localhost:27017',
    database: process.env.MONGO2_DBNAME || 'legal_form',
    username: process.env.MONGO2_USERNAME || 'root',
    password: process.env.MONGO2_PASSWORD || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
  },
  gcs: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
    keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || '',
    bucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET || '',
    pathPrefix: process.env.GOOGLE_CLOUD_STORAGE_PATH_PREFIX || '',
    bucketPublic: process.env.GOOGLE_CLOUD_STORAGE_BUCKET_PUBLIC || '',
    pathPrefixPublic: process.env.GOOGLE_CLOUD_STORAGE_PATH_PREFIX_PUBLIC || '',
  }
}

export default env;
