import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import {
  handleSuccess,
  handleFail,
  handleError,
} from "../responseHandler/response.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { s3Client } from "../helpers/AwsConfig.js";
import { jobConstant } from "../constants/jobConstant.js";
import JobProfile from "../schema/jobProfileSchema.js";
import statusCode from "../constants/statusCode.js";
import User from "../schema/userSchema.js";
import JobCategory from "../schema/jobCategorySchema.js";
import JobSubCategory from "../schema/jobSubCategorySchema.js";
import ContactUs from "../schema/contactUsSchema.js";
import ApplyJobs from "../schema/appliedJobSchema.js";
import favouratesJobSchema from "../schema/favouratesJobSchema.js";
export const createJobProFile = async (req, res) => {
  try {
    const userId = req.user;
    const userOId = new mongoose.Types.ObjectId(userId);
    const {
      jobType,
      subCategory,
      experience,
      education,
      skills,
      currentSalary,
      information,
      expectedSalary,
      availability,
    } = req.body;
    const skillsArray = Array.isArray(req.body.skills)
      ? req.body.skills
      : [req.body.skills];
    const requiredFields = [
      "jobType",
      "experience",
      "education",
      "skills",
      "currentSalary",
      "information",
      "availability",
      "expectedSalary",
    ];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return handleFail(
          res,
          `${field} is required.`,
          statusCode?.BAD_REQUEST
        );
      }
    }
    const createJob = await User.findOneAndUpdate(
      { _id: userId },
      {
        jobType,
        subCategory,
        experience,
        education,
        skills: skillsArray,
        currentSalary,
        information,
        availability,
        expectedSalary,
        userId: userOId,
      },
      { new: true }
    );
    if (createJob) {
      const messages = jobConstant?.JOB_PROFILE_CREATED;
      return handleSuccess(res, createJob, messages, statusCode?.OK);
    } else {
      return handleFail(res, jobConstant?.JOB_PROFILE_CREATION_FAIL);
    }
  } catch (error) {
    return handleFail(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const createCompanyProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const userOId = new mongoose.Types.ObjectId(userId);
    const {
      companyLogo,
      companyName,
      companyEmail,
      companyAddress,
      companyInformation,
      userType,
    } = req.body;
    const requiredFields = [
      "companyLogo",
      "companyName",
      "companyEmail",
      "companyAddress",
      "companyInformation",
      "userType",
    ];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return handleFail(res, `${field} is required.`, statusCode.BAD_REQUEST);
      }
    }
    let createCompany;
    createCompany = await User.findOneAndUpdate(
      { _id: userOId },
      {
        userId: userOId,
        companyLogo,
        companyName,
        companyEmail,
        companyAddress,
        companyInformation,
        userId: userOId,
        userType,
      }
    );
    createCompany = await User.findOne({ _id: userOId });
    const token = jwt.sign(
      {
        userId: createCompany._id,
        userMobileNumber: createCompany?.mobileNumber,
      },
      process.env.SECRET_KEY,
      { expiresIn: "24h" }
    );
    if (createCompany) {
      const messages = "Company profile created successfully.";
      return handleSuccess(
        res,
        { createCompany, token },
        messages,
        statusCode.OK
      );
    } else {
      return handleFail(
        res,
        "Failed to create company profile.",
        statusCode?.BAD_REQUEST
      );
    }
  } catch (error) {
    return handleFail(res, error.message, statusCode.INTERNAL_SERVER_ERROR);
  }
};
export const createJobProfileFromAdmin = async (req, res) => {
  try {
    const userId = req.user;
    const userOId = new mongoose.Types.ObjectId(userId);
    const {
      jobName,
      jobType,
      subCategory,
      education,
      address,
      startingSalary,
      availablity,
      maximumSalary,
      totalNumberOfStaff,
      minimumExperience,
      maximumExperience,
      genderOfStaffShouldBe,
      candidateSpeakingSkillShouldBe,
      isWorkFromHome,
      jobDescriptions,
      image,
    } = req.body;
    const skillsArray = Array.isArray(req.body.skills)
      ? req.body.skills
      : [req.body.skills];
    const suggestedSkillsArray = Array.isArray(req.body.suggestedSkills)
      ? req.body.suggestedSkills
      : [req.body.suggestedSkills];

    const createJobProfile = await JobProfile.create({
      userId: userOId,
      jobName,
      jobType,
      subCategory,
      availablity,
      education,
      address,
      startingSalary,
      maximumSalary,
      totalNumberOfStaff,
      minimumExperience,
      maximumExperience,
      genderOfStaffShouldBe,
      candidateSpeakingSkillShouldBe,
      isWorkFromHome,
      jobDescriptions,
      image,
      skills: skillsArray,
      suggestedSkills: suggestedSkillsArray,
    });
    console.log("====????>>>here");
    if (createJobProfile) {
      handleSuccess(
        res,
        createJobProfile,
        jobConstant?.JOB_PROFILE_CREATED_SUCCESSFULLY,
        statusCode?.OK
      );
    } else {
      handleFail(
        res,
        jobConstant?.JOB_PROFILE_CREATED_FAIL,
        statusCode?.BAD_REQUEST
      );
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getJobListProfile = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;
    const searchTerm = req.query.search;
    const getAllAppliedJobs = await JobProfile.find({
      status: { $in: [false, null] },
    })
      .populate("userId")
      .skip(skip)
      .limit(limit)
      .sort({ _id: -1 })
      .lean();

    const transformedJobProfiles = getAllAppliedJobs.map((profile) => {
      const likedUsersIncludesUser =
        Array.isArray(profile?.likedUsers) &&
        profile.likedUsers.toString().includes(userId.toString());
      const applyUsersIncludesUser =
        Array.isArray(profile?.applyUsers) &&
        profile.applyUsers.toString().includes(userId.toString());

      const transformedProfile = {
        _id: profile._id,
        userId: profile.userId,
        jobName: profile.jobName,
        jobType: profile.jobType,
        subCategory: profile.subCategory,
        education: profile.education,
        address: profile.address,
        startingSalary: profile.startingSalary,
        maximumSalary: profile.maximumSalary,
        totalNumberOfStaff: profile.totalNumberOfStaff,
        minimumExperience: profile.minimumExperience,
        maximumExperience: profile.maximumExperience,
        genderOfStaffShouldBe: profile.genderOfStaffShouldBe,
        candidateSpeakingSkillShouldBe: profile.candidateSpeakingSkillShouldBe,
        isWorkFromHome: profile.isWorkFromHome,
        availablity: profile.availablity,
        skills: profile.skills,
        suggestedSkills: profile.suggestedSkills,
        jobDescriptions: profile.jobDescriptions,
        image: profile.image,
        likedUsers: likedUsersIncludesUser,
        applyUsers: applyUsersIncludesUser,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };

      return transformedProfile;
    });

    handleSuccess(
      res,
      transformedJobProfiles,
      "All jobs fetched successfully",
      statusCode?.OK
    );
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getCompleteJobListProfile = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;
    const searchTerm = req.query.search;
    const getAllAppliedJobs = await JobProfile.find({ status: true })
      .populate("userId")
      .skip(skip)
      .limit(limit)
      .sort({ _id: -1 })
      .lean();

    const transformedJobProfiles = getAllAppliedJobs.map((profile) => {
      const likedUsersIncludesUser =
        Array.isArray(profile?.likedUsers) &&
        profile.likedUsers.toString().includes(userId.toString());
      const applyUsersIncludesUser =
        Array.isArray(profile?.applyUsers) &&
        profile.applyUsers.toString().includes(userId.toString());

      const transformedProfile = {
        _id: profile._id,
        userId: profile.userId,
        jobName: profile.jobName,
        jobType: profile.jobType,
        education: profile.education,
        address: profile.address,
        isReported: profile.isReported,
        startingSalary: profile.startingSalary,
        maximumSalary: profile.maximumSalary,
        totalNumberOfStaff: profile.totalNumberOfStaff,
        minimumExperience: profile.minimumExperience,
        maximumExperience: profile.maximumExperience,
        genderOfStaffShouldBe: profile.genderOfStaffShouldBe,
        candidateSpeakingSkillShouldBe: profile.candidateSpeakingSkillShouldBe,
        isWorkFromHome: profile.isWorkFromHome,
        availablity: profile.availablity,
        skills: profile.skills,
        suggestedSkills: profile.suggestedSkills,
        jobDescriptions: profile.jobDescriptions,
        image: profile.image,
        likedUsers: likedUsersIncludesUser,
        applyUsers: applyUsersIncludesUser,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };

      return transformedProfile;
    });

    handleSuccess(
      res,
      transformedJobProfiles,
      "All jobs fetched successfully",
      statusCode?.OK
    );
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const updateStatusOfJobProfiles = async (req, res) => {
  try {
    const jobId = new mongoose.Types.ObjectId(req.query.id);
    const updateStatus = await JobProfile.findOneAndUpdate(
      { _id: jobId },
      { status: true },
      { new: true }
    );
    if (updateStatus) {
      handleSuccess(
        res,
        updateStatus,
        "This Job Vaancy is Completed successfully",
        statusCode?.OK
      );
    } else {
      handleError(res, "Update Failed", statusCode?.OK);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const reUpdateStatusOfJobProfiles = async (req, res) => {
  try {
    const jobId = new mongoose.Types.ObjectId(req.query.id);
    const updateStatus = await JobProfile.findOneAndUpdate(
      { _id: jobId },
      { status: false },
      { new: true }
    );
    console.log(updateStatus);
    if (updateStatus) {
      handleSuccess(
        res,
        updateStatus,
        "This Job Vaancy is Veccant",
        statusCode?.OK
      );
    } else {
      handleError(res, "Update Failed", statusCode?.OK);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getListOfJobsOfJobProvider = async (req, res) => {
  try {
    const userId = req.user;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const getLoginJobProfiles = await JobProfile.find({
      userId: userObjectId,
    }).sort({ _id: -1 });
    if (getLoginJobProfiles) {
      handleSuccess(
        res,
        getLoginJobProfiles,
        "Your Job Listing Fetched Successfully",
        statusCode?.OK
      );
    } else {
      handleError(
        res,
        "YOur JOb Listing fetched Fail",
        statusCode?.BAD_REQUEST
      );
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const editJobProfileFromAdmin = async (req, res) => {
  try {
    const jobId = req.query.id;
    if (!jobId) {
      handleError(res, "Job Profile id is Mandatory", statusCode?.BAD_REQUEST);
    } else {
      const jobObjectId = new mongoose.Types.ObjectId(jobId);
      const {
        jobName,
        jobType,
        subCategory,
        education,
        address,
        startingSalary,
        availablity,
        maximumSalary,
        totalNumberOfStaff,
        minimumExperience,
        maximumExperience,
        genderOfStaffShouldBe,
        candidateSpeakingSkillShouldBe,
        isWorkFromHome,
        jobDescriptions,
        image,
        skills,
        suggestedSkills,
      } = req.body;
      const jobProfileToUpdate = {};
      if (jobName) jobProfileToUpdate.jobName = jobName;
      if (jobType) jobProfileToUpdate.jobType = jobType;
      if (subCategory) jobProfileToUpdate.subCategory = subCategory;
      if (education) jobProfileToUpdate.education = education;
      if (address) jobProfileToUpdate.address = address;
      if (startingSalary) jobProfileToUpdate.startingSalary = startingSalary;
      if (availablity) jobProfileToUpdate.availablity = availablity;
      if (maximumSalary) jobProfileToUpdate.maximumSalary = maximumSalary;
      if (totalNumberOfStaff)
        jobProfileToUpdate.totalNumberOfStaff = totalNumberOfStaff;
      if (minimumExperience)
        jobProfileToUpdate.minimumExperience = minimumExperience;
      if (maximumExperience)
        jobProfileToUpdate.maximumExperience = maximumExperience;
      if (genderOfStaffShouldBe)
        jobProfileToUpdate.genderOfStaffShouldBe = genderOfStaffShouldBe;
      if (candidateSpeakingSkillShouldBe)
        jobProfileToUpdate.candidateSpeakingSkillShouldBe =
          candidateSpeakingSkillShouldBe;
      if (isWorkFromHome) jobProfileToUpdate.isWorkFromHome = isWorkFromHome;
      if (jobDescriptions) jobProfileToUpdate.jobDescriptions = jobDescriptions;
      if (image) jobProfileToUpdate.image = image;
      if (skills)
        jobProfileToUpdate.skills = Array.isArray(skills) ? skills : [skills];
      if (suggestedSkills)
        jobProfileToUpdate.suggestedSkills = Array.isArray(suggestedSkills)
          ? suggestedSkills
          : [suggestedSkills];
      const updatedJobProfile = await JobProfile.findOneAndUpdate(
        { _id: jobObjectId },
        { $set: jobProfileToUpdate },
        { new: true }
      );

      if (updatedJobProfile) {
        return handleSuccess(
          res,
          updatedJobProfile,
          "JOb Profile Updated successfully",
          statusCode.OK
        );
      } else {
        return handleFail(
          res,
          "Job Profile updated Fail",
          statusCode.BAD_REQUEST
        );
      }
    }
  } catch (error) {
    return handleError(res, error.message, statusCode.INTERNAL_SERVER_ERROR);
  }
};
export const deleteJobProfile = async (req, res) => {
  try {
    const jobId = req.query.id;
    if (!jobId) {
      handleError(res, "job id is mandatory", statusCode?.BAD_REQUEST);
    } else {
      const jobObjectId = new mongoose.Types.ObjectId(jobId);
      const deleteJob = await JobProfile.findOneAndDelete({ _id: jobObjectId });
      if (deleteJob) {
        handleSuccess(
          res,
          deleteJob,
          "Job profile is deleted successfully",
          statusCode?.OK
        );
      } else {
        handleError(
          res,
          "Job Profile is failed to delete",
          statusCode?.BAD_REQUEST
        );
      }
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const createContactUs = async (req, res) => {
  try {
    let userId;
    userId = req.user;
    let userOId = new mongoose.Types.ObjectId(userId);
    const { title, email, description } = req.body;
    const createContact = await ContactUs.create({
      userId: userOId,
      title,
      email,
      description,
    });
    if (createContact) {
      handleSuccess(
        res,
        createContact,
        "We Will Contact You Soon",
        statusCode?.OK
      );
    } else {
      handleFail(res, "Contact us creating fail", statusCode?.BAD_REQUEST);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getContactUs = async (req, res) => {
  try {
    const getListOfContactUs = await ContactUs.find().sort({ _id: -1 });
    if (getListOfContactUs) {
      handleSuccess(
        res,
        getListOfContactUs,
        "Contact Us list fetched successfully",
        statusCode?.OK
      );
    } else {
      handleFail(
        res,
        "Contact Us List fetched failed",
        statusCode?.BAD_REQUEST
      );
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const findUserType = await User.findOne({ _id: userObjectId }).select(
      "userType"
    );
    if (findUserType?.userType == "jobProvider") {
      await JobProfile.deleteMany({ userId: userObjectId });
    }
    const deleteUserProfile = await User.findOneAndDelete({
      _id: userObjectId,
    });
    if (deleteUserProfile) {
      handleSuccess(
        res,
        deleteUserProfile,
        "User Profile Deleted Successfully",
        statusCode?.OK
      );
    } else {
      handleError(res, "User Profile delete failed", statusCode?.BAD_REQUEST);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const applyJobs = async (req, res) => {
  try {
    const userId = req.user;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const jobId = req.query.jobId;
    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const checkExistJob = await JobProfile.findOne({ _id: jobObjectId });

    if (!checkExistJob) {
      handleError(res, "This Job is not exist", statusCode?.BAD_REQUEST);
    } else {
      const checkUserAlreadyAppliedJobs = await JobProfile.find({
        _id: jobObjectId,
        applyUsers: { $in: userObjectId },
      });
      if (checkUserAlreadyAppliedJobs.length > 0) {
        const removeUser = await JobProfile.findOneAndUpdate(
          { _id: jobObjectId },
          { $pull: { applyUsers: userId } },
          { new: true }
        );
        if (removeUser) {
          await ApplyJobs.findOneAndDelete({
            userId: userObjectId,
            jobId: jobObjectId,
          });
          handleSuccess(
            res,
            removeUser,
            "You just unapplied this jobs",
            statusCode?.OK
          );
        } else {
          handleFail(res, "Failed to remove", statusCode?.BAD_REQUEST);
        }
      } else {
        const applyUser = await JobProfile.findOneAndUpdate(
          { _id: jobObjectId },
          { $push: { applyUsers: userId } },
          { new: true }
        );
        if (applyUser) {
          const { resume, information } = req.body;
          const appliedJobByUser = await ApplyJobs.create({
            userId: userObjectId,
            resume,
            jobId: jobObjectId,
            information,
          });
          if (appliedJobByUser) {
            handleSuccess(
              res,
              appliedJobByUser,
              "You have applied for this Job Successfully",
              statusCode?.OK
            );
          } else {
            handleError(
              res,
              "Failed to apply for a job",
              statusCode?.BAD_REQUEST
            );
          }
        }
      }
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getUsersDataApplyForJobs = async (req, res) => {
  try {
    const jobId = req.query.jobId;
    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const getListOfJobs = await ApplyJobs.find({ jobId: jobObjectId }).populate(
      "userId"
    );
    if (getListOfJobs) {
      handleSuccess(
        res,
        getListOfJobs,
        "List of jobs fetched successfully",
        statusCode?.OK
      );
    } else {
      handleError(res, "List of jobs Failed to fetch", statusCode?.BAD_REQUEST);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const uploadPDF = async (req, res) => {
  try {
    if (!req.files || !req.files.pdf) {
      return res.status(400).json({ error: "No PDF provided" });
    }
    const pdf = req.files.pdf;
    const pdfName = `${uuidv4()}_${pdf.name}`;
    const bucketParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: pdfName,
      Body: pdf.data,
      ContentType: "application/pdf",
    };
    const uploadCommand = new PutObjectCommand(bucketParams);
    const data = await s3Client.send(uploadCommand);

    const accessibleUrl = `https://${bucketParams.Bucket}.s3.${process.env.REGION}.amazonaws.com/${pdfName}`;

    return res.status(statusCode?.OK).json({
      status: statusCode?.OK,
      message: "PDF uploaded successfully",
      filename: accessibleUrl,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ error: "Failed to upload image" });
  }
};
export const blockCompany = async (req, res) => {
  try {
    const userId = req.query.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const blockCompanyByAdmin = await User.findOneAndUpdate(
      { _id: userObjectId },
      { isBlocked: true },
      { new: true }
    );
    if (blockCompanyByAdmin) {
      handleSuccess(
        res,
        blockCompanyByAdmin,
        "Company Blocked SuccessFully",
        statusCode?.OK
      );
    } else {
      handleError(res, "Company Block Fail", statusCode?.BAD_REQUEST);
    }
  } catch (error) {
    handleFail(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getAllBlockCompany = async (req, res) => {
  try {
    const getBlockCompany = await User.find({
      userType: "jobProvider",
      isBlocked: true,
    });
    if (getBlockCompany) {
      handleSuccess(
        res,
        getBlockCompany,
        "All Blocked users Fetched successfully",
        statusCode?.OK
      );
    } else {
      handleFail(res, "Block users fetched fail", statusCode?.BAD_REQUEST);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const unBlockCompany = async (req, res) => {
  try {
    const userId = req.query.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const unBlockUser = await User.findOneAndUpdate(
      { _id: userObjectId },
      { isBlocked: false },
      { new: true }
    );
    if (unBlockUser) {
      handleSuccess(
        res,
        unBlockUser,
        "Company is unblocked successfully",
        statusCode?.OK
      );
    } else {
      handleError(res, "Company Unblocked fail", statusCode?.BAD_REQUEST);
    }
  } catch (error) {
    handleFail(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const blockUser = async (req, res) => {
  try {
    const userId = req.query.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const findCurrentUserIsBlocked = await User.findOne({
      _id: userObjectId,
    }).select("isBlocked");
    if (findCurrentUserIsBlocked?.isBlocked) {
      const unBlockUser = await User.findOneAndUpdate(
        { _id: userObjectId },
        { isBlocked: false },
        { new: true }
      );
      handleSuccess(
        res,
        unBlockUser,
        "User is un-blocked successfully",
        statusCode?.OK
      );
    } else {
      const blockedUser = await User.findOneAndUpdate(
        { _id: userObjectId },
        { isBlocked: true },
        { new: true }
      );
      handleSuccess(
        res,
        blockedUser,
        "User is blocked successfully",
        statusCode?.OK
      );
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.BAD_REQUEST);
  }
};
export const createJobCategory = async (req, res) => {
  try {
    const { name, icons, isPopularType } = req.body;
    console.log("========>>>>>>>>>",req.body)
    const createCategory = await JobCategory.create({
      name,
      icons,
      isPopularType,
    });
    if (createCategory) {
      handleSuccess(
        res,
        createCategory,
        "Category For Job is created",
        statusCode?.OK
      );
    } else {
      handleError(
        res,
        "Failed In creating a category for job",
        statusCode?.BAD_REQUEST
      );
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const createJobSubCategoryOnTheBasisOfCategory = async (req, res) => {
  try {
    const { id, name } = req.body;
    const jobCategoryId = new mongoose.Types.ObjectId(id);
    const existJobCategory = await JobCategory.findOne({ _id: jobCategoryId });
    if (existJobCategory) {
      const createSubCategory = await JobSubCategory.create({
        jobCategoryId: jobCategoryId,
        name,
      });
      if (createSubCategory) {
        handleSuccess(
          res,
          createSubCategory,
          "Job Sub Category created successfully",
          statusCode?.OK
        );
      } else {
        handleError(
          res,
          "Job SubCatgory Created Fail",
          statusCode?.BAD_REQUEST
        );
      }
    } else {
      handleFail(
        res,
        "This Category of Job Id is not exist",
        statusCode?.BAD_REQUEST
      );
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getJobCategories = async (req, res) => {
  console.log(`Page ${req.query.page} Limit ${req.query.limit}`);
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;
    const totalCategories = await JobCategory.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);
    const jobCategories = await JobCategory.find()
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);
    if (jobCategories.length > 0) {
      handleSuccess(
        res,
        {
          jobCategories,
          currentPage: page,
          totalPages,
        },
        "Job Categories Fetched Successfully",
        statusCode?.OK
      );
    } else {
      handleError(res, "No Job Categories Found", statusCode?.NOT_FOUND);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getAllJobSubCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;
    const jobSubCategories = await JobSubCategory.find()
      .populate("jobCategoryId")
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);
    const totalSubCategories = await JobSubCategory.countDocuments();
    const totalPages = Math.ceil(totalSubCategories / limit);

    if (jobSubCategories.length > 0) {
      handleSuccess(
        res,
        {
          jobSubCategories,
          currentPage: page,
          totalPages,
        },
        "Job SubCategories Fetched Successfully",
        statusCode?.OK
      );
    } else {
      handleError(res, "No Job SubCategories Found", statusCode?.NOT_FOUND);
    }
  } catch (error) {
    // Handle any errors that occur during database query or response handling
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getJobSubCategoriesByCategories = async (req, res) => {
  try {
    const jobCategoryId = new mongoose.Types.ObjectId(req.query.id);
    const userId = new mongoose.Types.ObjectId(req.user);
    const existJobCategory = await JobCategory.findOne({ _id: jobCategoryId });
    if (!existJobCategory) {
      return handleError(
        res,
        "This Category of Job Id is invalid",
        statusCode?.BAD_REQUEST
      );
    }

    const fetchSubCategories = await JobSubCategory.find({
      jobCategoryId,
    }).sort({ _id: -1 });

    const getNameOfSubCategories = fetchSubCategories.map((x) => x.name);

    const findJobProfile = await JobProfile.find({
      subCategory: { $in: getNameOfSubCategories }
    }).populate("userId");

    const transformedJobProfiles = findJobProfile.map((profile) => {
      const likedUsersIncludesUser =
        Array.isArray(profile?.likedUsers) &&
        profile.likedUsers.toString().includes(userId.toString());
      const applyUsersIncludesUser =
        Array.isArray(profile?.applyUsers) &&
        profile.applyUsers.toString().includes(userId.toString());

      const transformedProfile = {
        _id: profile._id,
        userId: profile.userId,
        jobName: profile.jobName,
        jobType: profile.jobType,
        subCategory: profile.subCategory,
        education: profile.education,
        address: profile.address,
        startingSalary: profile.startingSalary,
        maximumSalary: profile.maximumSalary,
        isReported: profile.isReported,
        totalNumberOfStaff: profile.totalNumberOfStaff,
        minimumExperience: profile.minimumExperience,
        maximumExperience: profile.maximumExperience,
        genderOfStaffShouldBe: profile.genderOfStaffShouldBe,
        candidateSpeakingSkillShouldBe: profile.candidateSpeakingSkillShouldBe,
        isWorkFromHome: profile.isWorkFromHome,
        availablity: profile.availablity,
        skills: profile.skills,
        suggestedSkills: profile.suggestedSkills,
        jobDescriptions: profile.jobDescriptions,
        image: profile.image,
        likedUsers: likedUsersIncludesUser,
        applyUsers: applyUsersIncludesUser,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };

      return transformedProfile;
    });

    handleSuccess(
      res,
      {
        subCategories: fetchSubCategories,
        jobProfiles: transformedJobProfiles
      },
      "All Sub Categories and their corresponding job profiles are fetched",
      statusCode?.OK
    );
  } catch (error) {
    console.error(`Error fetching subcategories and job profiles: ${error.message}`);
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};

export const editJobCategories = async (req, res) => {
  try {
    const jobCategoryId = new mongoose.Types.ObjectId(req.query.id);
    const existJobCategory = await JobCategory.findOne({ _id: jobCategoryId });

    if (existJobCategory) {
      const { name, icons, isPopularType } = req.body;
      const modifiedObjects = {};

      if (name) {
        modifiedObjects.name = name;
      }
      if (icons) {
        modifiedObjects.icons = icons;
      }
      if (typeof isPopularType !== 'undefined') {
        modifiedObjects.isPopularType = isPopularType;
      }

      const updateCategory = await JobCategory.findOneAndUpdate(
        { _id: jobCategoryId },
        { $set: modifiedObjects },
        { new: true }
      );

      if (updateCategory) {
        handleSuccess(
          res,
          updateCategory,
          "Category Data updated successfully",
          statusCode?.OK
        );
      } else {
        handleFail(
          res,
          "Category data update failed",
          statusCode?.BAD_REQUEST
        );
      }
    } else {
      handleFail(
        res,
        "Category not found",
        statusCode?.NOT_FOUND
      );
    }
  } catch (error) {
    handleFail(
      res,
      error.message,
      statusCode?.INTERNAL_SERVER_ERROR
    );
  }
};
export const editJobSubCategories = async (req, res) => {
  try {
    const subCategoryId = req.query.id;
    const subCategoryObjectId = new mongoose.Types.ObjectId(subCategoryId);
    const { name, id } = req.body;
    const categoryOId = new mongoose.Types.ObjectId(id);
    const updatedJobDetails = await JobSubCategory.findOneAndUpdate(
      { _id: subCategoryObjectId },
      { name, jobCategoryId: categoryOId },
      { new: true }
    );
    if (updatedJobDetails) {
      handleSuccess(
        res,
        updatedJobDetails,
        "Job Details Updated Successfully",
        statusCode?.OK
      );
    } else {
      handleError(res, "Job Details Update fail", statusCode?.BAD_REQUEST);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.BAD_REQUEST);
  }
};
export const deleteJobSubCategory = async (req, res) => {
  try {
    const subCategoryId = new mongoose.Types.ObjectId(req.query.id);
    const deleteSubCategory = await JobSubCategory.findOneAndDelete({
      _id: subCategoryId,
    });
    if (deleteSubCategory) {
      handleSuccess(
        res,
        deleteSubCategory,
        "Job Sub category is deleted successfully",
        statusCode?.OK
      );
    } else {
      handleError(res, "Job SubCategory delete fail", statusCode?.BAD_REQUEST);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const delteJobCategories = async (req, res) => {
  try {
    const jobId = req.query.id;
    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const delteJobCategoryData = await JobCategory.findOneAndDelete({
      _id: jobObjectId,
    });
    await JobSubCategory.deleteMany({ jobCategoryId: jobObjectId });
    if (delteJobCategoryData) {
      handleSuccess(
        res,
        delteJobCategoryData,
        "This category of the job deleted successfully",
        statusCode?.OK
      );
    } else {
      handleFail(
        res,
        "Failed to delete the job category",
        statusCode?.BAD_REQUEST
      );
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getAppliedJobs = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);
    const getAllAppliedJobs = await ApplyJobs.find({ userId })
      .sort({ _id: -1 })
      .populate({
        path: "jobId",
        select: "-applyUsers",
        populate: {
          path: "userId",
          select: "-likeJobs",
        },
      });
      const filterData = getAllAppliedJobs.filter(job => job.jobId !== null)
    handleSuccess(
      res,
      filterData,
      "All jobs Feched success fully",
      statusCode?.OK
    );
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const addFavouratesJob = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);
    const { jobId } = req.body;
    const jobObjectId = new mongoose.Types.ObjectId(jobId);
    const findJobDetails = await JobProfile.find({
      _id: jobObjectId,
      likedUsers: { $in: userId },
    });
    if (findJobDetails.length > 0) {
      const unLikeJob = await JobProfile.findOneAndUpdate(
        { _id: jobObjectId },
        { $pull: { likedUsers: userId } },
        { new: true }
      );
      if (unLikeJob) {
        await favouratesJobSchema.findOneAndDelete({
          userId,
          jobId: jobObjectId,
        });
        handleSuccess(
          res,
          unLikeJob,
          "Job removed from favourite",
          statusCode?.OK
        );
      } else {
        handleError(res, "Failed to unlike this job", statusCode?.OK);
      }
    } else {
      const updateJobProfile = await JobProfile.findOneAndUpdate(
        { _id: jobObjectId },
        { $push: { likedUsers: userId } },
        { new: true }
      );
      if (updateJobProfile) {
        await favouratesJobSchema.create({ userId, jobId: jobObjectId });
        handleSuccess(
          res,
          updateJobProfile,
          "Job Add to favourite",
          statusCode?.OK
        );
      } else {
        handleFail(res, "You have failed to like this Job", statusCode?.OK);
      }
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const listOfLikedJobs = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);
    const getAllLikedJobs = await favouratesJobSchema
      .find({ userId })
      .populate({
        path: "jobId",
        select: "-applyUsers",
        populate: {
          path: "userId",
          select: "-likeJobs",
        },
      });
      const filteredLikedJobs = getAllLikedJobs.filter(job => job.jobId !== null);
    if (getAllLikedJobs) {
      handleSuccess(
        res,
        filteredLikedJobs,
        "All Liked jobs Fetched successfully",
        statusCode?.OK
      );
    } else {
      handleSuccess(
        res,
        [],
        "All Liked jobs Fetched successfully",
        statusCode?.OK
      );
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getAllJobsOfLoginUser = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user);
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;
    const searchTerm = req.query.search;
    let query = {};
    if (searchTerm) {
      query.jobName = { $regex: new RegExp(searchTerm, "i") };
    }
    const getAllAppliedJobs = await JobProfile.find(query)
      .populate("userId")
      .skip(skip)
      .limit(limit)
      .sort({ _id: -1 })
      .lean();

    const transformedJobProfiles = getAllAppliedJobs.map((profile) => {
      const likedUsersIncludesUser =
        Array.isArray(profile?.likedUsers) &&
        profile.likedUsers.toString().includes(userId.toString());
      const applyUsersIncludesUser =
        Array.isArray(profile?.applyUsers) &&
        profile.applyUsers.toString().includes(userId.toString());

      const transformedProfile = {
        _id: profile._id,
        userId: profile.userId,
        jobName: profile.jobName,
        jobType: profile.jobType,
        subCategory: profile.subCategory,
        education: profile.education,
        address: profile.address,
        startingSalary: profile.startingSalary,
        maximumSalary: profile.maximumSalary,
        isReported: profile.isReported,
        totalNumberOfStaff: profile.totalNumberOfStaff,
        minimumExperience: profile.minimumExperience,
        maximumExperience: profile.maximumExperience,
        genderOfStaffShouldBe: profile.genderOfStaffShouldBe,
        candidateSpeakingSkillShouldBe: profile.candidateSpeakingSkillShouldBe,
        isWorkFromHome: profile.isWorkFromHome,
        availablity: profile.availablity,
        skills: profile.skills,
        suggestedSkills: profile.suggestedSkills,
        jobDescriptions: profile.jobDescriptions,
        image: profile.image,
        likedUsers: likedUsersIncludesUser,
        applyUsers: applyUsersIncludesUser,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };

      return transformedProfile;
    });

    handleSuccess(
      res,
      transformedJobProfiles,
      "All jobs fetched successfully",
      statusCode?.OK
    );
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getPopularJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;
    const getAllPopularJobs = await JobCategory.find({ isPopularType: true }).sort({ _id: -1 })
    .skip(skip)
    .limit(limit);
    if(getAllPopularJobs)
      {
        handleSuccess(res,getAllPopularJobs,"All Popular data fetched successfully",statusCode?.OK)
      }
      else
      {
        handleError(res,"Popular data fetched failed",statusCode?.OK)
      }
  } catch (error) {
    handleError(res,error.message,statusCode?.INTERNAL_SERVER_ERROR)
  }
};
export const deleteAppliedJob = async (req, res) => {
  try {
    console.log("Inside the delete App;lied Jobs");
    const userId = new mongoose.Types.ObjectId(req.user);
    const jobObjectId = new mongoose.Types.ObjectId(req.query.id);
    const removeUser = await JobProfile.findOneAndUpdate(
      { _id: jobObjectId },
      { $pull: { applyUsers: userId } },
      { new: true }
    );
    console.log(removeUser);
    if (removeUser) {
      console.log("=========>>>userID", userId, jobObjectId);
      const deleteAppliedJobs = await ApplyJobs.deleteMany({
        userId: userId,
        jobId: jobObjectId,
      });
      console.log("============>>>DeleteAppliedJobs", deleteAppliedJobs);
      handleSuccess(
        res,
        { removeUser, deleteAppliedJobs },
        "You just unapplied this jobs",
        statusCode?.OK
      );
    } else {
      handleFail(res, "Failed to remove", statusCode?.BAD_REQUEST);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getAllAppliedJobProfiles = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;
    let getAllAppliedJobProfilesData = await JobProfile.find({
      applyUsers: { $exists: true, $not: { $size: 0 } },
    })
      .populate("applyUsers")
      .skip(skip)
      .limit(limit)
      .sort({ _id: -1 })
      .lean();
    for (let jobProfile of getAllAppliedJobProfilesData) {
      for (let i = 0; i < jobProfile.applyUsers.length; i++) {
        let applyUser = jobProfile.applyUsers[i];
        try {
          const applyJob = await ApplyJobs.findOne({ userId: applyUser._id });
          if (applyJob) {
            applyUser.resume = applyJob.resume;
          }
        } catch (error) {
          console.error("Error finding ApplyJob:", error);
        }
      }
    }
    if (getAllAppliedJobProfilesData) {
      handleSuccess(
        res,
        getAllAppliedJobProfilesData,
        "All Applied Job fetch Successfully",
        statusCode?.OK
      );
    } else {
      handleError(res, "All Applied job fetch fail", statusCode?.OK);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
