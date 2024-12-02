// import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// import { Strategy as FacebookStrategy } from 'passport-facebook';
// import User from '../models/User.js';
// import passport from 'passport';
// import dotenv from 'dotenv';
// import { fileURLToPath } from 'url';
// import path from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Charger les variables d'environnement avec un chemin absolu
// dotenv.config({ path: path.join(__dirname, '../.env') });

// // Vérification des variables d'environnement
// // console.log('Checking environment variables from:', path.join(__dirname, '../.env'));
// // console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
// // console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);

// // // Temporaire, pour debug uniquement
// // process.env.GOOGLE_CLIENT_ID = 'votre_client_id';
// // process.env.GOOGLE_CLIENT_SECRET = 'votre_client_secret';

// // if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
// //     throw new Error('Missing required Google OAuth credentials');
// // }

// // Google Strategy
// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "/auth/google/callback"
// }, async (accessToken, refreshToken, profile, done) => {
//     const email = profile.emails[0].value;
//     const name = profile.displayName;

//     try {
//         let user = await User.findOne({ email });

//         if (user) {
//             return done(null, user);
//         } else {
//             user = new User({
//                 name,
//                 email,
//                 password: null,
//                 oauthProvider: 'google'
//             });
//             await user.save();
//             return done(null, user);
//         }
//     } catch (error) {
//         return done(error, false);
//     }
// }));

// // Facebook Strategy
// passport.use(new FacebookStrategy({
//     clientID: process.env.FACEBOOK_CLIENT_ID,
//     clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
//     callbackURL: "/api/auth/facebook/callback",
//     profileFields: ['id', 'displayName', 'emails']
// }, async (accessToken, refreshToken, profile, done) => {
//     const email = profile.emails[0].value;
//     const name = profile.displayName;

//     try {
//         let user = await User.findOne({ email });

//         if (user) {
//             return done(null, user);
//         } else {
//             user = new User({
//                 name,
//                 email,
//                 password: null,
//                 oauthProvider: 'facebook'
//             });
//             await user.save();
//             return done(null, user);
//         }
//     } catch (error) {
//         return done(error, false);
//     }
// }));

// // Serialize and Deserialize User
// passport.serializeUser((user, done) => {
//     done(null, user.id);
// });

// passport.deserializeUser(async (id, done) => {
//     try {
//         const user = await User.findById(id);
//         done(null, user);
//     } catch (error) {
//         done(error, null);
//     }
// });

// export default passport;
