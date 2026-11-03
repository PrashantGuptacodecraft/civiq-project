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
 * Supports standard Prometheus text format when requested via Accept: text/plain.
 */
healthRouter.get('/metrics', (req, res) => {
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/plain')) {
        res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        return res.status(200).send(metricsCollector.toPrometheusFormat());
    }

    res.status(200).json({
        status: 'ok',
        metrics: metricsCollector.getSnapshot(),
    });
});
