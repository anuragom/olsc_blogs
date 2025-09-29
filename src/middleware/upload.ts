// import multer from "multer";
// import path from "path";
// import fs from "fs";

// const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

// if(!fs.existsSync(UPLOAD_DIR)) {
//     fs.mkdirSync(UPLOAD_DIR, {recursive:true});
// }

// const storage = multer.diskStorage({
//     destination:(_req, file, cb) =>{
//         const ext = path.extname(file.originalname);
//         const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
//         cb(null,name);
//     }
// });

// export const upload = multer({
//     storage,
//     limits:{fileSize: 5 * 1024 * 1024}
// })


import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Folder where files will be saved
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate unique file name
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
