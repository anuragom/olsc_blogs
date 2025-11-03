import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import cookieParser from "cookie-parser";
import "express-async-errors";

import blogRoutes from "@routes/blogRoutes";
import authRoutes from "@routes/authRoutes";
import { notFound, errorHandler } from "@middlewares/errorHandler";

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// const allowedOrigins = ["http://192.168.222.238:3000", "http://localhost:3001"];
const allowedOrigins = ["*"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

const uploadsPath = path.resolve(process.cwd(), "src/uploads");

app.use("/uploads", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", allowedOrigins.join(","));
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none");
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.use(
  "/uploads",
  express.static(uploadsPath, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === ".jpg" || ext === ".jpeg") {
        res.setHeader("Content-Type", "image/jpeg");
      } else if (ext === ".png") {
        res.setHeader("Content-Type", "image/png");
      } else if (ext === ".webp") {
        res.setHeader("Content-Type", "image/webp");
      }
    },
  })
);

app.use("/api/auth", authRoutes);

app.use("/api/blogs", blogRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use(notFound);
app.use(errorHandler);

export default app;

