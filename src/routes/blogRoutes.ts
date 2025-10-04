// import { Router } from "express";
// import * as blogController from "@controllers/blogController";
// import { upload } from "@middlewares/upload";

// const router = Router();

// router.post(
//     "/",
//     upload.fields([
//     {name: "coverImage",maxCount:1},
//     {name: "images",maxCount:10}
// ]),
// blogController.createBlog
// );

// router.get(
//     "/",
// blogController.getAllBlogs
// );

// router.get("/:id", blogController.getBlogById);

// router.put(
//   "/:id",
//   upload.fields([
//     { name: "coverImage", maxCount: 1 },
//     { name: "images", maxCount: 10 }
//   ]),
//   blogController.updateBlogById
// );

// router.delete("/:id", blogController.deleteBlogById);


// export default router;

import { Router } from "express";
import * as blogController from "@controllers/blogController";
import { upload } from "@middlewares/upload";
import { checkWriteKey } from "@middlewares/checkWriteKey";

const router = Router();

router.post(
  "/",
  checkWriteKey,
  upload.any(),
  blogController.createBlog
);

router.get("/search", blogController.searchBlogs);

router.put(
  "/:id",
  checkWriteKey,
  upload.any(),
  blogController.updateBlogById
);

router.delete("/:id", checkWriteKey, blogController.deleteBlogById);

router.get("/", blogController.getAllBlogs);
router.get("/:id", blogController.getBlogById);


export default router;
