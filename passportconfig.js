const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/userModel");
const dotenv = require("dotenv");
dotenv.config();

const bcrypt = require("bcrypt");
exports.initializingPassport = async (passport) => {
  passport.use(
    new LocalStrategy(async function (username, password, done) {
      const user = await User.findOne({ username });
      try {
        if (!user) {
          return done(null, false, { message: "user not found" });
        }
        if (!user.password) {
          return done(null, false, { message: "please login with google" });
        }
        if (!(await bcrypt.compare(password, user.password))) {
          return done(null, false, { message: "incorrect username" });
        }
        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    })
  );
};

exports.isAuthenticated = (req, res, next) => {
  // console.log(req.user);
  if (!req.user) {
    return res.status(401).json({
      authenticated: false,
      message: "user not authenticated please login",
    });
  }
  // console.log("authenticated");
  next();
};

var GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "https://api.hooperdooper.in/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, email, cb) {
      try {
        const user = await User.findOne({ googleId: profile.id });
        if (user) {
          return cb(null, user);
        } else {
          const user = await new User({
            googleId: email.id,
            email: email.emails[0].value,
            fullName: email.displayName,
            profilePicture: email._json.picture,
            username: email.emails[0].value.split("@")[0],
            isVerified: true,
          });
          const newUser = await user.save();
          return cb(null, newUser);
        }
      } catch (error) {
        return cb(error, null);
      }
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user._id);
});
passport.deserializeUser(async function (id, done) {
  try {
    const user = await User.findById(id);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    return done(error, false);
  }
});
