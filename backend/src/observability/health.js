import { Router } from 'express';
import { metricsCollector } from './metrics.js';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

healthRouter.get('/ready', (req, res) => {
    res.status(200).json({ status: 'ready' });
});

/**
 * GET /metrics
 * Returns real-time SRE metrics including API/AI latencies, backlogs, queue ages, and circuit status.
 */
healthRouter.get('/metrics', (req, res) => {
    res.status(200).json({
        status: 'ok',
        metrics: metricsCollector.getSnapshot(),
    });
});
