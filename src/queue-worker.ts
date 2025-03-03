import { pdfQueue } from './services/QueueService';

console.log('PDF generation queue worker started');
console.log('Queue name:', pdfQueue.name);
console.log('Queue is ready to process jobs');

process.on('SIGTERM', async () => {
  console.log('Worker process shutting down');
  await pdfQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Worker process interrupted');
  await pdfQueue.close();
  process.exit(0);
});
