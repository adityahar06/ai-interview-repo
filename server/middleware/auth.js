const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
// The code checks if the header exists and starts with the word "Bearer".
//It splits the string by the space (' ') into an array: ["Bearer", "eyJhbGciOiJIUz..."].
//It grabs the second item (index [1]), which is the raw token itself.
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    //This is where the magic happens. The bouncer checks if the VIP pass is fake. It uses jwt.verify()
    //  along with your highly secret JWT_SECRET password from your .env file. If the token was
    //  tampered with by a hacker, or if it has expired, this function will instantly crash and jump
    //  down to the catch block at the bottom. If it is valid, it "decodes" it, revealing the data
    //  hidden inside (which is the user's database ID).
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //: This is a security measure. It tells MongoDB: "Get all the user's data, but minus the password." We never want the password floating around in our backend logic just in case it accidentally gets sent back to the frontend.
// We then attach that user to the req.user object. This makes the user data available to whatever API route runs next!
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    //The bouncer has approved this person. Open the door and let them proceed to the actual API route they wanted to visit."
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

module.exports = { protect };
