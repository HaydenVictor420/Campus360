const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { assignRequestId, httpLogger } = require('./middleware/requestLogger');
const { generalLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const externalRoutes = require('./routes/externalRoutes');

const app = express();

// 1. Trust proxy for reverse proxies / docker containers
app.set('trust proxy', 1);

// 2. Request Correlation ID
app.use(assignRequestId);

// 3. HTTP Request Logging via Morgan & Winston
app.use(httpLogger);

// 4. Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// 5. CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  config.frontendUrl,
  config.appUrl
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman, same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in development
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Api-Key']
  })
);

// 6. Body Parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 7. General Rate Limiter
app.use('/api', generalLimiter);

// 8. Static Web Assets (Frontend)
app.use(express.static(path.join(__dirname, '../public')));

// 9. Root Health / Info endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: config.appName,
    timestamp: new Date().toISOString(),
    environment: config.env
  });
});

// 10. API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/external', externalRoutes);

// 11. Catch-all for Frontend SPA routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 12. 404 & Centralized Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
