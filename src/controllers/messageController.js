import mongoose from "mongoose";
import axios from "axios";
import messageSchema from "../schema/messageSchema.js";
import statusCode from "../constants/statusCode.js";
import User from "../schema/userSchema.js";
import adminAuthSchema from "../schema/adminAuthSchema.js";
import { handleSuccess, handleError } from "../responseHandler/response.js";
import { initializeApp } from "firebase-admin/app";
initializeApp()
function sendNotification(name,to) {
  console.log("Inside send Notification Registration");
  let data = JSON.stringify({
    registration_ids: [to],
    notification: {
      body: `${name} sends a new message`,
      title: "Paygo",
    },
  });
  console.log("Inside send data", data);
  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://fcm.googleapis.com/fcm/send",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "key=AAAASYFyFSI:APA91bFSemnTfW8thcD-BaA2EgI9YV9ebNnBcgHEpJyTxihRoEdCuE25iZ5CMvcX3wxvL1BlQsTw4P92B-AS1z9NzxAh7wcXc-Ydyae79tLOarUR1WFTC-ZI7Q4PBkNHOof9dObQSE3K",
    },
    data: data,
  };

  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
}
export const sendMessage = async (req, res) => {
  try {
    const { message, reciverId, type } = req.body;
    console.log(reciverId, req.body);
    const senderId = req.user;
    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const reciverObjectId = new mongoose.Types.ObjectId(reciverId);
    const isSenderUserType = await User.findOne({ _id: senderObjectId });
    const isSenderAdminType = await adminAuthSchema.findOne({
      _id: senderObjectId,
    });
    const getReciverDetails = await User.findOne({_id:reciverObjectId})
    if (isSenderUserType) {
      const threadId = reciverId + senderId;
      const reciverIsExist = await adminAuthSchema.findOne({
        _id: reciverObjectId,
      });
      if (reciverIsExist) {
        const createMessage = await messageSchema.create({
          message,
          senderType: "user",
          senderId: senderObjectId,
          recipientId: reciverObjectId,
          type,
          threadId,
        });
        if (createMessage) {
          handleSuccess(
            res,
            createMessage,
            "Your Message is Send to Admin Successfully",
            statusCode?.OK
          );
        } else {
          handleError(res, "Message sending fail", statusCode?.BAD_REQUEST);
        }
      } else {
        handleError(res, "This Reciver is not exist", statusCode?.BAD_REQUEST);
      }
    } else if (isSenderAdminType) {
      const reciverExist = await User.findOne({ _id: reciverObjectId });
      const threadId = senderId + reciverId;
      if (reciverExist) {
        const createMessage = await messageSchema.create({
          message,
          senderType: "admin",
          senderId: senderObjectId,
          recipientId: reciverObjectId,
          threadId,
          type,
        });
        sendNotification(isSenderAdminType?.name,getReciverDetails?.deviceToken)
        if (createMessage) {
          handleSuccess(
            res,
            createMessage,
            "Your Message is Send to reciver successfully",
            statusCode?.OK
          );
        } else {
          handleError(res, "Message Seding fail", statusCode?.BAD_REQUEST);
        }
      } else {
        handleError(res, "THis user is not exist", statusCode?.BAD_REQUEST);
      }
    } else {
      handleError(res, "Some thing wents wrong", statusCode?.BAD_REQUEST);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const searchUser = async (req, res) => {
  try {
    const userId = req.user;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const checkAdmin = await adminAuthSchema.findOne({ _id: userObjectId });
    if (!checkAdmin) {
      const CheckUser = await User.findOne({ _id: userObjectId });
      if (CheckUser) {
        const messages = await messageSchema.find({ senderId: userObjectId,isDeleted: false })
        .sort({ _id: -1 });
        console.log("===============>>>>>>>>Messages",messages)
        if(!messages)
        {
          handleSuccess(res,[],"no message FOund",statusCode?.OK)
        }
        else
        {
          const uniqueSenderIdsSet = new Set(
            messages.map((message) => message.recipientId.toString())
          );
          const uniqueMessages = new Map();
          messages.forEach((message) => {
            const senderIdString = message.recipientId.toString();
            if (!uniqueMessages.has(senderIdString)) {
              uniqueMessages.set(senderIdString, message);
            }
          });
          const uniqueMessagesArray = Array.from(uniqueMessages.values());
          const uniqueSenderIds = Array.from(uniqueSenderIdsSet);
          const uniqueSenderObjectIds = uniqueSenderIds.map(
            (id) => new mongoose.Types.ObjectId(id)
          );
          const userDetail = await adminAuthSchema
            .find({
              _id: { $in: uniqueSenderObjectIds },
            })
            .lean();
          const combinedData = uniqueMessagesArray.map((message) => {
            const matchingDetails = userDetail.find(
              (user) => user?._id.toString() === message?.recipientId.toString()
            );
            return {
               message,
               matchingDetails,
            };
          });
          handleSuccess(
            res,
            combinedData,
            "Message fetch success fully",
            statusCode?.OK
          );
        }
        
      }
    } else {
      const messages = await messageSchema
        .find({
          recipientId: userObjectId,
          isDeleted: false,
        })
        .sort({ _id: -1 });
      const uniqueSenderIdsSet = new Set(
        messages.map((message) => message.senderId.toString())
      );
      const uniqueMessages = new Map();

      messages.forEach((message) => {
        const senderIdString = message.senderId.toString();
        if (!uniqueMessages.has(senderIdString)) {
          uniqueMessages.set(senderIdString, message);
        }
      });
      const uniqueMessagesArray = Array.from(uniqueMessages.values());
      console.log(uniqueMessagesArray);
      const uniqueSenderIds = Array.from(uniqueSenderIdsSet);
      const uniqueSenderObjectIds = uniqueSenderIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
      const userDetail = await User.find({
        _id: { $in: uniqueSenderObjectIds },
      }).lean();
      const combinedData = uniqueMessagesArray.map((message) => {
        const matchingDetails = userDetail.find(
          (user) => user?._id.toString() === message?.senderId.toString()
        );

        return {
          message: {
            _id: message._id,
            senderId: message.senderId,
            senderType: message.senderType,
            recipientId: message.recipientId,
            isDeleted: message.isDeleted,
            type: message.type,
            message: message.message,
            threadId: message.threadId,
            timestamp: message.timestamp,
            __v: message.__v,
          },
          matchingDetails: matchingDetails || {},
        };
      });
      handleSuccess(
        res,
        combinedData,
        "Message fetch success fully",
        statusCode?.OK
      );
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.BAD_REQUEST);
  }
};
export const getListOfMessage = async (req, res) => {
  try {
    const threadId = req.query.id
    const findMessages = await messageSchema
  .find({ threadId, $or: [{ isDeleted: { $ne: true } }, { isDeleted: { $exists: false } }] })
  .sort({ id: -1 });

      console.log("==>>>fndMessages",findMessages)
    if (findMessages) {
      handleSuccess(
        res,
        findMessages,
        "All message fetched successfullly",
        statusCode?.OK
      );
    } else {
      handleSuccess(res, [], "No data Found", statusCode?.OK);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
export const deleteMessages = async (req, res) => {
  try {
    const userId = req.user;
    const selectUser = req.query.user;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const reciverObjectId = new mongoose.Types.ObjectId(selectUser);
    const findMessages = await messageSchema.find({
      senderId: userObjectId,
      recipientId: reciverObjectId,
    });
    console.log(
      "===========>>>>>>>>Messages",
      userObjectId,
      reciverObjectId,
      findMessages
    );
    const threadId = userObjectId+reciverObjectId
    const findMessage = await messageSchema.findOne({threadId})
    console.log(findMessage)
    const ssssss = await messageSchema.findOneAndUpdate({threadId},{isDeleted:true})
    console.log("====>>>>>",ssssss)
    const deleteMessages = await messageSchema.updateMany(
      { threadId },
      { isDeleted: true },
      { new: true }
    );
    // const deleteLastMessage = await messageSchema.findOneAndUpdate({recipientId:userObjectId,senderId:reciverObjectId},{isDeleted:true},{new:true})
    if (deleteMessages) {
      handleSuccess(
        res,
        deleteMessages,
        "Delete messages successfully",
        statusCode?.OK
      );
    } else {
      handleError(res, "Delete Message fail", statusCode?.BAD_REQUEST);
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};
