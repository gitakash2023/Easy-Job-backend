import mongoose from 'mongoose';

const applyJobsSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobProfile',
        required: true
    },
    information:{
        type: String
    },
    resume: {
        type: String
    }
}, {
    timestamps: { createdAt: 'timeStamp' }
});

const ApplyJobs = mongoose.model('ApplyJobs', applyJobsSchema);

export default ApplyJobs;
