import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import routes from './routes/index';
import { errorHandler } from './middlewares/error.middleware';
import stripeWebhookRoutes from './routes/stripeWebhook.routes';
import razorpayWebhookRoutes from './routes/razorpayWebhook.routes';
import { getApiRateLimiter } from './middlewares/rateLimit.middleware';
import { sendResponse } from './utils/response.util';
import swaggerSpec from './configs/swagger';
import swaggerUi from 'swagger-ui-express';

const app: Application = express();

// Global Middleware
app.use("/api/webhook", stripeWebhookRoutes);
app.use("/api/webhook", razorpayWebhookRoutes);
app.use(express.json());       // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cors());               // Enable Cross-Origin Resource Sharing
app.use(helmet());             // Secure HTTP headers
app.use(compression());        // Compress response bodies
app.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    "Surrogate-Control": "no-store",
  });
  next();
}); // Disable client-side caching for all responses
app.use(getApiRateLimiter);    // Common rate limit for all GET /api/*

// Health Check Route
app.get("/api/health", (req: Request, res: Response) => {
  return sendResponse(res, "Backend running 🚀", { timestamp: new Date().toISOString() });
});

// ----------------------
// API Routes
// ----------------------
app.use("/api", routes);                        // <-- All module routes prefixed with /api
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// ----------------------
// Global Error Handler
// ----------------------
app.use(errorHandler); 

export default app;