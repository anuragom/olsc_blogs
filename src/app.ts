// import express from "express";
// import cors from "cors";
// import helmet from "helmet";
// // import compression from "compression";
// import morgan from "morgan";
// import path from "path";
// import "express-async-errors";

// import blogRoutes from "@routes/blogRoutes";
// import { notFound, errorHandler } from "@middlewares/errorHandler";

// const app = express();

// // Middlewares
// app.use(helmet());
// app.use(cors());
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// // app.use(compression());
// app.use(express.json({ limit: "5mb" }));
// app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// if (process.env.NODE_ENV !== "production") {
//   app.use(morgan("dev"));
// }

// // serve uploaded files (images) statically
// const uploadDir = process.env.UPLOAD_DIR || "uploads";
// app.use(`/${uploadDir}`, express.static(path.join(process.cwd(), uploadDir)));

// // routes
// app.use("/api/blogs", blogRoutes);

// app.get("/health", (_req, res) => res.json({ status: "ok" }));

// // fallback
// app.use(notFound);
// app.use(errorHandler);

// export default app;


// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import "express-async-errors";

import blogRoutes from "@routes/blogRoutes";
import { notFound, errorHandler } from "@middlewares/errorHandler";

const app = express();

// -----------------------------
// Security and Middleware setup
// -----------------------------
app.use(
  helmet({
    crossOriginResourcePolicy: false, // allow serving images cross-origin
    crossOriginEmbedderPolicy: false, // disable CORP enforcement
  })
);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// -----------------------------
// Serve uploaded images
// -----------------------------
const uploadsPath = path.resolve(process.cwd(), "src/uploads");

app.use("/uploads", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
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

console.log("✅ Serving images from:", uploadsPath);

// -----------------------------
// Routes
// -----------------------------
app.use("/api/blogs", blogRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// -----------------------------
// Error handling
// -----------------------------
app.use(notFound);
app.use(errorHandler);

export default app;
