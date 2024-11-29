import dotenv from 'dotenv';

dotenv.config();
const env = {
  app_env: process.env.APP_ENVIRONMENT || 'DEV',
  port: process.env.APP_PORT || '5000',
  log_transport: process.env.LOG_TRANSPORT || 'FILE',   // CONSOLE, FILE
  mongodb1: {
    uri: process.env.MONGO1_URI|| 'mongodb://localhost:27017',
    database: process.env.MONGO1_DBNAME || 'legal_form',
    username: process.env.MONGO1_USERNAME || 'root',
    password: process.env.MONGO1_PASSWORD || '',
  },
  mongodb2: {
    uri: process.env.MONGO1_URI|| 'mongodb://localhost:27017',
    database: process.env.MONGO1_DBNAME || 'legal_form',
    username: process.env.MONGO1_USERNAME || 'root',
    password: process.env.MONGO1_PASSWORD || '',
  },
}

export default env;