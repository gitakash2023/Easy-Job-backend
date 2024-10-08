import mongoose from 'mongoose';

const reportedJobSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reportedJob: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobProfile',
        required: true
    },
    title: {
        type: String,   
        required: true
    },
    reportReason: {
        type: String,
        required: true
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const ReportedJob = mongoose.model('ReportedJob', reportedJobSchema);

export default ReportedJob;
