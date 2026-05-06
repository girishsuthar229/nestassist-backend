import { Router } from "express";
import * as controller from "../controllers/logger.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";

const router = Router();

router.get("/", verifyJWT, controller.getLogs);
router.get("/event-types", verifyJWT, controller.getEventTypesOfLog);

export default router;
