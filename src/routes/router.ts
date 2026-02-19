import { Router, Request, Response } from 'express';
import {
  routeTask,
  getRouterStats,
  getTaskDistribution,
  classifyTask,
  recordOutcome,
  ROUTE_RULES,
  MODEL_CAPABILITIES,
  RouteRequest
} from '../services/router';

const router = Router();

// POST /api/router - Route task to best model
router.post('/api/router', (req: Request, res: Response) => {
  try {
    const body = req.body as RouteRequest;

    if (!body || !body.context) {
      return res.status(400).json({
        error: 'Missing required field: context'
      });
    }

    const result = routeTask(body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/router - Record task outcome for learning
router.put('/api/router', (req: Request, res: Response) => {
  try {
    const { task_type, model, success } = req.body;

    if (!task_type || !model || typeof success !== 'boolean') {
      return res.status(400).json({
        error: 'Missing required fields: task_type, model, success (boolean)'
      });
    }

    recordOutcome(task_type, model, success);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/router - Handle various actions via query parameter
router.get('/api/router', (req: Request, res: Response) => {
  try {
    const action = req.query.action as string;

    switch (action) {
      case 'stats':
        // Get task distribution statistics
        const distribution = getTaskDistribution();
        res.json(distribution);
        break;

      case 'mapping':
        // Get task→model mapping (rules)
        const mapping: Record<string, string[]> = {};
        for (const [taskType, rule] of Object.entries(ROUTE_RULES)) {
          mapping[taskType] = rule.models;
        }
        res.json(mapping);
        break;

      case 'capabilities':
        // Get model capabilities
        res.json(MODEL_CAPABILITIES);
        break;

      case 'classify':
        // Classify a task based on context
        const context = req.query.context as string;
        if (!context) {
          return res.status(400).json({
            error: 'Missing required parameter: context'
          });
        }
        const taskType = classifyTask(context);
        res.json({ task_type: taskType });
        break;

      default:
        res.status(400).json({
          error: 'Invalid action. Valid actions: stats, mapping, capabilities, classify',
          usage: {
            stats: 'GET /api/router?action=stats',
            mapping: 'GET /api/router?action=mapping',
            capabilities: 'GET /api/router?action=capabilities',
            classify: 'GET /api/router?action=classify&context=...'
          }
        });
    }
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
