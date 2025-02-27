# Legal Form Document Generation Service

This document provides an overview of the document generation flow and instructions for running and monitoring the PDF generation queue in both local and production environments.

## Document Generation Flow

### Non-Technical Overview

The document generation service allows users to:

1. **Generate Documents**: Convert HTML content to PDF documents
2. **Regenerate Documents**: Retry generation if it fails
3. **Download Documents**: Get the generated PDF files
4. **Stream Documents**: View the PDF files directly in the browser (with special handling for mobile devices)

The flow is designed to be asynchronous, allowing the system to handle large documents and high loads efficiently.

### Technical Flow

1. **Generate Document** (POST `/api/legal-form/generate`):
   - Client sends HTML content with document ID
   - HTML is stored in the `UserDocument` collection with status `GENERATING`
   - A job is added to the Redis queue for PDF generation
   - The API returns immediately with a job ID for tracking

2. **PDF Generation Process** (Background Job):
   - The queue worker picks up the job
   - Puppeteer converts HTML to PDF
   - The PDF is uploaded to Google Cloud Storage
   - The document status is updated to `COMPLETED`
   - If the process fails, the status remains `GENERATING`

3. **Regenerate Document** (POST `/api/legal-form/regenerate`):
   - Used when the initial generation fails
   - Retrieves the stored HTML from the `generated_html` field in the UserDocument collection
   - Adds a new job to the queue using this stored HTML
   - The process continues as in the generation flow

4. **Download Document** (GET `/api/legal-form/download/:document_id`):
   - Verifies the document exists and is completed
   - Downloads the PDF from Google Cloud Storage
   - Returns the file with appropriate headers for download

5. **Stream Document** (GET `/api/legal-form/stream/:document_id`):
   - Similar to download but with headers for streaming
   - For mobile devices, uses `application/octet-stream` content type
   - For desktop browsers, uses `application/pdf` with inline disposition

### Document Status Flow

Documents go through the following status transitions:

- `BOOKED (0)`: Initial state when document is created
- `ON_PROGRESS (1)`: Document is being processed
- `GENERATING (2)`: HTML is stored and PDF generation is in progress
- `COMPLETED (3)`: PDF has been generated and stored
- `EXPIRED (4)`: Document generation has expired
- `CANCELLED (5)`: Document generation was cancelled

## Queue Overview

The PDF generation service uses Bull with Redis for queue management. The queue handles:

- Converting HTML to PDF using Puppeteer
- Uploading PDFs to storage (Google Cloud Storage or local filesystem)
- Updating document status in the database

## Local Storage for Development

In development mode, the service can use local filesystem storage instead of Google Cloud Storage. This makes it easier to develop and test without needing GCS credentials.

### How Local Storage Works

- When `env.app_env === 'DEV'` and no GCS project ID is provided, the service automatically uses local storage
- Files are stored in the `storage/local/` directory:
  - `storage/local/documents/` for private documents
  - `storage/local/public/` for public documents
- File URLs use the `file://` protocol (e.g., `file:///path/to/storage/local/documents/file.pdf`)
- All storage operations (upload, download, stream, etc.) work with local files

### Setting Up Local Storage

1. Make sure your `.env` file has the following settings for development:
   ```
   APP_ENVIRONMENT=DEV
   GOOGLE_CLOUD_PROJECT_ID=
   ```

2. The local storage directories will be created automatically when the service starts

3. Local storage files are ignored by git (added to `.gitignore`)

## Prerequisites

- Redis server installed and running
- Node.js (v18)
- For production: Supervisor or PM2 installed

## Running the Queue

### Local Development

1. Start Redis server:
   ```bash
   redis-server
   ```

2. Run the queue worker:
   ```bash
   # Create a script in package.json
   # "queue": "ts-node src/queue-worker.ts"
   npm run queue
   ```

3. To run the queue worker with the main application:
   ```bash
   npm run dev
   ```

### Production Environment

#### Using Supervisor

1. Install Supervisor:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install supervisor
   ```

2. Create a Supervisor configuration file:
   ```bash
   sudo nano /etc/supervisor/conf.d/selene-queue.conf
   ```

3. Add the following configuration:
   ```ini
   [program:selene-queue]
   command=node /path/to/selene/dist/queue-worker.js
   directory=/path/to/selene
   autostart=true
   autorestart=true
   startretries=3
   stderr_logfile=/var/log/selene-queue.err.log
   stdout_logfile=/var/log/selene-queue.out.log
   user=www-data
   environment=NODE_ENV=production
   ```

4. Update Supervisor:
   ```bash
   sudo supervisorctl reread
   sudo supervisorctl update
   ```

5. Control the queue worker:
   ```bash
   # Start
   sudo supervisorctl start selene-queue
   
   # Stop
   sudo supervisorctl stop selene-queue
   
   # Restart
   sudo supervisorctl restart selene-queue
   
   # Check status
   sudo supervisorctl status selene-queue
   ```

#### Using PM2

1. Install PM2:
   ```bash
   npm install -g pm2
   ```

2. Start the services:
   ```bash
   pm2 start ecosystem.config.js
   ```

3. Save the PM2 configuration:
   ```bash
   pm2 save
   ```

4. Set up PM2 to start on system boot:
   ```bash
   pm2 startup
   ```

## Monitoring the Queue

### Local Development

1. Run the monitoring script:
   ```bash
   node monitor-queue.js
   ```

2. Access the dashboard at http://localhost:3000/admin/queues

### Production Environment

1. Use Supervisor to run the monitoring dashboard:
   ```ini
   [program:selene-queue-monitor]
   command=node /path/to/selene/dist/monitor-queue.js
   directory=/path/to/selene
   autostart=true
   autorestart=true
   startretries=3
   stderr_logfile=/var/log/selene-queue-monitor.err.log
   stdout_logfile=/var/log/selene-queue-monitor.out.log
   user=www-data
   environment=NODE_ENV=production,QUEUE_ADMIN_USER=admin,QUEUE_ADMIN_PASS=secure_password
   ```

3. Set up Nginx:
   ```nginx
   server {
     listen 80;
     server_name queue-monitor.yourdomain.com;
     
     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```

## Queue Worker Files

The project includes dedicated files for queue processing:

- `src/queue-worker.ts` - The main queue worker that processes PDF generation jobs
- `src/monitor-queue.ts` - A web dashboard for monitoring the queue

These files are already set up and ready to use with the scripts defined in `package.json`.

## Troubleshooting

### Common Queue Issues

1. **Redis Connection Issues**:
   ```bash
   # Check if Redis is running
   redis-cli ping
   
   # Check Redis logs
   sudo tail -f /var/log/redis/redis-server.log
   ```

2. **Queue Processing Issues**:
   - Check worker logs:
     ```bash
     # Supervisor logs
     sudo tail -f /var/log/selene-queue.out.log
     sudo tail -f /var/log/selene-queue.err.log
     
     # PM2 logs
     pm2 logs selene-queue
     ```
   
   - Check failed jobs in Bull Board dashboard

3. **Memory Issues with Puppeteer**:
   - Increase memory allocation for the worker:
     ```ini
     # In supervisor config
     environment=NODE_ENV=production,NODE_OPTIONS=--max-old-space-size=4096
     ```
     
     ```javascript
     // In PM2 config
     env: {
       NODE_ENV: 'production',
       NODE_OPTIONS: '--max-old-space-size=4096'
     }
     ```

4. **Scaling Queue Workers**:
   - For high-volume environments, run multiple queue workers:
     ```javascript
     // In PM2 config
     {
       name: 'selene-queue',
       script: 'dist/queue-worker.js',
       instances: 4,  // Adjust based on CPU cores
       exec_mode: 'cluster'
     }
     ```
