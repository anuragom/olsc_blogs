import { Request, Response } from "express";
import Blog from "@models/Blog";
import path from "path";

const baseUrl = process.env.BASE_URL || "http://localhost:5000";
const uploadDir = process.env.UPLOAD_DIR || "uploads";


// Create Blog
export const createBlog = async (req: Request, res: Response) => {
  try {
    const { title, author } = req.body;
    if (!title || !req.body.blocks) {
      return res.status(400).json({ message: "title and blocks are required" });
    }

    // Parse blocks from JSON string
    let blocks = JSON.parse(req.body.blocks);

    const files = req.files as Express.Multer.File[] | undefined;

    // Replace placeholders with actual uploaded file URLs
    if (files && blocks) {
      files.forEach(file => {
        const fileUrl = `${baseUrl}/${uploadDir}/${file.filename}`;
        blocks = blocks.map((block: any) => {
          if (block.type === "image" && block.data.src === file.fieldname) {
            block.data.src = fileUrl;
          }
          return block;
        });
      });
    }

    const blog = await Blog.create({ title, author, blocks });
    return res.status(201).json(blog);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};


//Update Blogs
export const updateBlogById = async (req: Request, res: Response) => {
  try {
    const { title, author } = req.body;
    const blocks = req.body.blocks ? JSON.parse(req.body.blocks) : undefined;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    // Replace image placeholders with uploaded file URLs
    if (blocks && files) {
      Object.keys(files).forEach(fieldName => {
        files[fieldName].forEach(file => {
          const fileUrl = `${baseUrl}/${uploadDir}/${file.filename}`;
          blocks.forEach((block: any) => {
            if (block.type === "image" && block.data.src === fieldName) {
              block.data.src = fileUrl;
            }
          });
        });
      });
    }

    const updateData: any = { title, author };
    if (blocks) updateData.blocks = blocks;

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedBlog) return res.status(404).json({ message: "Blog not found" });

    return res.status(200).json(updatedBlog);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};


// Get All Blogs
export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;

    const blogs = await Blog.find()
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalBlogs = await Blog.countDocuments();
    return res.status(200).json({
      data: blogs,
      pagination: { page, limit, totalPages: Math.ceil(totalBlogs / limit), totalBlogs }
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// Get Single Blog
export const getBlogById = async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    return res.status(200).json(blog);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// Delete Blog
export const deleteBlogById = async (req: Request, res: Response) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) return res.status(404).json({ message: "Blog not found" });
    return res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

// Search Blogs by Title
export const searchBlogs = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || ""; // search query
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Match blogs where title contains the query string (case-insensitive)
    const filter = {
      title: { $regex: q, $options: "i" },
    };

    const totalBlogs = await Blog.countDocuments(filter);

    const blogs = await Blog.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 }); // optional: latest first

    const totalPages = Math.ceil(totalBlogs / limit);

    res.json({
      data: blogs,
      pagination: {
        page,
        limit,
        totalPages,
        totalBlogs,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};