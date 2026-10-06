const express = require('express');
const participantAuthRoutes = require('./routes/participant-auth.routes');
const correlationIdMiddleware = require('./middleware/correlation-id.middleware');
const errorHandler = require('./middleware/error-handler.middleware');

const app = express();
app.use(express.json({ type: 'application/json', limit: '100kb' }));
app.use(correlationIdMiddleware);
app.use('/api/v1/auth', participantAuthRoutes);
app.use(errorHandler);
module.exports = app;
