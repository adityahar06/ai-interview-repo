const mongoose = require('mongoose');
// mongoose.connect() returns a Promise — it takes time to establish a TCP connection to MongoDB. 
// await pauses execution until connection is established, then continues.
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(` MongoDB Connection Error: ${error.message}`);
    //  Why use process.exit(1) and not just console.log the error?
   //  I use process.exit(1) to follow the fail-fast principle, preventing a broken server from running in a useless 'zombie' state. 
   // Exiting with code 1 explicitly signals a fatal crash to orchestration tools like Docker or Kubernetes. 
   // This non-zero code triggers their automated monitoring to instantly attempt a self-healing restart."
    process.exit(1);
  }
};

module.exports = connectDB;
// what is mongoose?.
// Mongoose is an ODM (Object Document Mapper). It adds schema validation, 
// type checking, middleware hooks, and helper methods on top of the raw MongoDB Node.js driver.