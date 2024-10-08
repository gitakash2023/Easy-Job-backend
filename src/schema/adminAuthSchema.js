import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const adminAuthSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  email: {
    type: String,
    required: true,
    unique:true,
    validate: {
      validator: (email) => /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      message: 'Invalid email format'
    }
  },
  mobileNumber:{
    type:String,
    required:true,
    unique:true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
});
adminAuthSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(this.password, saltRounds);
    this.password = hashedPassword;
    next();
  } catch (error) {
    return next(error);
  }
});

export default mongoose.model('AdminAuth', adminAuthSchema);
