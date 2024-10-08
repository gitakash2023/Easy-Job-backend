import express from 'express';
import { sendMessage,searchUser,getListOfMessage ,deleteMessages } from '../controllers/messageController.js';
import verifyAuthToken from '../middileware/JwtVerify.js';
const messageRouter = express.Router();
messageRouter.post("/",verifyAuthToken,sendMessage)
messageRouter.get("/get-users",verifyAuthToken,searchUser)
messageRouter.get("/get-message",verifyAuthToken,getListOfMessage)
messageRouter.post("/delete-messages",verifyAuthToken,deleteMessages)
export default messageRouter;