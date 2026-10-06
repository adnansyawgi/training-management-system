const express = require('express');
const path = require('path');
const publicUiRoutes = require('./routes/public-ui.routes');
const participantAuthRoutes = require('./routes/participant-auth.routes');
const correlationIdMiddleware = require('./middleware/correlation-id.middleware');
const errorHandler = require('./middleware/error-handler.middleware');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json({ type: 'application/json', limit: '100kb' }));
app.use(correlationIdMiddleware);
app.use(express.static(path.join(__dirname, 'public')));
app.use(publicUiRoutes);
app.use('/api/v1/auth', participantAuthRoutes);
app.use(errorHandler);
module.exports = app;
