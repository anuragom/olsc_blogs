const mongoose = require('mongoose');

const UserModule = require('./src/models/User.ts');
const User = UserModule.default;

const MONGO_URI = 'mongodb://admin:4%40BN%29YRMK%5DV5X6%26x@10.10.130.44:27017/olsc_db?authSource=admin'

async function runUserMigration() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected.');

    console.log('Starting User Role data migration...');
    
    const updateResult = await User.updateMany(
      { role: { $exists: false } },
      {
        $set: {
          role: 'sanjvikAdmin', 
        },
      }
    );

    console.log('User Role migration complete!');
    console.log(`Documents matched: ${updateResult.matchedCount}`);
    console.log(`Documents modified: ${updateResult.modifiedCount}`);

  } catch (error) {
    console.error('User Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

runUserMigration();