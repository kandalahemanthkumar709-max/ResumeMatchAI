import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const testUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const u = await User.findOne({ email: /gonirusesh/i });
    console.log(JSON.stringify(u, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
testUser();
