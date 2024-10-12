const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/userModel.js");
const dotenv = require("dotenv");
dotenv.config();

const bcrypt = require("bcrypt");
exports.initializingPassport = async (passport) => {
  passport.use(
    new LocalStrategy(async function (username, password, done) {
      console.log(username);
      const user = await User.findOne({ username });
      try {
        console.log(user);
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

  passport.serializeUser(function (user, done) {
    done(null, user.id);
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
};

exports.isAuthenticated = (req, res, next) => {
  console.log("user :" + req.user);
  console.log(req.session);
  if (req.user) {
    return next();
  }
  res.status(401).json({
    authenticated: false,
    message: "user not authenticated apun ka error",
  });
};

var GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async function (accessToken, refreshToken, profile, cb) {
      try {
        const user = await User.findOne({ googleId: profile.id });
        if (user) {
          return cb(null, user);
        } else {
          const newUser = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            profilePicture: profile._json.picture,
            username: `${profile.name.givenName.toLowerCase()}${profile.id.slice(
              0,
              5
            )}`,
          });
          return cb(null, newUser);
        }
      } catch (error) {
        return cb(error, null);
      }
    }
  )
);
