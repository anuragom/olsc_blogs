// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import { S3Client } from "@aws-sdk/client-s3";
// import multerS3 from "multer-s3";

// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
//   },
// });

// const uploadDir = path.join(process.cwd(), "uploads");
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// const localStore = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, uploadDir),
//   filename: (_req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   },
// });

// export const uploadLocal = multer({ storage: localStore });

// export const uploadS3 = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.AWS_S3_BUCKET_NAME || '',
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     metadata: (req: any, file, cb) => {
//       cb(null, { fieldName: file.fieldname });
//     },
//     key: (req: any, file, cb) => { 
//       const type = req.body?.type || 'general';
//       const fileName = `${Date.now()}-${file.originalname}`;
//       cb(null, `applications/${type}/${fileName}`);
//     }
//   }),
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype === "application/pdf") {
//       cb(null, true);
//     } else {
//       cb(new Error("Only PDF files are allowed for applications"));
//     }
//   }
// });

// export default uploadLocal;





import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directories exist
const uploadDir = path.join(process.cwd(), "uploads");
const appsDir = path.join(uploadDir, "applications");

[uploadDir, appsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const localStore = multer.diskStorage({
  destination: (req, file, cb) => {
    // If it's an application, put it in the applications subfolder
    const isApp = req.url.includes('apply');
    cb(null, isApp ? appsDir : uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const uploadLocal = multer({ 
  storage: localStore,
  fileFilter: (req, file, cb) => {
    // Check if it's the application route to enforce PDF only
    if (req.url.includes('apply')) {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("Only PDF files are allowed for applications"));
      }
    } else {
      cb(null, true); // Allow other types for blogs
    }
  }
});

export default uploadLocal;