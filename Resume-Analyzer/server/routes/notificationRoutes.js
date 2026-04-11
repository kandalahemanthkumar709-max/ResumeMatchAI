import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// GET /api/notifications
router.get('/', protect, async (req, res) => {
    const notifications = await Notification.find({ userId: req.user._id })
        .sort('-createdAt')
        .limit(10);
    res.json(notifications);
});

// PATCH /api/notifications/mark-all-read  ← must be BEFORE /:id/read
router.patch('/mark-all-read', protect, async (req, res) => {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', protect, async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        { isRead: true },
        { returnDocument: 'after' }
    );
    res.json(notification);
});

// DELETE /api/notifications/:id
router.delete('/:id', protect, async (req, res) => {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
});

export default router;
