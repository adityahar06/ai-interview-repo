const jwt = require('jsonwebtoken');
const User = require('../models/User');
// what is JWT?
//a compact, URL-safe way to securely transmit information between a client (like a browser) and a server as a JSON object
//WT = JSON Web Token. Three parts separated by dots:
//Header — algorithm used (HS256)Specifies the token type (JWT) and the hashing algorithm used (e.g., HMAC SHA256)
//Payload — data stored ({ id: "user_mongodb_id" })Contains the "claims" or data about the user (e.g., user ID, name, or roles). Warning: This data is only encoded, not encrypted. Anyone can read it, so never put passwords or sensitive data here
//Signature — Header + Payload signed with JWT_SECRET. Created by taking the encoded header, encoded payload, and combining them with a secret key known only to the server. This ensures the token cannot be tampered with.
// Flow: User logs in → server creates JWT → client stores in localStorage → client sends in every request header → server verifies signature → allows/denies access
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc  Register a new user
// @route POST /api/auth/register
// async is used-
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      // 400 is for the bad request
      return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
    }
    // findOne() stops scanning after the first match and returns a single object (or null), making it ideal for unique queries like user IDs.
    // find()-find() scans the collection and returns an array of all matching documents (or an empty array), making it ideal for lists or categories.
    // we here used findone() as if we get the emial as emial will be unique so get the result
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    // if not exisitng user then create it in db
    const user = await User.create({ name, email, password });
    // we user the funciton genertae token created at the top by using the mongodb user id where this user is saved
    // mongoose or mongodb always store the id with _id so we use _id
    const token = generateToken(user._id);
    // we use 201 as a new resource was successfully created 
    // we also dint give password as JWT only want to know name and email it will be satsified by it
    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        totalInterviews: user.totalInterviews,
        averageScore: user.averageScore,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Login user
// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }
    // the user who types email and password so we have to check its identity
    // in mongo we previosuly store select for the password  field as false(so that user.find() automatically exclude the password not leak to frontend)
    //Adding .select('+password') overrides the schema's default setting. The plus sign (+) tells Mongoose: "Perform the query normally, but specifically include the password field just this once
    const user = await User.findOne({ email }).select('+password');
    // if user does not exist or comparepassword is a funion of bycrypt which takes plain passoerd and uses same encryption algorithm
    // and checks with the original hashed password
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        totalInterviews: user.totalInterviews,
        averageScore: user.averageScore,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get current user
// @route GET /api/auth/me
//req.user is set by the auth middleware — already verified JWT before reaching here
// No DB query needed — middleware already fetched the user
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      totalInterviews: req.user.totalInterviews,
      averageScore: req.user.averageScore,
      createdAt: req.user.createdAt,
    },
  });
};
module.exports = { register, login, getMe };
