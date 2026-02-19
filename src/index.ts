import express, { Request, Response } from 'express';
import cors from 'cors';
import routerRoutes from './routes/router';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Nexus API - Predictive Task Router',
    version: '1.0.0',
    endpoints: {
      'POST /api/router': 'Route task to best model',
      'PUT /api/router': 'Record task outcome for learning',
      'GET /api/router?action=stats': 'View router statistics',
      'GET /api/router?action=mapping': 'View task→model mapping',
      'GET /api/router?action=capabilities': 'View model capabilities',
      'GET /api/router?action=classify&context=...': 'Classify task type'
    }
  });
});

// Routes
app.use(routerRoutes);

// Error handler
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, _next: unknown) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Nexus API running on http://localhost:${PORT}`);
});
