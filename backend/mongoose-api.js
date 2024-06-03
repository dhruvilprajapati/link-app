const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("./mongoose");
const multer = require("multer");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const JWT_SECRET = "Bh-It-Hub";
const CryptoJS = require("crypto-js");
const path = require("path");
const fs = require("fs");

// Import Models
const { User, Link } = require("./mongoose-models");

app.use(cors());
app.use("/public", express.static("public"));
app.use(bodyParser.json());

// Generate OTP
const generateOTP = () => {
  // Generate a 6-digit random number
  return Math.floor(100000 + Math.random() * 900000);
};

const otpStore = {};

// Function to generate a random link
// const generateRandomLink = () => {
//   const characters =
//     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//   let randomLink = "";
//   for (let i = 0; i < 25; i++) {
//     randomLink += characters.charAt(
//       Math.floor(Math.random() * characters.length)
//     );
//   }
//   return "https://" + randomLink + ".com";
// };

// Decrypt encrypted password
const decryptPassword = (encryptedPassword) => {
  const bytes = CryptoJS.AES.decrypt(encryptedPassword, "BhItHub");
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Unique file name
  },
});

// Initialize multer instance with the storage options
const upload = multer({ storage: storage });

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "Access denied" });
  const payload = jwt.verify(token?.split(" ")[1], JWT_SECRET);
  if (!payload) return res.status(403).json({ message: "Invalid token" });
  req.user = payload;
  req.email = payload.email;
  next();
};

// Post method for Links
app.post(
  "/create/post",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const { filename, mimetype } = req.file;
      const { startDate, endDate, description } = req.body;
      const isVideo = mimetype.toLowerCase().endsWith("video/mp4");

      const postId = new mongoose.Types.ObjectId();
      const postUrl = `http://localhost:3001/post/${postId}`;
      const post = new Link({
        _id: postId,
        image: filename,
        isVideo,
        startDate,
        endDate,
        link: postUrl,
        description,
      });
      await post.save();

      res.status(201).json({ message: "Link created successfully", post });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Get method for Links
app.get("/posts", authenticateToken, async (req, res) => {
  try {
    const posts = await Link.find();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/post/:id", async (req, res) => {
  try {
    const post = await Link.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Link not found" });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update method for Links
app.put(
  "/update/post/:id",
  authenticateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { startDate, endDate, isVideo, description } = req.body;
      const filename = req.file ? req.file.filename : null;

      const existingPost = await Link.findById(id);
      if (!existingPost) {
        return res.status(404).json({ message: "Link not found" });
      }

      if (filename && existingPost.image) {
        const imagePath = path.join(
          __dirname,
          "public",
          "uploads",
          existingPost.image
        );
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      const updateData = { startDate, endDate, isVideo, description };
      if (filename) {
        updateData.image = filename;
      }

      const updatedPost = await Link.findOneAndUpdate({ _id: id }, updateData, {
        new: true,
      });

      if (!updatedPost) {
        return res.status(404).json({ message: "Link not found" });
      }

      res
        .status(200)
        .json({ post: updatedPost, message: "Link updated successfully" });
    } catch (error) {
      console.error("Error in update route:", error);
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete method for Links
app.delete("/delete/post/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPost = await Link.findByIdAndDelete(id);
    if (!deletedPost) {
      return res.status(404).json({ message: "Link not found" });
    }

    const imagePath = path.join(
      __dirname,
      "public",
      "uploads",
      deletedPost.image
    );
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    const decryptedPassword = decryptPassword(password);
    const isPasswordValid = decryptedPassword === user.password;

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password " });
    }
    const token = jwt.sign({ email: user.email }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "You have logged in successfully!",
      token,
      email,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//TODO :  Twillio setup
// Endpoint to send OTP
//  app.post("/sendotp", authenticateToken, async (req, res) => {
//   try {
//     const phoneNumber = req.body.phoneNumber;
//     if (!phoneNumber) {
//       return res.status(400).json({ message: "Phone number is required" });
//     }

//     // Generate OTP
//     const otp = generateOTP();

//     // Store OTP in temporary storage
//     otpStore[phoneNumber] = otp;

//     // Send OTP via Twilio (Replace with your Twilio credentials)
//     const twilioResponse = await axios.post(
//       "https://api.twilio.com/2010-04-01/Accounts/your_account_sid/Messages.json",
//       {
//         Body: `Your OTP is: ${otp}`,
//         From: "your_twilio_phone_number",
//         To: phoneNumber,
//       },
//       {
//         auth: {
//           username: "your_twilio_account_sid",
//           password: "your_twilio_auth_token",
//         },
//       }
//     );

//     console.log("Twilio response:", twilioResponse.data);

//     res.status(200).json({ message: "OTP sent successfully" });
//   } catch (error) {
//     console.error("Error sending OTP:", error);
//     res.status(500).json({ message: "Failed to send OTP" });
//   }
// });

// // Endpoint to verify OTP
// app.post("/verifyotp", authenticateToken, (req, res) => {
//   try {
//     const phoneNumber = req.user.phoneNumber;
//     const otp = req.body.otp;

//     // Check if OTP exists in temporary storage
//     if (!otpStore[phoneNumber] || otpStore[phoneNumber] !== otp) {
//       return res.status(400).json({ message: "Invalid OTP" });
//     }

//     // Clear OTP from temporary storage after successful verification
//     delete otpStore[phoneNumber];

//     res.status(200).json({ message: "OTP verified successfully" });
//   } catch (error) {
//     console.error("Error verifying OTP:", error);
//     res.status(500).json({ message: "Failed to verify OTP" });
//   }
// });

// Endpoint to send OTP
app.post("/sendotp", async (req, res) => {
  try {
    const phoneNumber = req.body.phoneNumber;
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Generate OTP (static OTP for testing)
    const otp = "1234";

    // Store OTP in temporary storage
    otpStore[phoneNumber] = otp;

    // Simulate sending OTP via Twilio or other service (not implemented here)

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

// Endpoint to verify OTP
app.post("/verifyotp", async (req, res) => {
  try {
    const phoneNumber = req.body.phoneNumber;
    const otp = req.body.otp;
    if (!phoneNumber || !otp) {
      return res
        .status(400)
        .json({ message: "Phone number and OTP are required" });
    }

    if (otpStore[phoneNumber] !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Clear OTP from temporary storage after successful verification
    delete otpStore[phoneNumber];

    // Update user verification status
    await User.findOneAndUpdate({ phoneNumber }, { isVerified: true });

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
});

// Endpoint to check verification status
app.get("/verify-status", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ isVerified: user.isVerified });
  } catch (error) {
    console.error("Error checking verification status:", error);
    res.status(500).json({ message: "Failed to check verification status" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
