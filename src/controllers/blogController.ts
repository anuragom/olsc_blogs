import { Request, Response } from "express";
import Blog from "@models/Blog";

const baseUrl = process.env.BASE_URL || "http://localhost:5000";
const uploadDir = process.env.UPLOAD_DIR || "uploads";

export const createBlog = async (req: Request, res: Response) => {
  try {
    const { title, content, author, videoUrls } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "title and content are required" });
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    } | undefined;

    let coverImageUrl: string | undefined;
    const imageUrls: string[] = [];

    if (files) {
      if (files.coverImage && files.coverImage.length > 0) {
        coverImageUrl = `${baseUrl}/${uploadDir}/${files.coverImage[0].filename}`;
      }

      if (files.images && files.images.length > 0) {
        files.images.forEach(file => {
          imageUrls.push(`${baseUrl}/${uploadDir}/${file.filename}`);
        });
      }
    }

    const blog = await Blog.create({
      title,
      content,
      author,
      coverImage: coverImageUrl,
      images: imageUrls,
      videoUrls: videoUrls ? (Array.isArray(videoUrls) ? videoUrls : [videoUrls]) : []
    });

    return res.status(201).json(blog);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};


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
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalBlogs / limit),
        totalBlogs,
      },
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

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

export const updateBlogById = async (req: Request, res: Response) => {
  try {
    const { title, content, author, videoUrls } = req.body;

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    } | undefined;

    const updateData: any = { title, content, author };

    if (videoUrls) {
      updateData.videoUrls = Array.isArray(videoUrls) ? videoUrls : [videoUrls];
    }

    if (files) {
      const baseUrl = process.env.BASE_URL || "http://localhost:5000";
      const uploadDir = process.env.UPLOAD_DIR || "uploads";

      if (files.coverImage && files.coverImage.length > 0) {
        updateData.coverImage = `${baseUrl}/${uploadDir}/${files.coverImage[0].filename}`;
      }

      if (files.images && files.images.length > 0) {
        updateData.images = files.images.map(file => `${baseUrl}/${uploadDir}/${file.filename}`);
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedBlog) return res.status(404).json({ message: "Blog not found" });

    return res.status(200).json(updatedBlog);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
};

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






