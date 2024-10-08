import mongoose from 'mongoose';

const contactUsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  }
});

const ContactUs = mongoose.model('ContactUs', contactUsSchema);

export default ContactUs;
