import mongoose from "mongoose";
const { Schema, model } = mongoose;
const userSchema = new Schema({
  name: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid email format");
      }
    },
  },
  alterNateNumber: {
    type: String,
    trim: true,
    validate(value) {
      if (!value.match(/^\d{10}$/)) {
        throw new Error("Invalid mobile number format");
      }
    },
  },
  userType: {
    type: String,
    enum: ["jobSeeker", "jobProvider"],
  },
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate(value) {
      if (!value.match(/^\d{10}$/)) {
        throw new Error("Invalid mobile number format");
      }
    },
  },
  isBlocked:{
    type:Boolean,
    default:false
  },
  likeJobs:{
    type:[mongoose.Schema.Types.ObjectId],
    ref:"JobProfile"
  },
  deviceId: {
    type: String,
    trim: true,
  },
  deviceToken: {
    type: String,
    trim: true,
  },
  otp: {
    type: String,
    trim: true,
  },
  alternateMobileNumber: {
    type: String,
    trim: true,
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },
  DOB: {
    type: Date,
  },
  address: {
    type: String,
    trim: true,
  },
  companyLogo: {
    type: String,
  },
  companyName: {
    type: String,
  },
  companyEmail: {
    type: String,
  },
  companyAddress: {
    type: String,
  },
  companyInformation: {
    type: String,
  },
  jobType: {
    type: String,
  },
  subCategory:{
    type:String
  },
  availability: {
    type: String,
  },
  education:{
    type:String,
  },
  experience: {
    type: String,
  },
  skills: {
    type: [String],
  },
  currentSalary: {
    type: String,
  },
  information: {
    type: String
  },
  expectedSalary: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },

});
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
const User = model("User", userSchema);
export default User;
