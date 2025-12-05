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

    // ✅ Convert cover image to buffer
    const coverFile = files?.coverImage?.[0];
    const coverImage = coverFile
      ? {
          data: fs.readFileSync(coverFile.path),
          contentType: coverFile.mimetype,
        }
      : undefined;

    // ✅ Convert extra images to buffer array
    const imageFiles = files?.images || [];
    const images = imageFiles.map((file) => ({
      data: fs.readFileSync(file.path),
      contentType: file.mimetype,
    }));

    // ✅ Embed images into block content if type = "image"
    if (blocks.length && images.length) {
      let imageIndex = 0;
      blocks = blocks.map((block) => {
        if (block.type === "image" && imageIndex < images.length) {
          block.data.image = images[imageIndex];
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
      images,
      coverImage,
    });

    return res.status(201).json({ message: "Blog created",blog });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateBlogById = async (req: AuthRequest, res: Response) => {
  try {
    const authorId = req.user?._id;
    const blogId = req.params.id;

    const existingBlog = await Blog.findById(blogId);
    if (!existingBlog) return res.status(404).json({ message: "Blog not found" });


    const { title, summary, estimatedReadTime, slug, metaTitle, metaDescription } = req.body;

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

    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

    // ✅ Convert cover image to buffer (only if new uploaded)
    let coverImage = existingBlog.coverImage;
    const coverFile = files?.coverImage?.[0];
    if (coverFile) {
      coverImage = {
        data: fs.readFileSync(coverFile.path),
        contentType: coverFile.mimetype,
      };
    }

    // ✅ Convert extra images to buffer array
    const imageFiles = files?.images || [];
    const images = imageFiles.map((file) => ({
      data: fs.readFileSync(file.path),
      contentType: file.mimetype,
    }));

    // ✅ Embed images into block content if type = "image"
    if (blocks.length && images.length) {
      let imageIndex = 0;
      blocks = blocks.map((block) => {
        if (block.type === "image" && imageIndex < images.length) {
          block.data.image = images[imageIndex];
          imageIndex++;
        }
        return block;
      });
    }

    // ✅ Handle slug uniqueness (only if changed)
    let finalSlug = slug?.trim()
      ? slugify(slug, { lower: true, strict: true })
      : slugify(title || existingBlog.title, { lower: true, strict: true });

    if (finalSlug !== existingBlog.slug) {
      let uniqueSlug = finalSlug;
      let counter = 1;
      while (await Blog.findOne({ slug: uniqueSlug, _id: { $ne: blogId } })) {
        uniqueSlug = `${finalSlug}-${counter++}`;
      }
      existingBlog.slug = uniqueSlug;
    }

    // ✅ Update all other fields safely
    // comment2
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
    return res.status(500).json({ message: err.message });
  }
};

// const SELECT_FIELDS = 'title summary coverImage categories slug createdAt author';
// export const getAllBlogs = async (req: Request, res: Response) => {
//   try {
//     // --- Pagination Setup (No Change) ---
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 10;
//     const skip = (page - 1) * limit;
//     const sortBy = (req.query.sortBy as string) || "createdAt";
//     const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;

//     // --- Optimized Data Fetching (CHANGE IS HERE) ---
//     const blogs = await Blog.find()
//       .select(SELECT_FIELDS) // ⭐ ONLY fetch the required fields for the card
//       .sort({ [sortBy]: sortOrder })
//       .skip(skip)
//       .limit(limit)
//       .populate("author")
//       .lean();

//     const totalBlogs = await Blog.countDocuments();
    
//     // --- Send Response (No Change) ---
//     return res.status(200).json({
//       data: blogs,
//       pagination: {
//         page,
//         limit,
//         totalPages: Math.ceil(totalBlogs / limit),
//         totalBlogs,
//       },
//     });
//   } catch (err: any) {
//     console.error("Error fetching paginated blogs:", err);
//     return res.status(500).json({ message: err.message });
//   }
// };

const SELECT_FIELDS = 'title summary coverImage categories slug createdAt author';

export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    // --- Pagination Setup ---
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;

    // IDs to exclude
    const excludedIds = [
      "6927dc6bd4f7d81a110cde08",
      // "6927dac2d4f7d81a110cdde3",
      "6927d150d4f7d81a110cdccc",  // the role of 
      "6927d8eed4f7d81a110cddb5", //pharma
      "6927d55bd4f7d81a110cdd4b"  // express vs ptl
    ];

    // --- Fetch Blogs (EXCLUDING those IDs) ---
    const blogs = await Blog.find({
      _id: { $nin: excludedIds }
    })
      .select(SELECT_FIELDS)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate("author")
      .lean();

    // Count only non-excluded blogs
    const totalBlogs = await Blog.countDocuments({
      _id: { $nin: excludedIds }
    });

    // --- Send Response ---
    return res.status(200).json({
      data: blogs,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalBlogs / limit),
        totalBlogs
      }
    });
  } catch (err: any) {
    console.error("Error fetching paginated blogs:", err);
    return res.status(500).json({ message: err.message });
  }
};


export const getAllSlugs = async (req: Request, res: Response) => {
  try {

    const blogs = await Blog.find()
      .select('slug') 
      .lean();
    
    return res.status(200).json({
      data: blogs,
    });
  } catch (err: any) {
    console.error("Error fetching  slugs:", err);
    return res.status(500).json({ message: err.message });
  }
};

export const getBlogById = async (req: Request, res: Response) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("author");
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    return res.status(200).json(blog);
  } catch (err: any) {
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
    res.status(500).json({ message: "Server error" });
  }
};
