import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    message: {
        type: String,
        required: true
    },
    link: {
        type: String, // e.g. /applications/67890
        default: ''
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expires: '30d' });

export default mongoose.model('Notification', notificationSchema);
