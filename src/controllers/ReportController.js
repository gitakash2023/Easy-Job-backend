import mongoose from "mongoose";
import {
  handleSuccess,
  handleFail,
  handleError,
} from "../responseHandler/response.js";
import statusCode from "../constants/statusCode.js";
import ReportedJob from "../schema/reportJobsSchema.js";
import JobProfile from "../schema/jobProfileSchema.js";
export const createReport = async (req, res) => {
  try {
    const userId = req.user;
    const jobId = req.query.jobId;
    if (!jobId) {
      handleError(res, "JOb Id is required", statusCode?.BAD_REQUEST);
    } else {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const jobObjectId = new mongoose.Types.ObjectId(jobId);
      const existJob = await JobProfile.findOne({ _id: jobObjectId });
      if (!existJob) {
        handleError(res, "This Job is not exist", statusCode?.BAD_REQUEST);
      } else {
        const { title, reportReason } = req.body;
        const existJob = await JobProfile.findOneAndUpdate({ _id: jobObjectId },{isReported:true});
        const createReportJob = await ReportedJob.create({
          userId: userObjectId,
          reportedJob: jobObjectId,
          title,
          reportReason,
        });
        if (createReportJob) {
          handleSuccess(
            res,
            createReportJob,
            "Job reported successfully",
            statusCode?.OK
          );
        } else {
          handleError(res, "Job Reported fail", statusCode?.BAD_REQUEST);
        }
      }
    }
  } catch (error) {
    handleFail(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const getReportJob = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);
    const skip = (page - 1) * limit;
    const getReportJobData = await ReportedJob.find()
      .populate("userId")
      .populate({
        path: "reportedJob",
        populate: {
          path: "userId",
        },
      })
      .skip(skip)
      .limit(limit)
      .sort({ _id: -1 })
      .lean();
    if (getReportJobData) {
      handleSuccess(
        res,
        getReportJobData,
        "All report job fetch successfully",
        statusCode?.OK
      );
    } else {
      handleError(res, "Report Job fetch failed", statusCode?.OK);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const deleteReportJobs = async (req, res) => {
  try {
    const jobId = new mongoose.Types.ObjectId(req.query.id);
    console.log(jobId)
    const deleteJobProfiles = await JobProfile.findOneAndDelete({ _id: jobId });
    console.log("====>>>deleteJobProfiles",deleteJobProfiles)
    await ReportedJob.deleteMany({ reportedJob: jobId });
    if (deleteJobProfiles) {
      handleSuccess(
        res,
        deleteJobProfiles,
        "Job Deleted Successfully",
        statusCode?.OK
      );
    } else {
      handleFail(res, "Job Deleted Fail", statusCode?.OK);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
