import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import colors from 'colors';

/**
 * GOOGLE OAUTH Strategy: Allows users to log in with 1-click!
 * This is how large apps use "Sign in with Google".
 */

const configurePassport = () => {
    // Check if keys are present. If not, don't initialize Google Strategy.
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.warn('⚠️  GOOGLE AUTH: Missing Client ID/Secret. Google Login is DISABLED.'.yellow.bold);
        return;
    }

    passport.use(new GoogleStrategy({
        // Get these from Google Cloud Console:
        // https://console.cloud.google.com/
        // API & Services -> Credentials -> Create OAuth 2.0 Client ID
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
        proxy: true 
    },
    async (accessToken, refreshToken, profile, done) => {
        // This is the "Verify Function". 
        // Google sends us a "profile" object with the user's data!
        try {
            // 1. Check if user already exists (Search by googleId)
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                return done(null, user);
            }

            // 2. Check if user already exists by EMAIL (but maybe signed up with email/pass before)
            user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // Link this Google account to the existing email account!
                user.googleId = profile.id;
                await user.save();
                return done(null, user);
            }

            // 3. Create NEW User if they don't exist at all
            const newUser = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                avatar: profile.photos[0].value,
                isVerified: true // Google emails are already verified!
            });

            done(null, newUser);
        } catch (err) {
            console.error(err);
            done(err, null);
        }
    }));
};

export default configurePassport;
