const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    // trim used to remove the blankspaces 
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    // every email should  be unique
    unique: true,
    // lowercase so taht email should be in lower cas eonly
    lowercase: true,
    trim: true,
    // we have used strict rule for the email aditya@gmail.com
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    // By default, NEVER send the password field back when someone queries a user, unless I explicitly beg for it." It is the ultimate safety net against data leaks.
    select: false,
  },
  avatar: {
    type: String,
    default: '',
  },
  totalInterviews: {
    type: Number,
    default: 0,
  },
  averageScore: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Hash password before saving
//By using pre('save'), you are utilizing Mongoose middleware. 
// You are intercepting the user's data right before it gets written to the database. \
// Inside this hook, you use bcrypt to mathematically scramble (hash) the password
userSchema.pre('save', async function (next) {
  //I use isModified('password') in my pre-save hook to act as a safeguard. It ensures that the expensive and 
  // destructive bcrypt hashing function only runs when a user is explicitly creating or 
  // resetting their password, preventing their credentials from being corrupted when they update other profile fields.
  if (!this.isModified('password')) return next();
  // bcrypt(password,salt)
  this.password = await bcrypt.hash(this.password, 12);
  //  next is the middle ware to know we are good to go to next

  next();
});

// Compare password method
// You created a custom method that allows your login controller to easily check if the plaintext
//  password the user typed into the login form (candidatePassword) mathematically matches the hashed password in the database.
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
