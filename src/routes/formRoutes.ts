import { Router } from "express";
import * as formController from "@controllers/formController";
import { uploadLocal } from "@middlewares/upload";

const router = Router();

// 1. SPECIFIC Application routes first
router.post("/apply", uploadLocal.single("file"), formController.submitApplication);
router.get("/apply", formController.getAllApplications);
router.get("/apply/:id", formController.getApplicationById);
router.get("/apply/:id/download", formController.downloadApplicationFile);
router.delete("/apply/:id", formController.deleteApplication);
router.patch("/apply/:id/status", formController.updateApplicationStatus);

// 2. SPECIFIC Enquiry routes
router.post("/", formController.createEnquiry);
router.get("/", formController.getAllEnquiries);

// 3. GENERIC ID routes last (otherwise they capture everything)
router.get("/:id", formController.getEnquiryById);
router.delete("/:id", formController.deleteEnquiry);
router.patch("/:id/status", formController.updateEnquiryStatus);

export default router;