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

    const { title, summary, estimatedReadTime, slug, metaTitle, metaDescription,website } = req.body;
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
      website
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

    let coverImage = existingBlog.coverImage;
    const coverFile = files?.coverImage?.[0];
    if (coverFile) {
      coverImage = {
        data: fs.readFileSync(coverFile.path),
        contentType: coverFile.mimetype,
      };
    }

    const imageFiles = files?.images || [];
    const images = imageFiles.map((file) => ({
      data: fs.readFileSync(file.path),
      contentType: file.mimetype,
    }));

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
      : slugify(title || existingBlog.title, { lower: true, strict: true });

    if (finalSlug !== existingBlog.slug) {
      let uniqueSlug = finalSlug;
      let counter = 1;
      while (await Blog.findOne({ slug: uniqueSlug, _id: { $ne: blogId } })) {
        uniqueSlug = `${finalSlug}-${counter++}`;
      }
      existingBlog.slug = uniqueSlug;
    }

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

// const SELECT_FIELDS = 'title summary coverImage categories slug createdAt author website isPublished';
// export const getAllBlogs = async (req: Request, res: Response) => {
//   try {
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 10;
//     const website = req.query.website as string || "sanjvik";
//     const skip = (page - 1) * limit;
//     const sortBy = (req.query.sortBy as string) || "createdAt";
//     const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;

//     const query: any = {};
    
//     if (website && (website === 'omlogistics' || website === 'sanjvik')) {
//       query.website = website;
//     }

//     const blogs = await Blog.find(query)
//       .select(SELECT_FIELDS)
//       .sort({ [sortBy]: sortOrder })
//       .skip(skip)
//       .limit(limit)
//       .populate("author")
//       .lean();

//     const totalBlogs = await Blog.countDocuments();
    
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

const SELECT_FIELDS = 'title summary coverImage categories slug createdAt author website isPublished';

export const getAllBlogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const website = req.query.website as string || "sanjvik";
    const statusFilter = req.query.status as string; 
    const skip = (page - 1) * limit;
    const sortBy = (req.query.sortBy as string) || "createdAt";
    const sortOrder = (req.query.sortOrder as string) === "asc" ? 1 : -1;

    const query: any = {};
    
    if (website && (website === 'omlogistics' || website === 'sanjvik')) {
      query.website = website;
    }

    if (statusFilter) {
      if (statusFilter === 'published') {
        query.isPublished = true;
      } else if (statusFilter === 'draft') {
        query.isPublished = false;
      }
    }

    const blogs = await Blog.find(query) 
      .select(SELECT_FIELDS)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate("author")
      .lean();

    const totalBlogs = await Blog.countDocuments(query); 
    
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

export const deleteBlogById = async (req: Request, res: Response) => {
  try {
    const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
    if (!deletedBlog) return res.status(404).json({ message: "Blog not found" });
    return res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

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
    const website = req.query.website as string;

    const searchConditions = {
      $or: [
        { title: { $regex: q, $options: "i" } },
        { "author.fullName": { $regex: q, $options: "i" } },
        { categories: { $in: [new RegExp(q, "i")] } },
      ],
    };

    const websiteFilter: any = {};
    if (website && (website === 'omlogistics' || website === 'sanjvik')) {
      websiteFilter.website = website;
    }
    
    const finalFilter = {
      $and: [
        websiteFilter,
        searchConditions, 
      ]
    };
    
    
    // Total Count
    const totalBlogs = await Blog.countDocuments(finalFilter); 

    // Fetch Blogs
    const blogs = await Blog.find(finalFilter) 
      .populate("author") 
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
    console.error("Error searching blogs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleBlogPublishStatus = async (req: Request, res: Response) => {
  try {
    const blogId = req.params.id;
    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      [
        {
          $set: {
            isPublished: { $not: "$isPublished" } 
          }
        }
      ],
      { new: true }
    ).lean();

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    const statusMessage = updatedBlog.isPublished ? "published" : "unpublished";

    return res.status(200).json({
      message: `Blog successfully ${statusMessage}`,
      blog: updatedBlog,
    });
  } catch (err: any) {
    console.error("Error toggling blog status:", err);
    return res.status(500).json({ message: err.message });
  }
};