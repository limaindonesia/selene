console.log('PDF generation queue worker started');

process.on('SIGTERM', async () => {
  console.log('Worker process shutting down');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Worker process interrupted');
  process.exit(0);
});
