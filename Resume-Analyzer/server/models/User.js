import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Model - The core of our Authentication System
 * These fields define what we know about our users.
 */

const userSchema = new mongoose.Schema({
    // name: User's full name
    // trim: true - Removes any accidentally added spaces before/after the name
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    // email: Unique indentifier for login
    // unique: true - Prevents two people from having the same email
    // match: ensures it follows a real email pattern (e.g. user@test.com)
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
            'Please add a valid email'
        ]
    },
    // password: Only required for local login (not for Google login)
    // select: false - This is a security measure! When we get a user 
    // from the database, Mongoose won't include the password unless we ask for it.
    password: {
        type: String,
        required: function() { return !this.googleId; }, // Only if Google login isn't used
        minlength: 6,
        select: false
    },
    // googleId: Stores the unique ID from Google OAuth
    // unique: true + sparse: true - IMPORTANT! 
    // This allows multiple users with no Google ID (null/undefined)
    // while still ensuring one Google account can't be linked to two local accounts.
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    avatar: {
        type: String,
        default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
    },
    // role: Defines what the user can do (Seeker vs Recruiter)
    // enum: Restricts the value to ONLY these options.
    role: {
        type: String,
        enum: ['seeker', 'recruiter', 'admin'],
        default: 'seeker'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    // needsRoleAssignment: Used specifically for Google OAuth users to 
    // force them to pick a role on their first login.
    needsRoleAssignment: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

/**
 * PRE-SAVE HOOK: This logic runs right BEFORE the user is saved to the database.
 * We use it to automatically hash (encrypt) the password so it's never stored in plain text.
 * salt: A random string added to the password to make hashing more secure.
 */
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return; // If the password wasn't changed, skip this.
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

/**
 * METHOD: Compare Password
 * This helper function allows us to check if a user provided the correct 
 * password when they try to log in.
 */
userSchema.methods.matchPassword = async function(enteredPassword) {
    // Google-only users have no password — reject email/password login attempts
    if (!this.password) return false;
    // bcrypt.compare checks if the plain text password matches the hashed one.
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
