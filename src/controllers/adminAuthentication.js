import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import adminAuthSchema from "../schema/adminAuthSchema.js";
import {
  handleError,
  handleSuccess,
} from "../responseHandler/response.js";
import statusCode from "../constants/statusCode.js";
export const login = async (req, res) => {
  try {
      const { email, password } = req.body;
      const userData = await adminAuthSchema.findOne({ email });
      const userDataWP = await adminAuthSchema.findOne({ email }).select("-password");
      if (!userData || !(await bcrypt.compare(password, userData.password))) {
        handleError(res, "Invalid email or password", statusCode.BAD_REQUEST);
        return;
      }
      const token = jwt.sign(
        { userId: userData._id, userEmail: userData.email },
        process.env.SECRET_KEY
      );
      handleSuccess(
        res,
        {
          token,
          loggedInUser: userDataWP,
        },
        "User login successful",
        statusCode.OK
      );

  } catch (err) {
    console.error(err);
    handleError(res, err.message, statusCode.INTERNAL_SERVER_ERROR);
  }
};
export const createAdmin = async (req, res) => {
  try {
    const { email, name, mobileNumber, password } = req.body;
    const checkExistEmail = await adminAuthSchema.findOne({ email });
    console.log(checkExistEmail);
    const checkExistMobileNumber = await adminAuthSchema.findOne({
      mobileNumber,
    });
    if (checkExistEmail) {
      handleError(
        res,
        "This Admin Email Already exist",
        statusCode?.BAD_REQUEST
      );
    } else if (checkExistMobileNumber) {
      handleError(
        res,
        "This Admin Mobile Number Already exist",
        statusCode?.BAD_REQUEST
      );
    } else {
      const createAdmin = await adminAuthSchema.create({
        email,
        name,
        password,
        mobileNumber,
      });
      if (createAdmin) {
        handleSuccess(res, createAdmin, "New Admin is created", statusCode?.OK);
      } else {
        handleError(res, "Admin creation failed", statusCode?.BAD_REQUEST);
      }
    }
  } catch (error) {
    handleError(res, error.message, statusCode?.INTERNAL_SERVER_ERROR);
  }
};