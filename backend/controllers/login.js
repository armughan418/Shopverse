const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "Email and password are required",
      });
    }

    const formattedEmail = email.toLowerCase();
    const user = await User.findOne({ email: formattedEmail });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        status: false,
        message: "Invalid password",
      });
    }

    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "admin",
      },
      process.env.ACCESS_TOKEN_KEY,
      { expiresIn: "7d" },
    );

    res.cookie("token", accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      status: true,
      message: "Login successful",
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.role === "admin",
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      status: false,
      message: "Server error during login",
    });
  }
};

module.exports = login;
