// import multer from "multer";
// import path from "path";
// import fs from "fs";

// const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

// if (!fs.existsSync(UPLOAD_DIR)) {
//   fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     // Folder where files will be saved
//     cb(null, UPLOAD_DIR);
//   },
//   filename: (_req, file, cb) => {
//     // Generate unique file name
//     const ext = path.extname(file.originalname);
//     const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
//     cb(null, name);
//   }
// });

// export const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB
// });


import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

// Ensure upload folder exists
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

// Accept only images and videos for safety
const fileFilter = (_req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type"));
};

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter
});
