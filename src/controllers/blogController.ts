import { Request, Response } from "express";
import Blog from "@models/Blog";
import path from "path";
import fs from "fs";
import slugify from "slugify";
import { AuthRequest } from "@middlewares/auth";
import { Types } from "mongoose";

const uploadDir = process.env.UPLOAD_DIR || "uploads";

export const createBlog = async (req: AuthRequest, res: Response) => {
  try {
    const authorId = req.user?._id;
    const uploadPath = path.join(process.cwd(), "src", uploadDir);
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

    const { title, summary, estimatedReadTime, slug, metaTitle, metaDescription } = req.body;
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

    let finalSlug = slug?.trim()
      ? slugify(slug, { lower: true, strict: true })
      : slugify(title, { lower: true, strict: true });

    // ensure uniqueness
    let uniqueSlug = finalSlug;
    let counter = 1;
    while (await Blog.findOne({ slug: uniqueSlug })) {
      uniqueSlug = `${finalSlug}-${counter++}`;
    }


    const blog = await Blog.create({
      title,
      slug: uniqueSlug,
      metaTitle,
      metaDescription,
      summary,
      author: authorId,
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


export const updateBlogById = async (req: AuthRequest, res: Response) => {
  try {
    const authorId = req.user?._id;
    const blogId = req.params.id;
    const existingBlog = await Blog.findById(blogId);
    if (!existingBlog) return res.status(404).json({ message: "Blog not found" });

    const { title, summary, estimatedReadTime, slug, metaTitle, metaDescription, } = req.body;

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

    let finalSlug = slug?.trim()
      ? slugify(slug, { lower: true, strict: true })
      : slugify(title || existingBlog.title, { lower: true, strict: true });

    // Ensure uniqueness only if slug changed
    if (finalSlug !== existingBlog.slug) {
      let uniqueSlug = finalSlug;
      let counter = 1;
      while (await Blog.findOne({ slug: uniqueSlug, _id: { $ne: blogId } })) {
        uniqueSlug = `${finalSlug}-${counter++}`;
      }
      existingBlog.slug = uniqueSlug;
    }

    // ✅ Update fields safely
    existingBlog.title = title || existingBlog.title;
    existingBlog.summary = summary || existingBlog.summary;
    existingBlog.author = authorId ? new Types.ObjectId(authorId) : existingBlog.author;
    existingBlog.estimatedReadTime = estimatedReadTime || existingBlog.estimatedReadTime;
    existingBlog.metaTitle = metaTitle || existingBlog.metaTitle;
    existingBlog.metaDescription = metaDescription || existingBlog.metaDescription;
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
      .populate("author")
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
    const blog = await Blog.findById(req.params.id).populate("author");
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

// get Blog by slug
export const getBlogBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Find by slug instead of ID
    const blog = await Blog.findOne({ slug }).populate("author");

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    return res.status(200).json(blog);
  } catch (err: any) {
    console.error("❌ Error fetching blog by slug:", err);
    return res.status(500).json({ message: err.message });
  }
};


export const searchBlogs = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const filter: any = {
      $or: [
        { title: { $regex: q, $options: "i" } },
        { "author.fullName": { $regex: q, $options: "i" } }, // after populating author
        { categories: { $in: [new RegExp(q, "i")] } }, // match array elements
      ],
    };

    const totalBlogs = await Blog.countDocuments(filter);

    const blogs = await Blog.find()
      .populate("author") // populate author document
      .or([
        { title: { $regex: q, $options: "i" } },
        { "author.fullName": { $regex: q, $options: "i" } },
        { categories: { $in: [new RegExp(q, "i")] } },
      ])
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
