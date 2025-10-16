import { Router } from "express";
import * as blogController from "@controllers/blogController";
import upload from "@middlewares/upload";
import { checkWriteKey } from "@middlewares/checkWriteKey";

const router = Router();

router.post(
  "/",
  checkWriteKey,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  blogController.createBlog
);

router.put(
  "/:id",
  checkWriteKey,
  upload.any(),
  blogController.updateBlogById
);

router.get("/search", blogController.searchBlogs);
router.get("/", blogController.getAllBlogs);
router.get("/:id", blogController.getBlogById);
router.delete("/:id", checkWriteKey, blogController.deleteBlogById);

export default router;
