// Import the Nodemailer library
const nodemailer = require("nodemailer");
// const { options } = require("../routes/auth");

// console.log`enterd in nodemailer`;
const resetPasswordMail = async (options) => {
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
  const passwordResetLink = `https://hooperdooper.in/reset-password/${options.resetToken}`;
  const mailOptions = {
    from: "HooperDooper@gmail.com",
    to: options.to, // list of receivers
    //   we can simply use array for multiple users
    subject: "Password Reset - Hooper Dooper",
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
            color: #fff;
            padding: 10px 20px;
            text-decoration: none;
            font-size: 18px;
            border-radius: 5px;
        }
        .verify-button:hover {
            background-color: #08389C;
            color: #fafafa;
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
        <h1>Reset your password</h1>
    </div>
    <div class="content">
        <p>Hi there,</p>

        <p>
            You are receiving this email because you requested a password reset for your Hooper Dooper account.

        </p>

        <div class="button-container">
            <a href="${passwordResetLink}" class="verify-button">Click Here to change password</a>
        </div>

        <p>If you did not request for password change, you can safely ignore this email.</p>

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

  console.log("password change email sent: %s", info.messageId);
  // Message sent: <d786aa62-4e0a-070a-47ed-0b0666549519@ethereal.email>
};

// Try catch wont work as a single router cant have multiple response
// try {
// } catch (error) {
//   console.log(error);
// //   console.log("Something lafda in registrationMail.js");
// }

module.exports = resetPasswordMail;
