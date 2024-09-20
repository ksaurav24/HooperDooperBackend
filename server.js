const expressSession = require("express-session");
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const app = express();
const port = 5000;
const bcrypt = require("bcrypt");
const saltRounds = 10;

const {
  registerInputValidation,
  loginInputValidation,
} = require("./middlewares/inputValidation.js");

require("dotenv").config();

const User = require("./models/userModel.js");

const {
  initializingPassport,
  isAuthenticated,
} = require("./passportconfig.js");
const { default: mongoose } = require("mongoose");

initializingPassport(passport);
app.use(
  expressSession({
    secret: "secretcode",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(passport.session());
app.use(passport.initialize());
app.use(cors());

app.use("/auth", require("./routes/auth.js"));

mongoose.connect(process.env.MONGO_URI);

app.post(
  "/login",
  loginInputValidation,
  passport.authenticate("local"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Logged in Successfully",
      user: req.user._id,
    });
  }
);

app.get("/logout", (req, res) => {
  try {
    req.logout(() => {
      res.status(200).json({
        success: true,
        message: "logged out",
      });
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to log out",
      error: error,
    });
  }
});

app.post("/register", registerInputValidation, async (req, res) => {
  const { name, password, email } = req.body;
  const username = email.split("@")[0];
  try {
    const emailExists = await User.findOne({ email });

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to check username or email",
      error: error,
    });
  }
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const user = new User({
    name: name,
    password: hashedPassword,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
  });

  await user.save();
  res.status(201).json({
    success: true,
    message: "User created",
    user: user._id,
  });
  // nodemailer Area
  const registrationMail = require("./controllers/registrationmail");
  console.log("Sending mail to user");
  await registrationMail({
    to: user.email,
    text: `Hello ${user.name}, your account has been successfully created on Codement. Please Complete the verification process to activate your account`,
    userId: user._id,
  });
  // nodemailer Area ends
});

// Route for Email Verification
app.get("/verifymail/:verificationKey", async (req, res) => {
  const verificationKey = req.params.verificationKey;

  // Getting user using verificationKey
  try {
    const user = await User.findOne({ verificationKey });
    // If user not found
    if (!user) {
      res.status(404).json({
        message: "Invalid Verification Token",
        success: false,
      });
    }
    const date = Date.now();

    const verificationKeyExpiry = user.verificationKeyExpiry;

    // If verification token is expired
    if (date >= verificationKeyExpiry) {
      res.status(400).json({
        success: false,
        message: "Verification Token Expired",
      });
    }
    // If verification token is valid
    await User.findByIdAndUpdate(user._id, {
      isVerified: true,
      verificationKey: null,
      verificationKeyExpiry: null,
    });
    // Updating user to verified
    res.status(200).json({
      success: true,
      message: "Email Verified Successfuly ",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to verify email",
      error: error,
    });
  }
});

app.get("/isauthenticated", (req, res) => {
  if (req.user) {
    return res.status(200).json({
      authenticated: true,
      message: "user authenticated",
    });
  }
  res.json({
    authenticated: false,
    message: "user not authenticated",
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
