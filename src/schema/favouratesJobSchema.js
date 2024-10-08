import mongoose from 'mongoose';

const favouratedJobProfile = new mongoose.Schema({
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
},{
    timestamps: { createdAt: 'timeStamp' }
})
export default mongoose.model('favourateJob', favouratedJobProfile);
