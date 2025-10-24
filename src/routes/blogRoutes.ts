import { Router } from "express";
import * as blogController from "@controllers/blogController";
import upload from "@middlewares/upload";
import { checkWriteKey } from "@middlewares/checkWriteKey";
import { authMiddleware } from "@middlewares/auth";

const router = Router();

router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  blogController.createBlog
);

router.put(
  "/:id",
  authMiddleware,
  upload.any(),
  blogController.updateBlogById
);

router.get("/search", blogController.searchBlogs);
router.get("/slug/:slug", blogController.getBlogBySlug);
router.get("/", blogController.getAllBlogs);
router.get("/:id", blogController.getBlogById);
router.delete("/:id", authMiddleware, blogController.deleteBlogById);

export default router;
