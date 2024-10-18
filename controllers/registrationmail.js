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
  const verificationLink = `https://api.hooperdooper.in/auth/verify-email/${verificationKey}`;
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
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification - Hooper Dooper</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .header {
            background-color: #0A4ADC; /* Hooper Dooper brand color */
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background-color: white;
            padding: 20px;
            border-radius: 0 0 10px 10px;
        }
        .button-container {
            text-align: center;
            margin: 20px 0;
        }
        .verify-button {
            background-color: #0A4ADC;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            font-size: 18px;
            border-radius: 5px;
        }
        .verify-button:hover {
            background-color: #08389C;
        }
        .footer {
            font-size: 12px;
            color: #777;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Verify Your Email</h1>
    </div>
    <div class="content">
        <p>Hi there,</p>

        <p>Thank you for registering with Hooper Dooper! Please verify your email address by clicking the button below. The verification link will expire in 15 minutes, so be sure to confirm your email promptly.</p>

        <div class="button-container">
            <a href="${verificationLink}" class="verify-button">Click Here to Verify Your Email</a>
        </div>

        <p>If you did not sign up for this account, you can safely ignore this email.</p>

        <p>Best regards,<br>The Hooper Dooper Team</p>

        <div class="footer">
            <p>Please note: This link will expire in 15 minutes. If the link has expired, you can request a new verification email.</p>
        </div>
    </div>
</body>
</html>
`,
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
