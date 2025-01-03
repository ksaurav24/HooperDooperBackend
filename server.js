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
app.use(helmet());
const mongooseAggregatorPaginate = require("mongoose-aggregate-paginate-v2");

// const rateLimit = require("express-rate-limit");
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
// });

// app.use(limiter);

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
const { mongoose } = require("mongoose");
const Order = require("./models/ordersModel.js");
const OrderItem = require("./models/orderItem.model.js");
const Ticket = require("./models/ticket.Model.js");
const isVerified = require("./middlewares/isVerified.middleware.js");
const Product = require("./models/productModel.js");
const resetPasswordMail = require("./controllers/forgotPassword.mailer.js");
const passwordInputValidation = require("./middlewares/passwordInputValidation.js");
const updateOrderInputValidation = require("./middlewares/updateOrderInputValidation.js");
const productInputValidation = require("./middlewares/productInputValidatotion.js");
const sendMailInputValidation = require("./middlewares/sendMailInputValidation.js");
const sendMail = require("./controllers/sendMail.js");

initializingPassport(passport);
app.use(
  expressSession({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.use(
  cors(
    // {
    //   origin: "",
    //   credentials: true,
    // },
    {
      origin: [
        "https://admin.hooperdooper.in",
        "https://hooperdooper.in",
        "https://www.hooperdooper.in",
        "http://localhost:5173",
      ],
      credentials: true,
    }
  )
);

app.use("/auth", require("./routes/auth.js"));


 mongoose.connect(process.env.MONGO_URI);


app.get("/auth/v1/isAuthenticated", isAuthenticated, async (req, res) => {
  res.status(200).json({
    message: "user is authenticated",
    authenticated: true,
  });
});

// app.post("/auth/v1/login", loginInputValidation, async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "User not found",
//       });
//     }
//     if (!user.password) {
//       return res.status(400).json({
//         success: false,
//         message: "Please login with google",
//       });
//     }
//     if (!(await bcrypt.compare(password, user.password))) {
//       return res.status(400).json({
//         success: false,
//         message: "Incorrect password",
//       });
//     }
//     const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//       expiresIn: "1d",
//     });
//     const newUser = await User.findOne({ email }).select(
//       "-password -verificationKey -verificationKeyExpiry -resetPasswordToken -resetPasswordExpiry"
//     );

//     res.status(200).json({
//       success: true,
//       message: "Logged in",
//       token: token,
//       user: newUser,
//     });
//   } catch (error) {
//     res.status(400).json({
//       success: false,
//       message: "Failed to login",
//       error: error,
//     });
//     console.log(error);
//   }
// });

app.post(
  "/auth/v2/login",
  loginInputValidation,
  passport.authenticate("local"),
  async (req, res) => {
    res.status(200).json({
      message: "Logged in",
      success: true,
      user: req.user._id,
    });
  }
);

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
    const { fullName, password, email, phone } = req.body;
    const username = email.split("@")[0];
    console.log(username);
    try {
      const emailExists = await User.findOne({ email });
      const phoneExits = await User.findOne({
        contact: phone,
      });

      if (emailExists || phoneExits) {
        return res.status(400).json({
          success: false,
          message: "Phone or email already exists",
        });
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to check Phone or email",
      });
      console.log(error);
    }
    if (!passwordInputValidation(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be atleast 6 characters long with atleast one uppercase, one lowercase, one number",
      });
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const user = new User({
      fullName: fullName,
      password: hashedPassword,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      contact: phone,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
});

app.get("/auth/send-verification-email", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    // nodemailer Area
    const registrationMail = require("./controllers/registrationmail");
    console.log("Sending mail to user");
    await registrationMail({
      to: user.email,
      text: `Hello ${user.name}, your account has been successfully created on Hooper Dooper. Please Complete the verification process to activate your account`,
      userId: user._id,
    });
    // nodemailer Area ends
    return res.status(200).json({
      success: true,
      message: "Verification email sent",
    });

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

// Route for forgot password
app.post("/auth/forgot-password", async (req, res) => {
  const email = req?.body?.email;
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const resetPasswordToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    await User.findByIdAndUpdate(user._id, {
      resetPasswordToken: resetPasswordToken,
    });

    // nodemailer area
    await resetPasswordMail({
      to: user.email,
      text: `Hello ${user.name}, you have requested to reset your password. Click on the link below to reset your password. If you didn't request this, please ignore this email`,
      resetToken: resetPasswordToken,
    });

    // nodemailer area ends

    return res.status(200).json({
      success: true,
      message: "Reset password link sent to your email",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Failed to reset password",
    });
  }
});

// Route for reset password
app.post("/auth/reset-password", async (req, res) => {
  console.log(req.body);
  const { resetToken, password } = req.body;
  if (!resetToken || !password) {
    return res.status(400).json({
      success: false,
      message: "Reset token and password is required",
    });
  }
  if (!passwordInputValidation(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be atleast 6 characters long with atleast one uppercase, one lowercase, one number",
    });
  }

  try {
    const userId = jwt.verify(resetToken, process.env.JWT_SECRET).id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Invalid reset token",
      });
    }
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordToken: null,
    });
    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Failed to reset password",
    });
  }
});

// Route for password change

app.post("/auth/change-password", isAuthenticated, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Google users cannot change password",
      });
    }
    if (!(await bcrypt.compare(oldPassword, user.password))) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }
    if (!passwordInputValidation(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be atleast 6 characters long with atleast one uppercase, one lowercase, one number",
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    });
    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Failed to change password",
    });
  }
});

// profile route
app.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -verificationKey -verificationKeyExpiry -resetPasswordToken -resetPasswordExpiry"
    );
    if (!user) {
      return res.status(404).json({
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

app.get("/isauthenticated", isAuthenticated, (req, res) => {
  return res.status(200).json({
    authenticated: true,
    message: "user authenticated",
  });
});

// Order Routes
app.post(
  "/order/new",
  isAuthenticated,
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
        shippingAddress: req.body.shippingAddress,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        totalPrice: totalPrice,
        user: req.user._id,
        paymentMethod: paymentMethod,
        transactionId: transactionId,
        fullName: req.user.fullName,
      });
      order = await order.save();

      if (!order)
        return res.status(400).json({
          success: false,
          message: "Failed to create new order",
        });
      const user = await User.findById(req.user._id);
      user.cart = [];
      await user.save();
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
app.delete("/order/:orderId", isAuthenticated, isVerified, async (req, res) => {
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

app.get("/order/:orderId", isAuthenticated, isVerified, async (req, res) => {
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
app.get("/orders", isAuthenticated, isVerified, async (req, res) => {
  try {
    const userId = req.user._id;
    const ordersWithDetails = await Order.aggregate([
      {
        $match: { user: userId },
      },
      {
        $lookup: {
          from: "orderitems",
          localField: "orderItems",
          foreignField: "_id",
          as: "orderItems",
          pipeline: [
            {
              $lookup: {
                from: "products",
                localField: "product",
                foreignField: "_id",
                as: "products",
              },
            },
          ],
        },
      },
    ]);

    if (!ordersWithDetails) {
      res.status(404).json({
        success: false,
        message: "Orders not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Orders found",
      data: ordersWithDetails,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      success: false,
      message: "Failed to get orders",
    });
  }
});

// cart and wishlist routes

// get cart of user
app.get("/cart", isAuthenticated, isVerified, async (req, res) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId).populate("cart");
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    try {
      const cartItems = user.cart.map(async (item) => {
        const product = await Product.findById(item.product);
        return {
          orderItem: item._id,
          id: product._id,
          name: product.title,
          price: product.price,
          image: product.imageUrl,
          color: product.color,
          description: product.description,
          quantity: item.quantity,
        };
      });
      const cart = await Promise.all(cartItems);
      return res.status(200).json({
        success: true,
        message: "Cart details found",
        data: cart,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Some error occured while fetching cart details",
        success: false,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Some error occured while fetching cart details",
      success: false,
    });
  }
});

// changing the quantity of products in cart
app.post("/cart/changeQuantity", isAuthenticated, isVerified, async (req,res)=>{
  try {
    const orderItemId = req.body?.productId
    const newQuantity = req.body?.newQuantity
    console.log(orderItemId)
    console.log(newQuantity)
    if(!orderItemId || !newQuantity
    ){
      return res.status(400).json({
        message:"Invalid request data",
        success:"false"
      })
    }
    const orderItem = await OrderItem.findById(orderItemId)
    if(!orderItem){
      return res.status(404).json({
        message:"Order Item not found",
        success:false
      })
    }
    orderItem.quantity = newQuantity
    const updatedOrderItem = await orderItem.save()
    
    return res.status(204).json({
      message:"Quantity changed successfully",
      success:true,
      data:updatedOrderItem,
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message:"Something Went Wrong",
      success:false
    })
  }
})

// Add product to cart
app.post("/cart/add", isAuthenticated, isVerified, async (req, res) => {
  try {
    const userId = req.user._id;
    const quantity = req.body.quantity;
    const product = req.body.product;
    if (!quantity || !product) {
      return res.status(401).json({
        message: "product and quantity is required",
        success: false,
      });
    }
    const productId = await Product.findOne({ slug: product });
    if (!productId) {
      return res.status(404).json({
        message: "Product not found. Please check the product slug",
        success: false,
      });
    }
    const user = await User.findById(userId);
    const orderItems = await Promise.all(user.cart.map(async(orderItemId)=>{
      const orderItem = await OrderItem.findById(orderItemId);
      return orderItem;
    }));

    let alreadyInCart = null;
    orderItems.forEach((orderItem) => {
      if (orderItem?.product.toString() === productId._id.toString()) {
        alreadyInCart = orderItem;
      }
    });

    if (alreadyInCart) {
      alreadyInCart.quantity += quantity;
      await alreadyInCart.save();
    } else {
      const newOrderItem = new OrderItem({
      quantity: quantity,
      product: productId._id,
      });
      await newOrderItem.save();
      user.cart.push(newOrderItem._id);
    }
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
  "/cart/:productId",
  isAuthenticated,
  isVerified,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const productId = req.params.productId;
      const user = await User.findById(userId);
      const index = user.cart.indexOf(productId);
      console.log(productId)
      console.log(user.cart)
      console.log(index)
      if (index > -1) {
        user.cart.splice(index, 1);
      }
      console.log(user.cart)
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Product removed from cart",
        data: user.cart,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).json({
        success: false,
        message: "Failed to remove product from cart",
      });
    }
  }
);

// Add product to wishlist

app.post("/wishlist/add", isAuthenticated, isVerified, async (req, res) => {
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
  isAuthenticated,
  isVerified,
  validateTicketInput,
  async (req, res) => {
    try {
      const { title, description, category } = req.body;
      const user = req.user._id;
      const ticket = new Ticket({
        ticketId: uuidv4(),
        title,
        description,
        category,
        user: user,
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

// admin login Route

app.get("/admin/login", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin login page",
  });
});

app.post(
  "/admin/login",
  passport.authenticate("local"),
  isAdmin,
  async (req, res) => {
    res.status(200).json({
      success: true,
      message: "Logged in",
      user: req.user._id,
    });
  }
);

// is-admin route
app.get("/admin/is-admin", isAuthenticated, isAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: "User is admin",
    isAdmin: true,
  });
});

// analytics route
app.get("/admin/analytics", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const [orderCount, userCount, ticketCount, productCount] =
      await Promise.all([
        Order.aggregate([{ $count: "count" }]),
        User.aggregate([{ $count: "count" }]),
        Ticket.aggregate([{ $count: "count" }]),
        Product.aggregate([{ $count: "count" }]),
      ]);

    res.status(200).json({
      success: true,
      message: "Analytics found",
      data: {
        orders: orderCount[0]?.count || 0,
        users: userCount[0]?.count || 0,
        tickets: ticketCount[0]?.count || 0,
        products: productCount[0]?.count || 0,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      success: false,
      message: "Failed to get analytics",
    });
  }
});

// update order status
app.put(
  "/admin/order/:orderId",
  isAuthenticated,
  isAdmin,
  updateOrderInputValidation,
  async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const order = await Order.findOne({
        orderId: orderId,
      });
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }
      if (order.status == "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Order cannot be updated",
        });
      }
      console.log(req.body);
      order.status = req.body.status;
      const newOrder = await order.save();
      console.log(newOrder);

      res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        data: order,
      });
    } catch (error) {
      console.log(error);
      return res.status(400).json({
        success: false,
        message: "Failed to update order status",
      });
    }
  }
);

// Get all orders
app.get("/admin/orders", isAuthenticated, isAdmin, async (req, res) => {
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

// Get orders of specific user
app.post("/admin/user/orders", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "No user Id provided",
      });
    }

    const orders = await Order.aggregate([
      {
        $match: {
          user: userId,
        },
      },
    ]);
    res.status(200).json({
      orders,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// Get all users
app.get("/admin/users", isAuthenticated, isAdmin, async (req, res) => {
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
app.get("/admin/user/:userId", isAuthenticated, isAdmin, async (req, res) => {
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

app.get("/admin/tickets", isAuthenticated, isAdmin, async (req, res) => {
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

app.get(
  "/admin/ticket/:ticketId",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
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
  }
);

// update ticket status

app.put(
  "/admin/ticket/:ticketId",
  isAuthenticated,
  isAdmin,
  async (req, res) => {
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
  }
);

// get all products
app.get("/admin/products", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({
      success: true,
      message: "Products found",
      data: products,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to get products",
    });
    console.log(error);
  }
});

// update product by productId

app.put(
  "/admin/product/:productSlug",
  isAuthenticated,
  isAdmin,
  productInputValidation,
  async (req, res) => {
    try {
      const productSlug = req.params.productSlug;
      const product = await Product.findOne(
        { slug: productSlug },
        "-createdAt -updatedAt -__v "
      );
      if (!product) {
        res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
      product.title = req.product.title;
      product.color = req.product.color;
      product.description = req.product.description;
      product.price = req.product.price;
      await product.save();
      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Failed to update product",
      });
      console.log(error);
    }
  }
);

// send email to user
app.post(
  "/admin/send-email",
  isAuthenticated,
  sendMailInputValidation,
  isAdmin,
  async (req, res) => {
    try {
      const { email, subject, message } = req.body;
      if (!email || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: "Email, subject and message is required",
        });
      }
      console.log(email, subject, message);
      // nodemailer area
      await sendMail({
        to: email,
        text: "email from hooper dooper",
        subject: subject,
        message: message,
      });
      // nodemailer area ends
      res.status(200).json({
        success: true,
        message: "Email sent successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Failed to send email",
      });
    }
  }
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
