import { Router } from "express";
import * as configurationController from "../controllers/configuration.controller";

const router = Router();

/**
 * Configuration Routes
 * Base path: /api/configurations
 */

// Get all configurations
router.get("/", configurationController.getAll);

// Get configuration by configKey
router.get("/key/:key", configurationController.getByKey);

// Update configuration value only
router.put("/:id", configurationController.updateValue);

export default router;
