const expressSession = require("express-session");
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const passport = require("passport");
const app = express();
const port = 5000;
const bcrypt = require("bcrypt");
const saltRounds = 10;
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
// app.use(helmet());

const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);

const {
  validateTicketInput,
  registerInputValidation,
  loginInputValidation,
  validateOrderInput,
} = require("./middlewares/inputValidation.js");
const isAdmin = require("./middlewares/admin.middleware.js");

require("dotenv").config();

const User = require("./models/userModel.js");

const {
  initializingPassport,
  isAuthenticated,
} = require("./passportconfig.js");
const { default: mongoose } = require("mongoose");
const Order = require("./models/ordersModel.js");
const OrderItem = require("./models/orderItem.model.js");
const Ticket = require("./models/ticket.Model.js");
const isVerified = require("./middlewares/isVerified.middleware.js");
const verifyJwt = require("./middlewares/verifyJwt.js");

initializingPassport(passport);
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      // secure: true, // HTTPS-only
      // httpOnly: true, // Prevent client-side JavaScript from accessing cookies
      // sameSite: "strict", // Prevent CSRF
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.use(cors(
  {
    origin: "http://localhost:5173",
    credentials: true,
  }
));

app.use("/auth", require("./routes/auth.js"));

mongoose.connect(process.env.MONGO_URI);

app.post("/auth/v1/login", loginInputValidation, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Please login with google",
      });
    }
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).json({
      success: true,
      message: "Logged in",
      token: token,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to login",
    });
    console.log(error);
  }
});

app.get("/auth/v1/logout", (req, res) => {
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
    });
    console.log(error);
  }
});

app.post("/auth/v1/register", registerInputValidation, async (req, res) => {
  try {
    const { fullName, password, email } = req.body;
    const username = email.split("@")[0];
    console.log(username);
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
      });
      console.log(error);
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = new User({
      fullName: fullName,
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
      text: `Hello ${user.name}, your account has been successfully created on Hooper Dooper. Please Complete the verification process to activate your account`,
      userId: user._id,
    });
    // nodemailer Area ends
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});

// Route for Email Verification
app.get("/auth/verify-email/:verificationKey", async (req, res) => {
  const verificationKey = req.params.verificationKey;
  // console.log(verificationKey);
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
    });
    console.log(error);
  }
});

// profile route
app.get("/profile", verifyJwt, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -verificationKey -verificationKeyExpiry -resetPasswordToken -resetPasswordExpiry"
    );
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "User found",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to get user",
    });
    console.log(error);
  }
});

app.get("/isauthenticated", verifyJwt, (req, res) => {
  if (req.user) {
    return res.status(200).json({
      authenticated: true,
      message: "user authenticated",
    });
  }
  // if user is not authenticated
  res.status(400).json({
    authenticated: false,
    message: "user not authenticated",
  });
});

// Order Routes
app.post(
  "/order/new",
  verifyJwt,
  isVerified,
  validateOrderInput,
  async (req, res) => {
    try {
      const orderItemsIds = Promise.all(
        req.body.orderItems.map(async (orderItem) => {
          let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product,
          });

          newOrderItem = await newOrderItem.save();

          return newOrderItem._id;
        })
      );
      const orderItemsIdsResolved = await orderItemsIds;

      const totalPrices = await Promise.all(
        orderItemsIdsResolved.map(async (orderItemId) => {
          const orderItem = await OrderItem.findById(orderItemId).populate(
            "product",
            "price"
          );
          const totalPrice = orderItem.product.price * orderItem.quantity;
          return totalPrice;
        })
      );
      const orderId = uuidv4();
      const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

      // Razorspay Payment Gateway

      const transactionId = "1234567890";
      const paymentMethod = "Razorpay";

      let order = new Order({
        orderId: orderId,
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        totalPrice: totalPrice,
        user: req.body.user,
        paymentMethod: paymentMethod,
        transactionId: transactionId,
      });
      order = await order.save();

      if (!order)
        return res.status(400).json({
          success: false,
          message: "Failed to create new order",
        });
      res.status(200).json({
        success: true,
        message: "Order created successfully",
        data: order,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to create new order",
      });
      console.log(error);
    }
  }
);

// Delete order by orderId
app.delete("/order/:orderId", verifyJwt, isVerified, async (req, res) => {
  try {
    const userId = req.user._id;
    const orderId = req.params.orderId;
    const order = await Order.findOneAndDelete({
      userId: userId,
      orderId: orderId,
    });
    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    if (order.status == "shipped" || order.status == "delivered") {
      res.status(400).json({
        success: false,
        message: "Order cannot be cancelled",
      });
    }
    order.status = "cancelled";
    await order.save();
    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to delete order",
    });
    console.log(error);
  }
});

// Get order by orderId

app.get("/order/:orderId", verifyJwt, isVerified, async (req, res) => {
  try {
    const userId = req.user._id;
    const orderId = req.params.orderId;
    const order = await Order.findOne({
      userId: userId,
      orderId: orderId,
    }).populate("orderItems", "product");
    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Order found",
      data: order,
    });
    // Get order by orderId
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to get order",
    });
    console.log(error);
  }
});

// Get all orders
app.get("/orders", verifyJwt, isVerified, async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await Order.find({ userId: userId }).populate(
      "orderItems",
      "product"
    );
    res.status(200).json({
      success: true,
      message: "Orders found",
      data: orders,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to get orders",
    });
    console.log(error);
  }
});

// cart and wishlist routes

// Add product to cart
app.post("/cart/add", verifyJwt, isVerified, async (req, res) => {
  try {
    const userId = req.user._id;
    const orderItem = new OrderItem({
      quantity: req.body.quantity,
      product: req.body.product,
    });
    await orderItem.save();
    const user = await User.findById(userId);
    user.cart.push(orderItem._id);
    await user.save();
    res.status(200).json({
      success: true,
      message: "Product added to cart",
      data: user.cart,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to add product to cart",
    });
    console.log(error);
  }
});

// Remove product from cart
app.delete(
  "/cart/remove/:productId",
  verifyJwt,
  isVerified,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const productId = req.params.productId;
      const user = await User.findById(userId);
      const index = user.cart.indexOf(productId);
      if (index > -1) {
        user.cart.splice(index, 1);
      }
      await user.save();
      res.status(200).json({
        success: true,
        message: "Product removed from cart",
        data: user.cart,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to remove product from cart",
      });
      console.log(error);
    }
  }
);

// Add product to wishlist

app.post("/wishlist/add", verifyJwt, isVerified, async (req, res) => {
  try {
    const userId = req.user._id;
    const productId = req.body.productId;
    const userWishlist = req.user.wishlist;
    if (userWishlist.includes(productId)) {
      res.status(400).json({
        success: false,
        message: "Product already in wishlist",
      });
    }
    const user = await User.findById(userId)
      .populate("wishlist")
      .populate("cart");
    user.wishlist.push(productId);
    await user.save();
    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      data: user.wishlist,
    });
    res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      data: user.wishlist,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to add product to wishlist",
    });
    console.log(error);
  }
});

// Ticket Routes

app.post(
  "/ticket/new",
  verifyJwt,
  isVerified,
  validateTicketInput,
  async (req, res) => {
    try {
      const { title, description, category, priority } = req.body;
      const user = req.user._id;
      const ticket = new Ticket({
        ticketId: uuidv4(),
        title,
        description,
        category,
        priority,
        user,
      });
      await ticket.save();
      res.status(201).json({
        success: true,
        message: "Ticket created",
        data: ticket,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to create ticket",
      });
      console.log(error);
    }
  }
);

// Admin Routes

// update order status
app.put("/admin/order/:orderId", verifyJwt, isAdmin, async (req, res) => {
  try {
    const userId = req.user._id;
    const orderId = req.params.orderId;
    const order = await Order.findOne({
      userId: userId,
      orderId: orderId,
    });
    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    if (order.status == "cancelled") {
      res.status(400).json({
        success: false,
        message: "Order cannot be updated",
      });
    }
    order.status = req.body.status;
    await order.save();
    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update order status",
    });
    console.log(error);
  }
});

// Get all orders
app.get("/admin/orders", verifyJwt, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json({
      success: true,
      message: "Orders found",
      data: orders,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to get orders",
    });
    console.log(error);
  }
});

// Get all users
app.get("/admin/users", verifyJwt, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select(
      "-password -verificationKey -verificationKeyExpiry -resetPasswordToken -resetPasswordExpiry"
    );
    res.status(200).json({
      success: true,
      message: "Users found",
      data: users,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to get users",
    });
    console.log(error);
  }
});

// Get user by userId
app.get("/admin/user/:userId", verifyJwt, isAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select(
      "-password -verificationKey -verificationKeyExpiry -resetPasswordToken -resetPasswordExpiry "
    );
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "User found",
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to get user",
    });
    console.log(error);
  }
});

// get all tickets

app.get("/admin/tickets", verifyJwt, isAdmin, async (req, res) => {
  try {
    const tickets = await Ticket.find();
    res.status(200).json({
      success: true,
      message: "Tickets found",
      data: tickets,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to get tickets",
    });
    console.log(error);
  }
});

// get ticket by ticketId

app.get("/admin/ticket/:ticketId", verifyJwt, isAdmin, async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Ticket found",
      data: ticket,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to get ticket",
    });
    console.log(error);
  }
});

// update ticket status

app.put("/admin/ticket/:ticketId", verifyJwt, isAdmin, async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }
    ticket.status = req.body.status;
    await ticket.save();
    res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      data: ticket,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update ticket status",
    });
    console.log(error);
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
