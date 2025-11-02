import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { seedRules } from "./seed-data";
import { RuleEngine } from "./services/ruleEngine";
import { createRoutes } from "./routes";
import { getPort, getCorsOptions, JSON_LIMIT } from "./config/server.config";

// Load environment variables from the project root first, then allow local overrides in server/.env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

app.use(cors(getCorsOptions()));
app.use(express.json({ limit: JSON_LIMIT }));

// Initialize rule engine with seed data
const ruleEngine = new RuleEngine();
let currentRules = [...seedRules]; // In production, load from database

// Mount all routes
app.use(createRoutes(currentRules, ruleEngine));

const port = getPort();
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
