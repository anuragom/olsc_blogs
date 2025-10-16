import { Request, Response } from "express";
import Blog from "@models/Blog";
import path from "path";
import { markdownToBlocks } from "@utils/markdownToBlocks";
import fs from "fs";

const uploadDir = process.env.UPLOAD_DIR || "uploads";

export const createBlog = async (req: Request, res: Response) => {
  try {
    const uploadPath = path.join(process.cwd(), "src", uploadDir);
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

    const { title, summary, author, estimatedReadTime } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const safeParse = <T>(input: any, fallback: T): T => {
      if (!input) return fallback;
      try {
        return typeof input === "string" ? JSON.parse(input) : input;
      } catch {
        return fallback;
      }
    };

    const tags = safeParse<string[]>(req.body.tags, []);
    const categories = safeParse<string[]>(req.body.categories, []);
    const faqs = safeParse<{ question: string; answer: string }[]>(req.body.faqs, []);
    let blocks = safeParse<any[]>(req.body.blocks, []);


    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const dynamicBaseUrl = `${req.protocol}://${req.get("host")}`;

    const coverImage =
      files?.coverImage?.[0]
        ? `${dynamicBaseUrl}/uploads/${files.coverImage[0].filename}`
        : "";

    if (blocks.length && files?.images?.length) {
      let imageIndex = 0;
      blocks = blocks.map((block) => {
        if (block.type === "image" && imageIndex < files.images.length) {
          block.data.url = `${dynamicBaseUrl}/uploads/${files.images[imageIndex].filename}`;
          delete block.data.src;
          imageIndex++;
        }
        return block;
      });
    }

    const blog = await Blog.create({
      title,
      summary,
      author,
      tags,
      categories,
      faqs,
      estimatedReadTime,
      blocks,
      coverImage,
    });

    return res.status(201).json({ message: "Blog created", blog });
  } catch (err: any) {
    console.error("❌ Error in createBlog:", err);
    return res.status(500).json({ message: err.message });
  }
};


export const updateBlogById = async (req: Request, res: Response) => {
  try {
    const blogId = req.params.id;
    const existingBlog = await Blog.findById(blogId);
    if (!existingBlog) return res.status(404).json({ message: "Blog not found" });

    const { title, summary, author, estimatedReadTime } = req.body;

    // ✅ Safe JSON parser utility
    const safeParse = <T>(input: any, fallback: T): T => {
      if (!input) return fallback;
      try {
        return typeof input === "string" ? JSON.parse(input) : input;
      } catch {
        return fallback;
      }
    };

    const tags = safeParse<string[]>(req.body.tags, existingBlog.tags || []);
    const categories = safeParse<string[]>(req.body.categories, existingBlog.categories || []);
    const faqs = safeParse<{ question: string; answer: string }[]>(req.body.faqs, existingBlog.faqs || []);
    let blocks = safeParse<any[]>(req.body.blocks, existingBlog.blocks || []);

    const files = req.files as Express.Multer.File[] | undefined;
    const dynamicBaseUrl = `${req.protocol}://${req.get("host")}`;

    // ✅ Handle cover image update (supports upload.any())
    let coverImage = existingBlog.coverImage;
    if (files && files.length) {
      const coverFile = files.find((f) => f.fieldname === "coverImage");
      if (coverFile) {
        coverImage = `${dynamicBaseUrl}/uploads/${coverFile.filename}`;
      }
    }

    // ✅ Handle image updates in blocks
    const imageFiles = files?.filter((f) => f.fieldname === "images") || [];
    if (blocks.length && imageFiles.length) {
      let imageIndex = 0;
      blocks = blocks.map((block) => {
        if (block.type === "image" && imageIndex < imageFiles.length) {
          block.data.url = `${dynamicBaseUrl}/uploads/${imageFiles[imageIndex].filename}`;
          delete block.data.src;
          imageIndex++;
        }
        return block;
      });
    }

    // ✅ Update fields safely
    existingBlog.title = title || existingBlog.title;
    existingBlog.summary = summary || existingBlog.summary;
    existingBlog.author = author || existingBlog.author;
    existingBlog.estimatedReadTime = estimatedReadTime || existingBlog.estimatedReadTime;
    existingBlog.blocks = blocks;
    existingBlog.coverImage = coverImage;
    existingBlog.tags = tags;
    existingBlog.categories = categories;
    existingBlog.faqs = faqs;

    await existingBlog.save();

    return res.status(200).json({
      message: "Blog updated successfully",
      blog: existingBlog,
    });
  } catch (err: any) {
    console.error("❌ Error updating blog:", err);
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

// Search Blogs
export const searchBlogs = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filter = { title: { $regex: q, $options: "i" } };

    const totalBlogs = await Blog.countDocuments(filter);
    const blogs = await Blog.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      data: blogs,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalBlogs / limit),
        totalBlogs,
      },
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};




// [
//   {"type":"heading","data":{"text":"Hello World","level":1}},
//   {"type":"image","data":{"src":"image1"}},
//   {"type":"image","data":{"src":"image2"}},
//   {"type":"list","data":{"style":"unordered","items": ["Apples", "Bananas", "Oranges"]}},
//   {"type":"heading","data":{"text":"This is for heading level 2 test","level":2}},
//   {"type":"paragraph","data":{"text":"paragraph one just for testing the blocks are working properly in this blog schema or not?"}},
//   {"type":"list","data":{"style":"ordered","items": ["First step", "Second step", "Third step"]}},
//   {"type":"paragraph","data":{"text":"India's ambitious 'Make In India' initiative aims to transform the nation into a global manufacturing hub, boosting domestic production, creating jobs and reducing reliance on imports. In the critical container manufacturing industry, Transafe stands as a prime example of this vision in action."}},
//   {"type":"table","data":{"content":[["Name","Age","Country"],["Raghav","22","India"],["Taskiya","21","India"]]}}
// ]