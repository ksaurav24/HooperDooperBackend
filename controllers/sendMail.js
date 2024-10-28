// Import the Nodemailer library
const nodemailer = require("nodemailer");
// const { options } = require("../routes/auth");

// console.log`enterd in nodemailer`;
const sendMail = async (options) => {
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
  const { subject, message } = options;
  let subjectHeading = "";
  switch (subject) {
    case "Regarding Order Cancellation":
      subjectHeading = "Order Cancellation Information";
      break;
    case "Regarding Order Status":
      subjectHeading = "Order Status Update";
      break;
    case "Regarding Order Refund":
      subjectHeading = "Order Refund Details";
      break;
    case "Regarding Ticket":
      subjectHeading = "Customer Support Ticket";
      break;
    default:
      subjectHeading = "Important Information from HooperDooper.in";
  }
  const mailOptions = {
    from: "HooperDooper@gmail.com",
    to: options.to, // list of receivers
    //   we can simply use array for multiple users
    subject: `${subject} - Hooper Dooper`,
    text: options.text,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Email Template</title>
<style>
    body {
        font-family: Arial, sans-serif;
        background-color: #f7f7f7;
        margin: 0;
        padding: 0;
        color: #333;
    }
    .email-container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    .email-header {
        background-color: #0A4ADC;
        padding: 15px;
        color: #ffffff;
        text-align: center;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
    }
    .email-header h1 {
        font-size: 20px;
        margin: 0;
    }
    .email-content {
        padding: 20px;
        line-height: 1.6;
    }
    .email-content h2 {
        font-size: 18px;
        color: #0A4ADC;
    }
    .email-content p {
        margin: 10px 0;
    }
    .email-footer {
        margin-top: 20px;
        text-align: center;
        font-size: 14px;
        color: #666;
    }
    .email-footer a {
        color: #0A4ADC;
        text-decoration: none;
    }
</style>
</head>
<body>
<div class="email-container">
    <!-- Email Header -->
    <div class="email-header">
        <h1>HooperDooper.in - ${subject}</h1>
    </div>
    
    <!-- Email Content -->
    <div class="email-content">
        <!-- Subject Heading based on Type -->
        <h2>${subjectHeading}</h2>
        
        <!-- Main Message Body -->
        <p>${message}</p>
        
        <!-- Additional Note for All Emails -->
        <p>If you have any questions, feel free to reply to this email, or visit our website for more information.</p>
    </div>
    
    <!-- Email Footer -->
    <div class="email-footer">
        <p>Thank you for choosing HooperDooper.in!</p>
        <p>Visit us at <a href="https://www.hooperdooper.in">www.hooperdooper.in</a></p>
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

module.exports = sendMail;
