// import multer from "multer";
// import path from "path";
// import fs from "fs";

// // Ensure upload directories exist
// const uploadDir = path.join(process.cwd(), "uploads");
// const appsDir = path.join(uploadDir, "applications");
// const careerDir = path.join(uploadDir, "careers");

// [uploadDir, appsDir, careerDir].forEach(dir => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }
// });

// const localStore = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // If it's an application, put it in the applications subfolder
//     const isApp = req.url.includes('apply');
//     cb(null, isApp ? appsDir : uploadDir);
//   },
//   filename: (_req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   },
// });

// export const uploadLocal = multer({ 
//   storage: localStore,
//   fileFilter: (req, file, cb) => {
//     // Check if it's the application route to enforce PDF only
//     if (req.url.includes('apply')) {
//       if (file.mimetype === "application/pdf") {
//         cb(null, true);
//       } else {
//         cb(new Error("Only PDF files are allowed for applications"));
//       }
//     } else {
//       cb(null, true); // Allow other types for blogs
//     }
//   }
// });

// export default uploadLocal;



import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
const appsDir = path.join(uploadDir, "applications");
const careerDir = path.join(uploadDir, "careers");
const insDir = path.join(uploadDir, "marksheets");

[uploadDir, appsDir, careerDir, insDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const localStore = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.url.includes('apply')) {
      return cb(null, appsDir);
    }
    if (req.url.includes('careers')) {
      return cb(null, careerDir);
    }
    if (req.url.includes('institute')) {
      return cb(null, insDir);
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const uploadLocal = multer({ 
  storage: localStore,
  fileFilter: (req, file, cb) => {
    console.log("Upload Route-------------------------------:", req.url);
    const isPdfRoute = req.url.includes('apply') || req.url.includes('careers') || req.url.includes('institute');
    
    if (isPdfRoute) {
      if (file.mimetype === "application/pdf") {
        cb(null, true);
      } else {
        cb(new Error("Only PDF files are allowed for this submission"));
      }
    } else {
      cb(null, true); 
    }
  }
});

export default uploadLocal;