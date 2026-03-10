// ─── Gateway — Logger Singleton ──────────────────────────────────────
import { createLogger } from "@logicforge/logger";

const logger = createLogger({ service: "gateway" });

export default logger;
