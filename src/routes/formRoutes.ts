import { Router } from "express";
import * as formController from "@controllers/formController";
import { uploadLocal } from "@middlewares/upload";
import { authMiddleware } from "@middlewares/auth";

const router = Router();

router.post("/apply", uploadLocal.single("file"), formController.submitApplication);
router.get("/apply", formController.getAllApplications);
router.get("/apply/:id", formController.getApplicationById);
router.get("/apply/:id/download", formController.downloadApplicationFile);
router.delete("/apply/:id", formController.deleteApplication);
router.patch("/apply/:id/status", formController.updateApplicationStatus);

router.post("/careers", uploadLocal.single("file"), formController.submitCareerApplication);
router.get("/careers", formController.getAllCareerApplications);
router.get("/careers/:id", formController.getCareerApplicationById);
router.get("/careers/:id/download", formController.downloadCareerApplicationFile);
router.delete("/careers/:id", formController.deleteCareerApplication);
router.patch("/careers/:id/status", formController.updateCareerApplicationStatus);

router.post("/jobs", uploadLocal.single("file"), formController.postJob);
router.get("/jobs", formController.getJobs);
router.get("/jobs/:id", formController.getJobById);

router.post("/institute", uploadLocal.single("file"), formController.submitInstituteApplication);
router.get("/institute", formController.getAllInstituteApplications);
router.get("/institute/:id", formController.getInstituteApplicationById);
router.get("/institute/:id/download", formController.downloadInstituteFile);
router.patch("/institute/:id/status", formController.updateInstituteStatus);

router.post("/pickup",formController.createPickupRequest);
router.put("/pickup/:id", formController.addRemarksToPickupRequest);
router.get("/pickup", formController.getAllPickupRequests);
router.get("/pickup/:id", formController.getPickupById);
router.delete("/pickup/:id", formController.deletePickupRequest);
router.patch("/pickup/:id/status", formController.updatePickupStatus);

router.post("/", formController.createEnquiry);
router.put("/:id", formController.addRemarksToEnquiry);
// router.get("/", formController.getAllEnquiries);
router.get("/", authMiddleware, formController.getAllEnquiries);

router.get("/:id",authMiddleware, formController.getEnquiryById);
router.delete("/:id", formController.deleteEnquiry);
router.patch("/:id/status", formController.updateEnquiryStatus);

export default router;