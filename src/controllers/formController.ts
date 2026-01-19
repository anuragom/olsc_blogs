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
const SELECT_FIELDS_APPLICATION = 'type email firstName lastName contactNumber status createdAt applicationFileUrl desiredLocation city state pincode areaSqFt vehiclesOwned hasOwnSpace processingStatus';
const SELECT_FIELDS_CAREER_APPLICATION = 'firstName lastName email position totalExperience status createdAt jobId resumeUrl';
const SELECT_FIELDS_JOB = 'title location jobType company profile experienceRequired ctc vacancies qualification description responsibilities isActive createdAt';

const generateProfessionalEmail = (data: Record<string, any>, title: string) => {
  const logoUrl = "https://olscpanel.omlogistics.co.in/api/blogs/696b520889d509221f3085d5/cover"; 
  const dateNow = new Date();
  const formattedDate = dateNow.toLocaleDateString('en-GB').replace(/\//g, '-'); 

  // List of internal fields that should NEVER show up in any email
  const internalFields = [
    'processingStatus', 
    'processingError', 
    'status', 
    '_id', 
    '__v', 
    'createdAt', 
    'updatedAt',
    'type', // already handled in the title
    'resumeUrl', // usually sent as attachment, not text
    'marksheetUrl',
    'applicationFileUrl'
  ];

  return `
  <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f4f6f8; padding: 24px;">
    <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
      
      <div style="background: linear-gradient(135deg, #001F39, #084C83); padding: 30px; text-align: center; color: #ffffff;">
        <div style="background: #ffffff; display: inline-block; padding: 10px; border-radius: 8px; margin-bottom: 15px;">
           <img src="${logoUrl}" alt="OLSC Logo" style="height: 40px; display: block;" />
        </div>
        <h2 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
          OLSC PANEL
        </h2>
        <p style="margin-top: 6px; font-size: 14px; opacity: 0.9; font-weight: 600;">
          ${title}
        </p>
        <p style="margin-top: 4px; font-size: 12px; opacity: 0.7; letter-spacing: 1px;">
          DATE: ${formattedDate}
        </p>
      </div>

      <div style="padding: 28px;">
        <p style="font-size: 14px; color: #475569; margin-bottom: 20px;">
          A new submission has been recorded with the following details:
        </p>

        <div style="border: 1px solid #f1f5f9; border-radius: 8px; padding: 0 16px;">
          ${Object.entries(data)
            .filter(([key, value]) => {
              // 1. Exclude internal fields
              if (internalFields.includes(key)) return false;
              // 2. Exclude null, undefined, or empty strings
              if (value === undefined || value === null || value === "") return false;
              // 3. Prevent "undefined" as a string
              if (String(value).toLowerCase() === "undefined") return false;
              
              return true;
            })
            .map(([key, value]) => renderRow(formatLabel(key), value))
            .join("")}
        </div>
      </div>

      <div style="background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #edf2f7;">
        <strong>Om Logistics Supply Chain</strong><br />
        This is an automated email. Please do not reply to this address.
      </div>
    </div>
  </div>
  `;
};

const formatLabel = (key: string) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

const renderRow = (label: string, value: any) => {
  // Convert booleans to readable text
  let displayValue = String(value);
  if (typeof value === 'boolean') {
    displayValue = value ? "Yes" : "No";
  }

  return `
  <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid #e5e7eb; gap: 12px; font-size: 14px;">
    <span style="color: #64748b; font-weight: 600; min-width: 140px;">${label}</span>
    <span style="color: #0f172a; font-weight: 600; text-align: right; word-break: break-word;">${displayValue}</span>
  </div>
`;
};




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


    res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      data: newEnquiry
    });


    (async () => {
      const timeoutId = setTimeout(async () => {
        console.error(`Alert: Application ${newEnquiry._id} is likely stuck.`);
      }, 120000); 

    try {

       const appTitle = 'Enquiry Forms';
       const emailHtml = generateProfessionalEmail(req.body, appTitle); 

       const isSpecialService = ['bike-logistics', 'campus-logistics'].includes(serviceName);

// 2. Assign the recipient list based on that check
    const recipientList = isSpecialService 
      ? "jatin.kalra@olsc.in" 
      : "omgroup@olsc.in, monika.arora@olsc.in, customercare@olsc.in";

          await sendEmail({
          to: recipientList,
          subject: `[New Enquiry] - ${serviceName}`,
          html: emailHtml,
          attachments: emailAttachments
        });

      
      clearTimeout(timeoutId); 
    } catch (bgError: any) {
      clearTimeout(timeoutId);
      console.error("Background Processing Error:", bgError);
    }
  })();

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
      applicationFileUrl: `/uploads/applications/${file.filename}`,
      processingStatus: 'pending'
    });

    // 2. IMMEDIATELY Return response to User
    res.status(201).json({ 
      success: true, 
      message: "Application submitted and is being processed.",
      data: application 
    });

    // 3. BACKGROUND PROCESSING (Non-blocking)

    (async () => {
    // Set a timeout to detect "stuck" processes (e.g., 2 minutes)
    const timeoutId = setTimeout(async () => {
       await Application.findByIdAndUpdate(application._id, { 
         processingStatus: 'stuck',
         processingError: 'Processing exceeded 2 minutes limit' 
       });
       console.error(`Alert: Application ${application._id} is likely stuck.`);
    }, 120000); 

    try {
      // A. Compression
      const compressedPath = await compressPDF(file.path);

       const isFranchise = type === 'franchise';

       const appTitle = type === 'franchise' ? 'Franchise Partnership' : 'Retail Partner';

       const recipientList = isFranchise 
        ? "sandeep.bhaker@olsc.in, rajeev.dhama@olsc.in" 
        : "jatin.kalra@olsc.in";

       const { type: _, ...emailData } = req.body;
       const emailHtml = generateProfessionalEmail(emailData, appTitle); 

      
      // B. Email
          await sendEmail({
          to: recipientList,
          subject: `New ${appTitle} Application - ${firstName} ${lastName}`,
          html: emailHtml,
          attachments: [{
            filename: `Application_${firstName}_${lastName}.pdf`,
            path: compressedPath 
          }]
        });

      // C. Success Update
      await Application.findByIdAndUpdate(application._id, {
        applicationFileUrl: `/uploads/applications/${path.basename(compressedPath)}`,
        processingStatus: 'completed'
      });
      
      clearTimeout(timeoutId); 
    } catch (bgError: any) {
      clearTimeout(timeoutId);
      console.error("Background Processing Error:", bgError);
      await Application.findByIdAndUpdate(application._id, {
        processingStatus: 'failed',
        processingError: bgError.message
      });
    }
  })();

  } catch (error: any) {
    console.error("Application Main Error:", error);
    return res.status(500).json({ message: error.message });
  }
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
    const totalSuccesses = await Application.countDocuments({ processingStatus: 'completed' });

    const totalFailures = total - totalSuccesses;

    return res.status(200).json({
      data: applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        totalFailures: totalFailures || 0,
        totalSuccesses: totalSuccesses || 0,
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
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Resume PDF is required." });

    // Save initial record with Multer's relative path (e.g., "uploads/careers/filename.pdf")
    const newApplication = await CareerApplication.create({
      ...req.body,
      resumeUrl: file.path,
      processingStatus: 'pending' 
    });

    res.status(201).json({ 
      success: true, 
      message: "Application received. Processing file...",
      data: newApplication 
    });

    // Background compression logic
    (async () => {
      const timeoutId = setTimeout(async () => {
       await CareerApplication.findByIdAndUpdate(newApplication._id, { 
         processingStatus: 'stuck',
         processingError: 'Processing exceeded 2 minutes limit' 
       });
       console.error(`Alert: Application ${newApplication._id} is likely stuck.`);
    }, 120000); 

      try {
        // A. Compression
        const compressedPath = await compressPDF(file.path);

        const appTitle =  'Career' 
        const emailHtml = generateProfessionalEmail(req.body, appTitle); 

        // B. Email
          await sendEmail({
          to: "harsh.sharma@olsc.in , divya.singh@olsc.in, pranav.raj@olsc.in",
          subject: `New ${appTitle} Application - ${req.body.firstName} ${req.body.lastName}`,
          html: emailHtml,
          attachments: [{
            filename: `Application_${req.body.firstName}_${req.body.lastName}_Maeksheet.pdf`,
            path: compressedPath 
          }]
        });
        
        // Update DB with the new path returned by compression service
        await CareerApplication.findByIdAndUpdate(newApplication._id, {
          resumeUrl: compressedPath,
          processingStatus: 'completed'
        });
        clearTimeout(timeoutId);
      } catch (bgError: any) {
        clearTimeout(timeoutId);
        console.error("Background Processing Error:", bgError);
          await CareerApplication.findByIdAndUpdate(newApplication._id, {
          processingStatus: 'failed',
          processingError: bgError.message
        });
      }
    })();
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
    const totalSuccesses = await CareerApplication.countDocuments({ processingStatus: 'completed' });

    const totalFailures = total - totalSuccesses;

    res.status(200).json({
      success: true,
      data: applications,
      pagination: { 
        total, 
        page, 
        limit, 
        totalPages: Math.ceil(total / limit),
        totalFailures: totalFailures || 0,
        totalSuccesses: totalSuccesses || 0,
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
    const application = await CareerApplication.findById(req.params.id);
    
    if (!application || !application.resumeUrl) {
      return res.status(404).json({ message: "Application or resume record not found" });
    }

    const filename = path.basename(application.resumeUrl);
    const filePath = path.join(process.cwd(), "uploads", "careers", filename);

    if (!fs.existsSync(filePath)) {
      
      const fallbackPath = path.join(process.cwd(), "uploads", filename);
      if (fs.existsSync(fallbackPath)) {
        return res.download(fallbackPath);
      }

      return res.status(404).json({ message: "File no longer exists on the server" });
    }

    const friendlyName = `Career_App_${application.firstName}_${application.lastName}.pdf`;
    
    return res.download(filePath, friendlyName);
  } catch (err: any) {
    console.error("Download Error:", err);
    res.status(500).json({ message: "Error processing download" });
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
    console.log("Institute Application Data:", req.body);
    const file = req.file;
    if (!file) return res.status(400).json({ message: "Marksheet is required." });

    const application = await InstituteApplication.create({
      ...req.body,
      marksheetUrl: file.path,
      processingStatus: 'pending' 
    });

    res.status(201).json({ 
      success: true, 
      message: "Application submitted successfully. Processing file..." 
    });

    (async () => {
      // Set a timeout to detect "stuck" processes (e.g., 2 minutes)
      const timeoutId = setTimeout(async () => {
       await InstituteApplication.findByIdAndUpdate(application._id, { 
         processingStatus: 'stuck',
         processingError: 'Processing exceeded 2 minutes limit' 
       });
       console.error(`Alert: Application ${application._id} is likely stuck.`);
    }, 120000); 

      try {
        // A. Compression
        const compressedPath = await compressPDF(file.path);

        const appTitle = 'Institute'
        const emailHtml = generateProfessionalEmail(req.body, appTitle); 

        //B Email

        await sendEmail({
          to: "ominstitute@olsc.in, divyanshu.choudhary@olsc.in",
          subject: `[New Admission] ${req.body.fullName}`,
          html: emailHtml,
          attachments: [{
            filename: `Marksheet_${req.body.fullName}.pdf`,
            path: compressedPath 
          }]
        });
        
        await InstituteApplication.findByIdAndUpdate(application._id, {
          marksheetUrl: compressedPath,
          processingStatus: 'completed'
        });
        
        clearTimeout(timeoutId); 
        console.log(`Background processing finished for Institute app: ${application._id}`);
      } catch (bgError : any) {
        clearTimeout(timeoutId);
        console.error("Background Processing Error:", bgError);
        await InstituteApplication.findByIdAndUpdate(application._id, {
          processingStatus: 'failed',
          processingError: bgError.message
      });
      }
    })();

  } catch (error: any) {
    console.error("Institute Submission Error:", error);
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
    const totalSuccesses = await Application.countDocuments({ processingStatus: 'completed' });

    const totalFailures = total - totalSuccesses;
    res.status(200).json({ data, pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)), totalSuccesses: totalSuccesses || 0, totalFailures: totalFailures } });
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
    const application = await InstituteApplication.findById(req.params.id);
    
    if (!application || !application.marksheetUrl) {
      return res.status(404).json({ message: "Application or marksheet record not found" });
    }

    const relativePath = application.marksheetUrl.replace(/^\//, '');
    
    const filePath = path.join(process.cwd(), relativePath);

    if (!fs.existsSync(filePath)) {
      const filename = path.basename(application.marksheetUrl);
      const fallbackPath = path.join(process.cwd(), "uploads", "marksheets", filename);
      
      if (fs.existsSync(fallbackPath)) {
        return res.download(fallbackPath, `Marksheet_${application.fullName}.pdf`);
      }

      return res.status(404).json({ message: "File no longer exists on the server" });
    }

    const friendlyName = `Marksheet_${application.fullName.replace(/\s+/g, '_')}.pdf`;
    
    return res.download(filePath, friendlyName, (err) => {
      if (err) {
        console.error("Download Error:", err);
      }
    });
  } catch (err: any) {
    console.error("Internal Download Error:", err);
    res.status(500).send(err.message);
  }
};