import { Request, Response } from "express";
import Enquiry from "@models/Enquiry";
import { sendEmail } from "../utils/sendEmail";
import Application from "@models/Application";
import CareerApplication from "@models/CareerApplication";
import InstituteApplication from "@models/InstituteApplication";
import Job from "@models/Job";
import { compressPDF } from "../utils/pdfService";
import path from "path";
import fs from "fs";
import mongoose from "mongoose";

const SELECT_FIELDS_ENQUIRY = 'fullName email phone serviceName status createdAt message';
const SELECT_FIELDS_APPLICATION = 'type email firstName lastName contactNumber status createdAt applicationFileUrl desiredLocation city state pincode';
const SELECT_FIELDS_CAREER_APPLICATION = 'firstName lastName email position totalExperience status createdAt jobId resumeUrl';
const SELECT_FIELDS_JOB = 'title location jobType company profile experienceRequired ctc vacancies qualification description responsibilities isActive createdAt';

export const createEnquiry = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, query, message, serviceName } = req.body;

    if (!fullName || !email || !phone || !message || !serviceName) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    const newEnquiry = await Enquiry.create({
      fullName, email, phone, query, message, serviceName
    });
    const emailAttachments = req.file ? [{
      filename: req.file.originalname,
      path: req.file.path
    }] : null;


    const adminHtml = `
      <h2>New Website Enquiry</h2>
      <p><b>Service:</b> ${serviceName}</p>
      <p><b>User:</b> ${fullName} (${email})</p>
      <p><b>Phone:</b> ${phone}</p>
      <p><b>Message:</b> ${message}</p>
    `;

    console.log("Sending admin email");

    await sendEmail({
      to: "raghav.raj@olsc.in",
      subject: `[New Enquiry] - ${serviceName}`,
      html: adminHtml,
      attachments: emailAttachments
    })

    console.log("Admin email sent successfully");

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      data: newEnquiry
    });
  } catch (err: any) {
    console.error("Enquiry Controller Error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const getAllEnquiries = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { serviceName, status, startDate, endDate, search } = req.query;
    const query: any = {};

    if (serviceName) {
      query.serviceName = serviceName;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { fullName: { $regex: search, $options: "i" } }
      ];
    }

    if (startDate) {
      const start = new Date(startDate as string);
      const end = endDate ? new Date(endDate as string) : new Date(startDate as string);

      end.setHours(23, 59, 59, 999);

      query.createdAt = {
        $gte: start,
        $lte: end
      };
    }

    const enquiries = await Enquiry.find(query)
      .select(SELECT_FIELDS_ENQUIRY)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Enquiry.countDocuments(query);

    return res.status(200).json({
      data: enquiries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error("Fetch Enquiries Error:", err);
    return res.status(500).json({ message: err.message });
  }
};
export const updateEnquiryStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'contacted', 'resolved'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updatedEnquiry) {
      return res.status(404).json({ message: "Enquiry not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: updatedEnquiry
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
export const getEnquiryById = async (req: Request, res: Response) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) return res.status(404).json({ message: "Enquiry not found" });
    return res.status(200).json(enquiry);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
export const deleteEnquiry = async (req: Request, res: Response) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Enquiry deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

// interface S3File extends Express.Multer.File {
//   location: string;
// }

// export const submitApplication = async (req: Request, res: Response) => {
//   try {
//     const file = req.file as S3File;
//     if (!file) return res.status(400).json({ message: "PDF application is required." });

//     const {
//       type, firstName, lastName, address, city, state, 
//       contactNumber, email, desiredLocation, pincode, 
//       vehiclesOwned, hasOwnSpace, areaSqFt 
//     } = req.body;

//     // Save to MongoDB
//     const application = await Application.create({
//       type,
//       firstName,
//       lastName,
//       address,
//       city,
//       state,
//       contactNumber,
//       email,
//       desiredLocation,
//       pincode,
//       vehiclesOwned: Number(vehiclesOwned),
//       hasOwnSpace: hasOwnSpace === 'true' || hasOwnSpace === true,
//       areaSqFt: Number(areaSqFt),
//       applicationFileUrl: file.location // S3 URL
//     });

//     // Send Email
//     const emailHtml = `
//       <h3>New ${type === 'franchise' ? 'Franchise' : 'Retail Partner'} Application</h3>
//       <p><b>Name:</b> ${firstName} ${lastName}</p>
//       <p><b>Location:</b> ${desiredLocation}, ${city} (${pincode})</p>
//       <p><b>Contact:</b> ${contactNumber} | ${email}</p>
//       <p><b>Space Info:</b> ${areaSqFt} Sq Ft (Owned: ${hasOwnSpace})</p>
//       <p><b>Vehicles:</b> ${vehiclesOwned}</p>
//       <p><a href="${file.location}">View PDF on S3</a></p>
//     `;

//     await sendEmail({
//       to: "raghav.raj@olsc.in",
//       subject: `[Application] New ${type} Request`,
//       html: emailHtml,
//       attachments: [{
//         filename: file.originalname,
//         path: file.location // Nodemailer streams from URL automatically
//       }]
//     });

//     return res.status(201).json({ success: true, data: application });
//   } catch (error: any) {
//     console.error("Application Error:", error);
//     return res.status(500).json({ message: error.message });
//   }
// };

// export const submitApplication = async (req: Request, res: Response) => {
//   try {
//     const file = req.file;
//     if (!file) return res.status(400).json({ message: "PDF application is required." });

//     const {
//       type, firstName, lastName, address, city, state, 
//       contactNumber, email, desiredLocation, pincode, 
//       vehiclesOwned, hasOwnSpace, areaSqFt 
//     } = req.body;

//     const applicationFileUrl = `/uploads/applications/${file.filename}`;

//     const application = await Application.create({
//       type, firstName, lastName, address, city, state, 
//       contactNumber, email, desiredLocation, pincode, 
//       vehiclesOwned: Number(vehiclesOwned),
//       hasOwnSpace: hasOwnSpace === 'true' || hasOwnSpace === true,
//       areaSqFt: Number(areaSqFt),
//       applicationFileUrl
//     });

//     // Professional Email Template
//     const appTitle = type === 'franchise' ? 'Franchise Partnership' : 'Retail Partner';
    
//     const emailHtml = `
//       <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-top: 4px solid #0056b3;">
//         <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
//           <h2 style="color: #0056b3; margin: 0; text-transform: uppercase; letter-spacing: 1px;">New Application Received</h2>
//           <p style="margin: 5px 0 0; color: #666;">Type: <strong>${appTitle}</strong></p>
//         </div>
        
//         <div style="padding: 30px;">
//           <p style="margin-top: 0;">Hello Admin,</p>
//           <p>A new partnership application has been submitted through the website. Below are the candidate details:</p>
          
//           <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
//             <tr>
//               <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; color: #777; width: 40%;">Full Name</td>
//               <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; font-weight: bold;">${firstName} ${lastName}</td>
//             </tr>
//             <tr>
//               <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; color: #777;">Email Address</td>
//               <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;"><a href="mailto:${email}" style="color: #0056b3; text-decoration: none;">${email}</a></td>
//             </tr>
//             <tr>
//               <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; color: #777;">Phone Number</td>
//               <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${contactNumber}</td>
//             </tr>
//             <tr>
//               <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; color: #777;">Desired Location</td>
//               <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${desiredLocation}, ${city} (${pincode})</td>
//             </tr>
//             <tr>
//               <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; color: #777;">State</td>
//               <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${state}</td>
//             </tr>
//             <tr>
//               <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; color: #777;">Space Availability</td>
//               <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${areaSqFt} Sq. Ft. (${hasOwnSpace === 'true' || hasOwnSpace === true ? 'Owned' : 'Rented/Not Owned'})</td>
//             </tr>
//             <tr>
//               <td style="padding: 10px; border-bottom: 1px solid #f0f0f0; color: #777;">Vehicles Owned</td>
//               <td style="padding: 10px; border-bottom: 1px solid #f0f0f0;">${vehiclesOwned}</td>
//             </tr>
//           </table>

//           <div style="background-color: #fff9db; padding: 15px; border-radius: 5px; border: 1px solid #ffe066; margin-top: 20px;">
//             <p style="margin: 0; font-size: 14px; color: #856404;">
//               <strong>Note:</strong> The official application document is attached to this email for your review.
//             </p>
//           </div>
//         </div>

//         <div style="padding: 20px; background-color: #f8f9fa; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0;">
//           <p style="margin: 0;">This is an automated notification from the OLSC Portal.</p>
//         </div>
//       </div>
//     `;

//     await sendEmail({
//       to: "divyanshu.choudhary@olsc.in",
//       subject: `[URGENT] New ${appTitle} Application - ${firstName} ${lastName}`,
//       html: emailHtml,
//       attachments: [{
//         filename: `Application_${firstName}_${lastName}.pdf`,
//         path: file.path 
//       }]
//     });

//     return res.status(201).json({ success: true, data: application });
//   } catch (error: any) {
//     console.error("Application Error:", error);
//     return res.status(500).json({ message: error.message });
//   }
// };

export const submitApplication = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "PDF application is required." });

    const {
      type, firstName, lastName, address, city, state, 
      contactNumber, email, desiredLocation, pincode, 
      vehiclesOwned, hasOwnSpace, areaSqFt 
    } = req.body;

    // 1. Initial Database Save (using original filename for now)
    const application = await Application.create({
      type, firstName, lastName, address, city, state, 
      contactNumber, email, desiredLocation, pincode, 
      vehiclesOwned: Number(vehiclesOwned),
      hasOwnSpace: hasOwnSpace === 'true' || hasOwnSpace === true,
      areaSqFt: Number(areaSqFt),
      applicationFileUrl: `/uploads/applications/${file.filename}`
    });

    // 2. IMMEDIATELY Return response to User
    res.status(201).json({ 
      success: true, 
      message: "Application submitted and is being processed.",
      data: application 
    });

    // 3. BACKGROUND PROCESSING (Non-blocking)
    // Using an IIFE (Immediately Invoked Function Expression)
    (async () => {
      try {
        // A. Compress the PDF
        const compressedPath = await compressPDF(file.path);
        const newFilename = path.basename(compressedPath);

        // B. Update DB with new compressed filename
        await Application.findByIdAndUpdate(application._id, {
          applicationFileUrl: `/uploads/applications/${newFilename}`
        });

        // C. Prepare and Send Email
        const appTitle = type === 'franchise' ? 'Franchise Partnership' : 'Retail Partner';
        const emailHtml = generateProfessionalEmail(req.body, appTitle); // helper function below

        await sendEmail({
          to: "raghav.raj@olsc.in",
          subject: `[URGENT] New ${appTitle} Application - ${firstName} ${lastName}`,
          html: emailHtml,
          attachments: [{
            filename: `Application_${firstName}_${lastName}.pdf`,
            path: compressedPath 
          }]
        });
        
        console.log(`Background processing finished for application: ${application._id}`);
      } catch (bgError) {
        console.error("Background Processing Error:", bgError);
      }
    })();

  } catch (error: any) {
    console.error("Application Main Error:", error);
    return res.status(500).json({ message: error.message });
  }
};
const generateProfessionalEmail = (data: any, appTitle: string) => {
    return `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; border-top: 4px solid #0056b3;">
        <div style="background: #f8f9fa; padding: 20px; text-align: center;">
          <h2>New Application: ${appTitle}</h2>
        </div>
        <div style="padding: 20px;">
          <p><b>Name:</b> ${data.firstName} ${data.lastName}</p>
          <p><b>Email:</b> ${data.email}</p>
          <p><b>Phone:</b> ${data.contactNumber}</p>
          <p><b>Location:</b> ${data.desiredLocation}, ${data.city} (${data.pincode})</p>
          <p><b>Space:</b> ${data.areaSqFt} Sq. Ft.</p>
        </div>
      </div>
    `;
};
export const getAllApplications = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const { type, status, startDate, endDate, search } = req.query;
    const query: any = {};

    if (type) query.type = type;
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { contactNumber: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } }
      ];
    }

    if (startDate) {
      const start = new Date(startDate as string);
      const end = endDate ? new Date(endDate as string) : new Date(startDate as string);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const applications = await Application.find(query)
      .select(SELECT_FIELDS_APPLICATION)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Application.countDocuments(query);

    return res.status(200).json({
      data: applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });
    return res.status(200).json(application);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
export const updateApplicationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'reviewed', 'contacted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updated = await Application.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: "Application not found" });

    return res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
export const deleteApplication = async (req: Request, res: Response) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });

    const filePath = path.join(process.cwd(), application.applicationFileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Application.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Application and file deleted" });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
export const downloadApplicationFile = async (req: Request, res: Response) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) return res.status(404).json({ message: "Application not found" });

        const filePath = path.resolve(process.cwd(), application.applicationFileUrl.startsWith('/') 
            ? application.applicationFileUrl.substring(1) 
            : application.applicationFileUrl);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "File not found on server" });
        }

        const fileName = `Application_${application.firstName}_${application.lastName}.pdf`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/pdf');
        
        return res.sendFile(filePath);
    } catch (err: any) {
        return res.status(500).json({ message: err.message });
    }
};
export const submitCareerApplication = async (req: Request, res: Response) => {
  try {
    const { 
      jobId,
      firstName, lastName, mobile, email, employeeStatus, 
      position, currentCTC, expectedCTC, totalExperience, 
      immediateStart, relocation 
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Resume file is required" });
    }

    const newApplication = await CareerApplication.create({
      jobId: jobId || null,
      firstName,
      lastName,
      mobile,
      email,
      employeeStatus,
      position,
      currentCTC,
      expectedCTC,
      totalExperience,
      immediateStart,
      relocation,
      resumeUrl: req.file.filename 
    });

    const emailHtml = `
      <h3>New Career Application Received</h3>
      <p><b>Position:</b> ${position}</p>
      <p><b>Candidate:</b> ${firstName} ${lastName}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Experience:</b> ${totalExperience} Years</p>
      <p><b>Current/Expected CTC:</b> ${currentCTC} / ${expectedCTC}</p>
      <p><b>Mobile:</b> ${mobile}</p>
    `;

    sendEmail({
      to: "raghav.raj@olsc.in", 
      subject: `New Job Application: ${position} - ${firstName}`,
      html: emailHtml,
      attachments: [{
        filename: req.file.originalname,
        path: req.file.path
      }]
    }).catch(err => console.error("Career Email Error:", err));

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      applicationId: newApplication._id
    });
  } catch (err: any) {
    console.error("Career Submission Error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
export const getAllCareerApplications = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { status, position, search, startDate, endDate } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (position) query.position = position;

    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      
      // Define search conditions for String fields
      const orConditions: any[] = [
        { firstName: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        { position: searchRegex } // Added position search as well
      ];

      // Only add jobId to search if the 'search' string is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(search as string)) {
        orConditions.push({ jobId: search });
      }

      query.$or = orConditions;
    }

    if (startDate) {
      const start = new Date(startDate as string);
      const end = endDate ? new Date(endDate as string) : new Date(startDate as string);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const applications = await CareerApplication.find(query)
      .populate('jobId', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await CareerApplication.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: { 
        total, 
        page, 
        limit, 
        totalPages: Math.ceil(total / limit) 
      }
    });
  } catch (err: any) {
    console.error("Backend Filter Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getCareerApplicationById = async (req: Request, res: Response) => {
  try {
    const application = await CareerApplication.findById(req.params.id);
    if (!application) return res.status(404).json({ message: "Application not found" });
    return res.status(200).json(application);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};
export const downloadCareerApplicationFile = async (req: Request, res: Response) => {
  try {
    const app = await CareerApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: "Application not found" });

    const filePath = path.join(process.cwd(), "uploads", app.resumeUrl);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found on server" });
    }
    
    res.download(filePath, `${app.firstName}_${app.lastName}_Resume.pdf`);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
export const updateCareerApplicationStatus = async (req: Request, res: Response) => {
  try {
    const updated = await CareerApplication.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.status(200).json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const deleteCareerApplication = async (req: Request, res: Response) => {
  try {
    const app = await CareerApplication.findById(req.params.id);
    if (app) {
      const filePath = path.join(process.cwd(), "uploads", app.resumeUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath); // Delete local file
      await app.deleteOne();
    }
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const postJob = async (req: Request, res: Response) => {
  try {
    const jobData = req.body;
    const newJob = await Job.create(jobData);
    res.status(201).json({ success: true, data: newJob });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: jobs });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getJobById = async (req: Request, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.status(200).json(job);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const submitInstituteApplication = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Marksheet is required." });

    const application = await InstituteApplication.create({
      ...req.body,
      marksheetUrl: `/uploads/applications/${file.filename}`
    });

    res.status(201).json({ success: true, message: "Application submitted successfully" });

    (async () => {
      try {
        // A. Compress the PDF
        const compressedPath = await compressPDF(file.path);
        const newFilename = path.basename(compressedPath);

        // B. Update DB with new compressed filename
        await Application.findByIdAndUpdate(application._id, {
          applicationFileUrl: `/uploads/applications/${newFilename}`
        });

        // C. Prepare and Send Email
        const emailHtml = generateProfessionalEmail(req.body, "Institute Admission");

        // await sendEmail({
        //   to: "raghav.raj@olsc.in",
        //   subject: `[New Admission] ${req.body.fullName}`,
        //   html: emailHtml,
        //   attachments: [{
        //     filename: req.file!.originalname,
        //     path: compressedPath 
        //   }]
        // });
        
        console.log(`Background processing finished for application: ${application._id}`);
      } catch (bgError) {
        console.error("Background Processing Error:", bgError);
      }
    })();

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllInstituteApplications = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, status, startDate, endDate } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { contactNo: { $regex: search, $options: "i" } }
      ];
    }
    if (startDate) {
      query.createdAt = { $gte: new Date(startDate as string), $lte: endDate ? new Date(endDate as string) : new Date() };
    }

    const data = await InstituteApplication.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await InstituteApplication.countDocuments(query);
    res.status(200).json({ data, pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getInstituteApplicationById = async (req: Request, res: Response) => {
  try {
    const app = await InstituteApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: "Not found" });
    res.status(200).json(app);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateInstituteStatus = async (req: Request, res: Response) => {
    try {
      const updated = await InstituteApplication.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
      res.status(200).json({ success: true, data: updated });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
};

export const downloadInstituteFile = async (req: Request, res: Response) => {
  try {
    const app = await InstituteApplication.findById(req.params.id);
    if (!app) return res.status(404).send("File not found");
    const filePath = path.join(process.cwd(), "uploads", app.marksheetUrl);
    res.download(filePath);
  } catch (err: any) { res.status(500).send(err.message); }
};