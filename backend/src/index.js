import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/database.js';
import childrenRouter from './routes/children.js';
import caregiversRouter from './routes/caregivers.js';
import timeEntriesRouter from './routes/timeEntries.js';
import exportRouter from './routes/export.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Initialize database
initializeDatabase();

// API Routes
app.use('/api/children', childrenRouter);
app.use('/api/caregivers', caregiversRouter);
app.use('/api/time-entries', timeEntriesRouter);
app.use('/api/export', exportRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Barnepige Timeregistrering API'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Barnepige Timeregistrering API',
        version: '1.0.0',
        endpoints: {
            children: '/api/children',
            caregivers: '/api/caregivers',
            timeEntries: '/api/time-entries',
            export: '/api/export',
            health: '/api/health'
        }
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
========================================
  Barnepige Timeregistrering API
========================================
  Server kører på: http://localhost:${PORT}
  API Endpoints:
    - GET  /api/children
    - GET  /api/caregivers
    - GET  /api/time-entries
    - GET  /api/export/time-entries
    - GET  /api/health
========================================
    `);
});
