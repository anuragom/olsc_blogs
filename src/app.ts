import express from "express";
import cors from "cors";
import helmet from "helmet";
// import compression from "compression";
import morgan from "morgan";
import path from "path";
import "express-async-errors";

import blogRoutes from "@routes/blogRoutes";
import { notFound, errorHandler } from "@middlewares/errorHandler";

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
// app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// serve uploaded files (images) statically
const uploadDir = process.env.UPLOAD_DIR || "uploads";
app.use(`/${uploadDir}`, express.static(path.join(process.cwd(), uploadDir)));

// routes
app.use("/api/blogs", blogRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// fallback
app.use(notFound);
app.use(errorHandler);

export default app;
