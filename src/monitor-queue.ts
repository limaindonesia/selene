import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import Bull from 'bull';
import env from './config/envConfig';

const app = express();
const serverAdapter = new ExpressAdapter();

const pdfQueue = new Bull('pdf-generation', {
  redis: {
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
  },
});

createBullBoard({
  queues: [new BullAdapter(pdfQueue)],
  serverAdapter,
});

if (process.env.NODE_ENV === 'production') {
  app.use('/admin/queues', (req, res, next) => {
    const auth = { 
      login: process.env.QUEUE_ADMIN_USER || 'admin', 
      password: process.env.QUEUE_ADMIN_PASS || 'admin' 
    };
    
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
    
    if (login && password && login === auth.login && password === auth.password) {
      return next();
    }
    
    res.set('WWW-Authenticate', 'Basic realm="Queue Admin"');
    res.status(401).send('Authentication required');
  });
}

serverAdapter.setBasePath('/admin/queues');
app.use('/admin/queues', serverAdapter.getRouter());

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>PDF Generation Queue Monitor</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; }
          a { display: inline-block; margin-top: 20px; padding: 10px 15px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }
          a:hover { background: #45a049; }
        </style>
      </head>
      <body>
        <h1>PDF Generation Queue Monitor</h1>
        <p>This is the monitoring dashboard for the PDF generation queue.</p>
        <a href="/admin/queues">Go to Queue Dashboard</a>
      </body>
    </html>
  `);
});

const PORT = process.env.MONITOR_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Queue monitor running on port ${PORT}`);
  console.log(`Dashboard available at http://localhost:${PORT}/admin/queues`);
});
