// Import the Nodemailer library
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/userModel.js");
// const { options } = require("../routes/auth");

// console.log`enterd in nodemailer`;
const registrationMail = async (options) => {
  // Create a transporter object
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // use false for STARTTLS; true for SSL on port 465
    auth: {
      user: "community.codement@gmail.com",
      pass: "abqj szms pnfo qucs",
    },
  });

  // Generate a verification key
  const verificationKey = uuidv4();
  // get the current date and add 1 hour to it
  const date = Date.now();
  const verificationKeyExpiry = date + 3600000;
  // Update the user with the verification key and expiry
  try {
    await User.findByIdAndUpdate(options.userId, {
      verificationKey,
      verificationKeyExpiry,
    });
  } catch (error) {
    console.log(error);
  }
  // Configure the mailoptions object
  //   console.log`object created`;
  //   console.log`options: ${options}`;
  const mailOptions = {
    from: "community.codement@gmail.com",
    to: options.to, // list of receivers
    //   we can simply use array for multiple users
    subject: "Welcome to Codement! Verify your email",
    text: options.text,
    html: `<h1>Please verify your email by</h1> <a href="http://localhost:5000/verifymail/${verificationKey}> Clicking Here </a>`,
  };

  const info = await transporter.sendMail(mailOptions);
  transporter.close();

  console.log("Message sent: %s", info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
};

// Try catch wont work as a single router cant have multiple response
// try {
// } catch (error) {
//   console.log(error);
// //   console.log("Something lafda in registrationMail.js");
// }

module.exports = registrationMail;
