import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { createTransport } from "nodemailer";
import path from "path";

import User from "../schema/userSchema.js";
import { generateOTP } from "../utils/generateOtp.js";
import userConstantMessages from "../constants/usersConstantMessage.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { s3Client } from "../helpers/AwsConfig.js";
import statusCode from "../constants/statusCode.js";
import jobSchema from "../schema/jobSchema.js";
import JobProfile from "../schema/jobProfileSchema.js";
import {
  handleSuccess,
  handleFail,
  handleError,
} from "../responseHandler/response.js";
export const loginUser = async (req, res) => {
  try {
    const { mobileNumber, deviceId, deviceToken } = req.body;
    if (!mobileNumber || !deviceId || !deviceToken) {
      return res.status(statusCode.BAD_REQUEST).json({
        message: "Mobile number, device ID, and device token are required.",
      });
    }
    const otp = generateOTP();
    const findexistingUser = await User.findOne({ mobileNumber });
    if (findexistingUser) {
      const updateOtpForExistingUser = await User.findByIdAndUpdate(
        { _id: findexistingUser?._id },
        { otp }
      );
      const updateOtpForExitingUser = await User.findOne({
        _id: findexistingUser?._id,
      });
      const response = {
        otp: updateOtpForExitingUser?.otp,
        _id: updateOtpForExitingUser?._id,
      };
      handleSuccess(
        res,
        response,
        userConstantMessages?.OTP_SENT,
        statusCode?.OK
      );
    } else {
      const createUser = await User.create({
        mobileNumber,
        deviceToken,
        deviceId,
        otp,
      });
      if (createUser) {
        const response = {
          otp: createUser?.otp,
          _id: createUser?._id,
        };
        const message = userConstantMessages?.OTP_SENT;
        handleSuccess(res, response, message, statusCode.OK);
      } else {
        const message = userConstantMessages?.OTP_SENT_FAIL;
        handleFail(res, statusCode.BAD_REQUEST);
      }
    }
  } catch (error) {
    const message = error.message;
    handleError(res, message, statusCode.INTERNAL_SERVER_ERROR);
  }
};
export const verifyOtp = async (req, res) => {
  try {
    const userId = req.query.id;
    const { otp } = req.body;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const findUserId = await User.findOne({ _id: userObjectId });
    if (findUserId) {
      if (findUserId.otp === otp) {
        const message = userConstantMessages?.OTP_VERIFY_SUCCESSFULLY;
        const token = jwt.sign(
          {
            userId: findUserId._id,
            userMobileNumber: findUserId?.mobileNumber,
          },
          process.env.SECRET_KEY,
          { expiresIn: "24h" }
        );

        if (!findUserId.userType) {
          findUserId.name = findUserId.name || "";
          findUserId.image = findUserId.image || "";
          findUserId.email = findUserId.email || "";
          findUserId.address = findUserId.address || "";
          findUserId.alterNateNumber = findUserId.alterNateNumber || "";
          findUserId.gender = findUserId.gender || "";
          findUserId.userType = findUserId.userType || "";
          handleSuccess(res, findUserId, message, statusCode?.OK);
        } else {
          const findUserJobProfile = await jobSchema.findOne({
            userId: userObjectId,
          });
          if (findUserJobProfile) {
            handleSuccess(
              res,
              { findUserId, findUserJobProfile, token },
              message,
              statusCode?.OK
            );
          } else {
            handleSuccess(res, { findUserId, token }, message, statusCode?.OK);
          }
        }
      } else {
        const message = userConstantMessages?.YOU_HAVE_ENTER_WRONG_OTP;
        handleFail(res, message, statusCode?.BAD_REQUEST);
      }
    } else {
      const message = userConstantMessages?.OTP_VERIFY_FAIL;
      handleFail(res, message, statusCode?.BAD_REQUEST);
    }
  } catch (error) {
    const message = error.message;
    handleError(res, message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const signUp = async (req, res) => {
  try {
    const userId = req.params.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const {
      name,
      email,
      gender,
      DOB,
      address,
      image,
      alterNateNumber,
      userType,
    } = req.body;

    const findUser = await User.findOneAndUpdate(
      { _id: userObjectId },
      { name, email, DOB, gender, address, image, alterNateNumber, userType }
    );
    const user = await User.findOne({ _id: userObjectId });
    if (user) {
      const token = jwt.sign(
        {
          userId: user._id,
          userMobileNumber: user.mobileNumber,
        },
        process.env.SECRET_KEY,
        { expiresIn: "24h" }
      );

      const response = { user, token };

      const message = userConstantMessages?.USER_REGISTERED;
      handleSuccess(res, response, message, statusCode?.OK);
    } else {
      const message = userConstantMessages?.USER_NOT_FOUND;
      handleFail(res, message, statusCode?.BAD_REQUEST);
    }
  } catch (error) {
    const message = error.message;
    handleError(res, message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const uploadImage = async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: "No image provided" });
    }

    const image = req.files.image;
    const imageName = `${uuidv4()}_${image.name}`;
    const bucketParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: imageName,
      Body: image.data,
      ContentType: image.mimetype,
    };
    console.log("=====>>>>>>>", bucketParams);
    const uploadCommand = new PutObjectCommand(bucketParams);
    const data = await s3Client.send(uploadCommand);

    const accessibleUrl = `https://${bucketParams.Bucket}.s3.${process.env.REGION}.amazonaws.com/${imageName}`;

    return res.status(statusCode?.OK).json({
      status: statusCode?.OK,
      message: "Image uploaded successfully",
      filename: accessibleUrl,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return res.status(500).json({ error: "Failed to upload image" });
  }
};
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const getLoginUserProfile = await User.findOne({
      _id: userObjectId,
    }).select("-otp");
    let userjobProfile={}
    userjobProfile = await jobSchema.findOne({ userId: userObjectId });
    if (getLoginUserProfile) {
      if (userjobProfile) {
        handleSuccess(
          res,
          { getLoginUserProfile, userjobProfile },
          "User Profile Fetched SuccessFully",
          statusCode?.OK
        );
      } else {
        handleSuccess(
          res,
          {getLoginUserProfile,userjobProfile: userjobProfile || {},},
          "User Profile Fetched SuccessFully",
          statusCode?.OK
        );
      }
    } else {
      handleError(res, "User Profile fetched failed", statusCode?.BAD_REQUEST);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getjobProviderprofile = async (req, res) => {
  try {
    const userId = req.user;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const getCompanyProviderProfile = await User.findOne({
      _id: userObjectId,
    }).select("-otp");
    const getCreatedJobProfile = await JobProfile.find({
      userId: userObjectId,
    });
    if (getCompanyProviderProfile) {
      handleSuccess(
        res,
        { getCompanyProviderProfile, getCreatedJobProfile },
        "Users and Jobs profile details fetched successfully",
        statusCode?.OK
      );
    } else {
      handleError(
        res,
        "Users Jobs Profile Details Failed",
        statusCode?.BAD_REQUEST
      );
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const editJobProviderAndSeeker = async (req, res) => {
  try {
    const userId = req.user;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const userType = req.query.userType;
    if (!["jobSeeker", "jobProvider"].includes(userType)) {
      return handleError(res, "Invalid user type", statusCode.BAD_REQUEST);
    }
    let userData = await User.findOne({ _id: userObjectId });
    if (!userData) {
      return handleError(res, "User not found", statusCode.NOT_FOUND);
    }

    const updateData = {};

    if (userType === "jobSeeker") {
      const {
        name,
        email,
        gender,
        DOB,
        address,
        image,
        alterNateNumber,
        mobileNumber,
        subCategory,
        jobType,
        availability,
        education,
        experience,
        skills,
        currentSalary,
        information,
        expectedSalary,
      } = req.body;

      updateData.name = name;
      updateData.email = email;
      updateData.gender = gender;
      updateData.DOB = DOB;
      updateData.address = address;
      updateData.image = image;
      updateData.mobileNumber = mobileNumber;
      updateData.alterNateNumber = alterNateNumber;
      updateData.jobType = jobType;
      updateData.subCategory = subCategory;
      updateData.education = education;
      updateData.experience = experience;
      updateData.skills = skills;
      updateData.currentSalary = currentSalary;
      updateData.information = information;
      updateData.expectedSalary = expectedSalary;
      updateData.availability = availability;
    
      const updateUserData = await User.findOneAndUpdate(
        { _id: userObjectId },
        updateData,
        { new: true }
      );
      handleSuccess(
        res,
        updateUserData ,
        "Update User details Successfully",
        statusCode?.OK
      );
    } else if (userType === "jobProvider") {
      const {
        companyLogo,
        companyName,
        companyEmail,
        companyAddress,
        companyInformation,
        mobileNumber,
      } = req.body;
      updateData.companyLogo = companyLogo;
      updateData.companyName = companyName;
      updateData.companyEmail = companyEmail;
      updateData.companyAddress = companyAddress;
      updateData.companyInformation = companyInformation;
      updateData.mobileNumber = mobileNumber;
      await User.findOneAndUpdate({ _id: userObjectId }, updateData);
      const updatedUser = await User.findOne({ _id: userObjectId });
      handleSuccess(
        res,
        updatedUser,
        "User data updated successfully",
        statusCode.OK
      );
    }
  } catch (error) {
    console.error("Error:", error);
    handleError(res, "Internal Server Error", statusCode.INTERNAL_SERVER_ERROR);
  }
};
const calculatePaginationParams = (page , limit) => {
  const parsedPage = parseInt(page, 10);
  const parsedLimit = parseInt(limit, 10);

  const startIndex = (parsedPage - 1) * parsedLimit;
  const endIndex = parsedPage * parsedLimit;

  return { startIndex, endIndex };
};
export const getAllSeekerUser = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { startIndex, endIndex } = calculatePaginationParams(page, limit);
    const getSeekers = await User.find({
      userType: "jobSeeker",
      isBlocked: { $ne: true },
    })
      .sort({ _id: -1 })
     
    const getJobDetails = await jobSchema.find().sort({ _id: -1 });
    let outputArray = getSeekers.map((seeker) => {
      let matchingItem = getJobDetails.find((details) => {
        return details?.userId.toString() === seeker?._id.toString(); 
      });
    
      if (matchingItem) {
        return {
          _id: seeker?._id,
          name: seeker?.name,
          image: seeker?.image,
          email: seeker?.email,
          mobileNumber:seeker?.mobileNumber,
          gender:seeker?.gender,
          alterNateNumber: seeker?.alterNateNumber,
          jobType: matchingItem?.jobType,
          subCategory: matchingItem?.subCategory,
          availability: matchingItem?.availability,
          education: matchingItem?.education,
          experience: matchingItem?.experience,
          skills: matchingItem?.skills,
          currentSalary: matchingItem?.currentSalary,
          information: matchingItem?.information,
          expectedSalary: matchingItem?.expectedSalary,
        };
      } else {
        
        return {_id: seeker?._id,
          name: seeker?.name,
          image: seeker?.image,
          email: seeker?.email,
          alterNateNumber: seeker?.alterNateNumber,
          mobileNumber:seeker?.mobileNumber,
          gender:seeker?.gender
        }; 
      }
    }); 
    console.log("=========>>>>>>>",outputArray)
    if (getSeekers.length > 0) {
      handleSuccess(
        res,
        outputArray,
        `Job Seekers fetched successfully (Page ${page})`,
        statusCode.OK
      );
    } else {
      handleError(res, "No Job Seekers found", statusCode.NOT_FOUND);
    }
  } catch (error) {
    handleError(res, error.message, statusCode.INTERNAL_SERVER_ERROR);
  }
};
export const getAllProviderUser = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { startIndex, endIndex } = calculatePaginationParams(page, limit);
    const getProviders = await User.find({
      userType: "jobProvider",
      isBlocked: { $in: [null, false] },
    })
      .sort({ _id: -1 })
      .skip(startIndex)
      .limit(limit);

    if (getProviders.length > 0) {
      handleSuccess(
        res,
        getProviders,
        `Job Providers fetched successfully (Page ${page})`,
        statusCode.OK
      );
    } else {
      handleError(res, "No Job Providers found", statusCode.NOT_FOUND);
    }
  } catch (error) {
    handleError(res, error.message, statusCode.INTERNAL_SERVER_ERROR);
  }
};
export const getAllBlokedSeekerUser = async (req, res) => {
  try {
    const { page , limit  } = req.query;
    const { startIndex, endIndex } = calculatePaginationParams(page, limit);
    const getSeekers = await User.find({
      userType: "jobSeeker",
      isBlocked: true,
    })
      .sort({ _id: -1 })
      .skip(startIndex)
      .limit(limit);
      const getJobDetails = await jobSchema.find().sort({ _id: -1 });
      let outputArray = getSeekers.map((seeker) => {
        let matchingItem = getJobDetails.find((details) => {
          return details?.userId.toString() === seeker?._id.toString(); 
        });
      
        if (matchingItem) {
          return {
            _id: seeker?._id,
            name: seeker?.name,
            image: seeker?.image,
            email: seeker?.email,
            mobileNumber:seeker?.mobileNumber,
            gender:seeker?.gender,
            alterNateNumber: seeker?.alterNateNumber,
            jobType: matchingItem?.jobType,
            subCategory: matchingItem?.subCategory,
            availability: matchingItem?.availability,
            education: matchingItem?.education,
            experience: matchingItem?.experience,
            skills: matchingItem?.skills,
            currentSalary: matchingItem?.currentSalary,
            information: matchingItem?.information,
            expectedSalary: matchingItem?.expectedSalary,
          };
        } else {
          
          return {_id: seeker?._id,
            name: seeker?.name,
            image: seeker?.image,
            email: seeker?.email,
            alterNateNumber: seeker?.alterNateNumber,
            mobileNumber:seeker?.mobileNumber,
            gender:seeker?.gender
          }; 
        }
      }); 
      console.log("=========>>>>>>>",outputArray)
    if (getSeekers.length > 0) {
      handleSuccess(
        res,
        outputArray,
        `Blocked User fetched successfully (Page ${page})`,
        statusCode.OK
      );
    } else {
      handleSuccess(res,[],"No Blocked User found", statusCode.OK);
    }
  } catch (error) {
    handleError(res, error.message, statusCode.INTERNAL_SERVER_ERROR);
  }
};
const currentYear = new Date().getFullYear();
const pipeline = [
  {
    $match: {
      createdAt: { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) },
      userType: "jobSeeker"
    }
  },
  {
    $project: {
      year: { $year: "$createdAt" },
      month: { $month: "$createdAt" }
    }
  },
  {
    $group: {
      _id: { year: "$year", month: "$month" },
      count: { $sum: 1 }
    }
  },
  {
    $group: {
      _id: null,
      months: { $push: { _id: "$_id", count: "$count" } }
    }
  },
  {
    $project: {
      _id: 0,
      months: {
        $map: {
          input: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          as: "month",
          in: {
            year: currentYear,
            month: "$$month",
            count: {
              $cond: {
                if: { $isArray: "$months" },
                then: {
                  $let: {
                    vars: {
                      monthCount: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$months",
                              cond: { $eq: ["$$this._id.month", "$$month"] }
                            }
                          },
                          0
                        ]
                      }
                    },
                    in: { $ifNull: ["$$monthCount.count", 0] }
                  }
                },
                else: 0
              }
            }
          }
        }
      }
    }
  },
  {
    $unwind: "$months"
  },
  {
    $sort: { "months.month": 1 }
  }
];


export const getQuarterWiseUserData = async (req,res)=>{
  try {
        const getData = await User.aggregate(pipeline)
        if(getData)
          {
            handleSuccess(res,getData,"Users Data Fetched successfully quartehr wise",statusCode?.OK)
          }
        else
        {
          handleError(res,"Users Data failed to fetch",statusCode?.OK)
        }
  } catch (error) {
      console.log(error.message)
      handleError(res,error.message,statusCode?.INTERNAL_SERVER_ERROR)
  }
}
export const getallUserData = async (req,res)=>{
  try {
        const getData = await User.find()
        handleSuccess(res,getData,"Fetch all data",statusCode?.OK)
  } catch (error) {
    console.log(error.message)
    handleError(res,error.message,statusCode?.INTERNAL_SERVER_ERROR)
  }
}
export const getAllProvider = async (req,res)=>{
  try {
        const getData = await User.find({userType:"jobProvider"})
        handleSuccess(res,getData,"Fetch all data",statusCode?.OK)
  } catch (error) {
    console.log(error.message)
    handleError(res,error.message,statusCode?.INTERNAL_SERVER_ERROR)
  }
}

export const sentEmail = async (req,res)=>{
  // sent mail to the user when user is created
  const { name, email } = req.body;
  console.log(`Name: ${name}, Email: ${email}`);
  const transporter = createTransport({
    service: 'gmail',
    auth: {
      user: process.env.APP_EMAIL,
      pass: process.env.APP_PASSWORD
    }
  });

  const imagePath = path.join(path.resolve(), '/src/public/images/welcome.jpg');

  const mailOptions = {
    from: process.env.APP_EMAIL,
    to: email,
    subject: "Welcome to Easy Job",
    html: `Dear ${name},<br><br>
          <img src="cid:welcome" alt="Welcome" style="border-radius: 10px;"><br><br>
          Thank you for registering on our platform. We are excited to have you on board.<br><br>
          Best Regards,<br>
          Easy Job Teams`,
    attachments: [{
      filename: 'welcome.jpg',
      path: imagePath,
      cid: 'welcome'
    }]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      handleError(res, error.message, statusCode.INTERNAL_SERVER_ERROR);
    } else {
      console.log('Email sent: ' + info.response);
      handleSuccess(res, info.response, "Email sent successfully", statusCode.OK);
    }
  });
}