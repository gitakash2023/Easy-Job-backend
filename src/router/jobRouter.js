import { Router } from "express";
import verifyAuthToken from "../middileware/JwtVerify.js";
import multer from "multer";
import {
  createJobProFile,
  createJobProfileFromAdmin,
  blockCompany,
  applyJobs,
  uploadPDF,
  getUsersDataApplyForJobs,
  deleteJobProfile,
  createCompanyProfile,
  getJobListProfile,
  getListOfJobsOfJobProvider,
  editJobProfileFromAdmin,
  createContactUs,
  deleteProfile,
  getAllBlockCompany,
  unBlockCompany,
  blockUser,
  getContactUs,
  getAppliedJobs,
  createJobSubCategoryOnTheBasisOfCategory,
  createJobCategory,
  getJobCategories,
  getJobSubCategoriesByCategories,
  addFavouratesJob,
  listOfLikedJobs,
  getAllJobsOfLoginUser,
  getAllJobSubCategories,
  deleteJobSubCategory,
  delteJobCategories,
  editJobCategories,
  editJobSubCategories,
  deleteAppliedJob,
  updateStatusOfJobProfiles,
  getCompleteJobListProfile,
  reUpdateStatusOfJobProfiles,
  getAllAppliedJobProfiles,
  getPopularJobs
} from "../controllers/JobController.js";
const jobRouter = Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });
jobRouter.post("/user-job-profile", verifyAuthToken, createJobProFile);
jobRouter.post("/create-company-profile/:id", createCompanyProfile);
jobRouter.post(
  "/job-profile-provider",
  verifyAuthToken,
  createJobProfileFromAdmin
);
jobRouter.get("/get-job-profiles", getJobListProfile);
jobRouter.get("/get-complete-job-profiles", getCompleteJobListProfile);
jobRouter.get("/get-all-applied-job-profiles",getAllAppliedJobProfiles);
jobRouter.get(
  "/get-list-of-jobs-of-job-providers",
  verifyAuthToken,
  getListOfJobsOfJobProvider
);
jobRouter.get("/get-contact",getContactUs)
jobRouter.put("/edit-job-profile", verifyAuthToken, editJobProfileFromAdmin);
jobRouter.delete("/delete-job-profile", verifyAuthToken, deleteJobProfile);
jobRouter.post("/create-contactUs", verifyAuthToken, createContactUs);
jobRouter.delete("/delete-user-profile", verifyAuthToken, deleteProfile);
jobRouter.post("/user-apply-jobs", verifyAuthToken, applyJobs);
jobRouter.post("/upload-pdf", uploadPDF);
jobRouter.get(
  "/get-user-apply-jobs",
  verifyAuthToken,
  getUsersDataApplyForJobs
);
jobRouter.put("/update-job-profile-status",updateStatusOfJobProfiles)
jobRouter.put("/re-update-job-profile-status",reUpdateStatusOfJobProfiles)
jobRouter.put("/block-company", blockCompany);
jobRouter.get("/get-block-company",getAllBlockCompany)
jobRouter.put("/unblock-company",unBlockCompany)
jobRouter.put("/block-unblock-user",blockUser)
jobRouter.post("/create-job-category",createJobCategory)
jobRouter.post("/create-job-sub-category",createJobSubCategoryOnTheBasisOfCategory)
jobRouter.get("/get-job-category",verifyAuthToken,getJobCategories);
jobRouter.get("/get-category",getJobCategories);
jobRouter.get("/get-sub-category",getAllJobSubCategories);
jobRouter.get("/get-sub-category-on-the-basis-of-categories",verifyAuthToken,getJobSubCategoriesByCategories);
jobRouter.get("/get-all-applied-jobs",verifyAuthToken,getAppliedJobs)
jobRouter.post("/like-unlike-jobProfile",verifyAuthToken,addFavouratesJob)
jobRouter.get("/list-Liked-jobs",verifyAuthToken,listOfLikedJobs)
jobRouter.get("/get-All-jobs",verifyAuthToken,getAllJobsOfLoginUser)
jobRouter.put("/edit-subCategories",editJobSubCategories)
jobRouter.put("/edit-Categories",editJobCategories)
jobRouter.delete("/delete-subCategories",deleteJobSubCategory)
jobRouter.delete("/delete-Categories",delteJobCategories)
jobRouter.delete("/delete-applied-jobs",verifyAuthToken,deleteAppliedJob)
jobRouter.get("/get-popular-jobs",verifyAuthToken,getPopularJobs)

export default jobRouter;

