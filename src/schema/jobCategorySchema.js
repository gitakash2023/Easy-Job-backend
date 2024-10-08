import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const jobCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  icons:{
    type:String
  },
  isPopularType:{
    type:Boolean
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const JobCategory = model('JobCategory', jobCategorySchema);

export default JobCategory;
