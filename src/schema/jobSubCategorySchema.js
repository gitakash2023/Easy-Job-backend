import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const jobSubCategorySchema = new Schema({
  jobCategoryId: {
    type: Schema.Types.ObjectId,
    ref: 'JobCategory', 
    required: true
  },
  name: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const JobSubCategory = model('JobSubCategory', jobSubCategorySchema);

export default JobSubCategory;
