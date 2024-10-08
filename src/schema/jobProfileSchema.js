import mongoose from 'mongoose';

const { Schema } = mongoose;

const jobProfileSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobName: {
    type: String,
    required: true
  },
  subCategory:{
    type:String
  },
  likedUsers:{
    type: [mongoose.Schema.Types.ObjectId],
    ref:'User'
  },
  applyUsers:{
    type: [mongoose.Schema.Types.ObjectId],
    ref:'User'
  },
  status:{
    type:Boolean,
    default:false
  },  
  isReported:{
    type:Boolean,
    default:false
  },
  jobType: {
    type: String, 
    required: true
  },
  education: {
    type: String
  },
  address: {
    type: String
  },
  startingSalary: {
    type: Number
  },
  maximumSalary: {
    type: Number
  },
  totalNumberOfStaff: {
    type: Number
  },
  minimumExperience: {
    type: Number
  },
  maximumExperience: {
    type: Number
  },
  genderOfStaffShouldBe: {
    type: String,
    required: true
  },
  candidateSpeakingSkillShouldBe: {
    type: String,
    enum: ['Do not speak English', 'Speak Good English', 'Speak Fluent English']
  },
  isWorkFromHome: {
    type: Boolean,
    default: true
  },
  availablity: {
    type: String,
    enum: [
      'Full-time',
      'Part-time',
      'Contract',
      'Freelance',
      'Internship',
      'Temporary',
      'Remote',
      'On-site',
      'Project-based',
      'Volunteer',
    ],
    required: true
  },
  skills: {
    type: [String]
  },
  suggestedSkills: {
    type: [String]
  },
  jobDescriptions: {
    type: String
  },
  image: {
    type: String
  }
}, { timestamps: true });

const JobProfile = mongoose.model('JobProfile', jobProfileSchema);

export default JobProfile;
