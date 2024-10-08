import mongoose from "mongoose";
const { Schema } = mongoose;
const messageSchema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  senderType: {
    type: String,
    enum: ["user", "admin"],
    required: true,
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  isDeleted:{
    type:Boolean,
    default:false
  },
  type:{
    type:String,
    enum:["pdf","text","image"],
    required:true
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  threadId: {
   type:String
  },
});

export default mongoose.model("Message", messageSchema);
