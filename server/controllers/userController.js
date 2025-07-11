import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Controller to sign up a new user
export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;
  console.log(req.body);

  try {
    if (!fullName || !email || !password || !bio) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Details" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Account already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });

    const token = generateToken(newUser._id);
    const { _id, profilePic } = newUser;

    res.status(201).json({
      success: true,
      userData: { _id, fullName, email, bio, profilePic },
      token,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Controller to log in a user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userData = await User.findOne({ email });
    if (!userData) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, userData.password);
    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(userData._id);
    const { _id, fullName, bio, profilePic } = userData;

    res.status(200).json({
      success: true,
      userData: { _id, fullName, email, bio, profilePic },
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Controller to check if user is authenticated
export const checkAuth = (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

// Controller to update user profile details

// Controller to update user profile details
export const updateProfile = async (req, res) => {
  try {
    console.log(" Incoming update body:", req.body);
    console.log(" Authenticated user:", req.user);

    const { profilePic, bio, fullName } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user._id;
    let updatedUser;

    // Update user with or without profilePic
    if (!profilePic) {
      console.log(" Updating profile without image...");
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { fullName, bio },
        { new: true }
      );
    } else {
      console.log(" Uploading image to Cloudinary...");
      const upload = await cloudinary.uploader.upload(profilePic);
      console.log(" Uploaded image URL:", upload.secure_url);

      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          profilePic: upload.secure_url,
          fullName,
          bio,
        },
        { new: true }
      );
    }

    // Handle case: user not found
    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { _id, email, profilePic: updatedPic } = updatedUser;

    res.status(200).json({
      success: true,
      user: { _id, fullName, email, bio, profilePic: updatedPic },
    });
  } catch (error) {
    console.error("Full error in updateProfile:", error); // FULL object
    res
      .status(500)
      .json({ success: false, message: error.message || "Server Error" });
  }
};
