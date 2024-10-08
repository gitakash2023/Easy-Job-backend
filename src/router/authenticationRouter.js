import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  loginUser,
  verifyOtp,
  signUp,
  uploadImage,
  getUserProfile,
  getAllBlokedSeekerUser,
  getjobProviderprofile,
  editJobProviderAndSeeker,
  getQuarterWiseUserData,
  getAllSeekerUser,
  getAllProviderUser,
  getallUserData,
  getAllProvider,
  sentEmail,
} from "../controllers/AuthenticationController.js";
import verifyAuthToken from "../middileware/JwtVerify.js";
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

const userRouter = Router();

userRouter.post("/", loginUser);
userRouter.post("/verify-otp", verifyOtp);
userRouter.post("/upload", uploadImage);
// userRouter.post('/upload',  upload.single('image'), uploadImage);
userRouter.post("/signUp/:id", signUp);
userRouter.get("/get-user-profile", verifyAuthToken, getUserProfile);
userRouter.get(
  "/get-job-provider-profile",
  verifyAuthToken,
  getjobProviderprofile
);
userRouter.put(
  "/update-user-profile",
  verifyAuthToken,
  editJobProviderAndSeeker
);
userRouter.get("/get-all-seeker", getAllSeekerUser);
userRouter.get("/get-all-provider", getAllProviderUser);
userRouter.get("/get-all-blocked-users", getAllBlokedSeekerUser);
userRouter.get("/get-user-data-quarter-wise", getQuarterWiseUserData);
userRouter.get("/get-all-user-data",getallUserData)
userRouter.get("/get-all-provider",getAllProvider)
userRouter.post("/sent-email", sentEmail);
export default userRouter;
