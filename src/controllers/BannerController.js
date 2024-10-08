import mongoose from "mongoose";
import Banner from "../schema/bannerSchema.js";
import {
  handleSuccess,
  handleError,
} from "../responseHandler/response.js";
import statusCode from "../constants/statusCode.js";

export const addBanner = async(req,res)=>{
    try {
            const {image,title} = req.body
            const createBanner = await Banner.create({image,title})
            if(createBanner) 
                {
                    handleSuccess(res,createBanner,"Banner Created SuccessFully",statusCode?.OK)
                }
            else
            {
                handleError(res,"Banner Created Failed",statusCode?.OK)
            }
    } catch (error) {
        handleError(res,error.message,statusCode?.INTERNAL_SERVER_ERROR)
    }
}
//Get Banner List 
export const getBanner = async(req,res)=>{
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
            const bannerList = await Banner.find().skip(skip)
            .limit(limit).sort({_id:-1})
            if(bannerList) 
                {
                    handleSuccess(res,bannerList,"Banner List Fetched SuccessFully",statusCode?.OK)
                }
            else
            {
                handleError(res,"Banner List fetch Failed",statusCode?.OK)
            }
    } catch (error) {
        handleError(res,error.message,statusCode?.INTERNAL_SERVER_ERROR)
    }
}
//Action Edit and Delte
export const editBanner = async(req,res)=>{
    try {
            const BannerId = new mongoose.Types.ObjectId(req.query.id);
            const {image,title} = req.body
            const bannerUpdateProfile = {};
            if (image) bannerUpdateProfile.image = image;
            if (title) bannerUpdateProfile.title = title;
            const updateBanner = await Banner.findOneAndUpdate({_id:BannerId},{$set:bannerUpdateProfile},{new:true})
            if(updateBanner) 
                {
                    handleSuccess(res,updateBanner,"Banner Updated SuccessFully",statusCode?.OK)
                }
            else
            {
                handleError(res,"Banner Update Failed",statusCode?.OK)
            }
    } catch (error) {
        handleError(res,error.message,statusCode?.INTERNAL_SERVER_ERROR)
    }
}
export const deleteBanner = async(req,res)=>{
    try {
            const BannerId = new mongoose.Types.ObjectId(req.query.id);
            const deleteBannerdata = await Banner.findOneAndDelete({_id:BannerId})
            console.log(deleteBanner)
            if(deleteBannerdata) 
                {
                    handleSuccess(res,deleteBannerdata,"Banner Deleted SuccessFully",statusCode?.OK)
                }
            else
            {
                handleError(res,"Banner delete Failed",statusCode?.OK)
            }
    } catch (error) {
        handleError(res,error.message,statusCode?.INTERNAL_SERVER_ERROR)
    }
}