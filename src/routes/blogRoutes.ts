import { Router } from "express";
import * as blogController from "@controllers/blogController";
import upload from "@middlewares/upload";
import { checkWriteKey } from "@middlewares/checkWriteKey";
import { authMiddleware } from "@middlewares/auth";
import Blog from "@models/Blog";

const router = Router();

router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "images", maxCount: 2 },
  ]),
  blogController.createBlog
);

router.put(
  "/:id",
  authMiddleware,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "images", maxCount: 2 },
  ]),
  blogController.updateBlogById
);

router.get("/search", blogController.searchBlogs);
router.get("/slug/:slug", blogController.getBlogBySlug);
router.get("/", blogController.getAllBlogs);
router.get("/:id", blogController.getBlogById);
router.delete("/:id", authMiddleware, blogController.deleteBlogById);

router.get("/:id/cover", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog?.coverImage) return res.status(404).send("Cover image not found");

  res.contentType(blog.coverImage.contentType);
  res.send(blog.coverImage.data);
});

// Get an image from blocks (by index)
router.get("/:id/image/:index", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  const image = blog?.images?.[parseInt(req.params.index)];
  if (!image) return res.status(404).send("Image not found");

  res.contentType(image.contentType);
  res.send(image.data);
});


export default router;
