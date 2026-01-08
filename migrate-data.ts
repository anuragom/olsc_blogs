// const mongoose = require('mongoose');
// const BlogModule = require('./src/models/Blog'); 

// const Blog = BlogModule.default; 

// const MONGO_URI = 'mongodb://admin:4%40BN%29YRMK%5DV5X6%26x@10.10.130.44:27017/olsc_db?authSource=admin'

// async function runMigration() {
//   try {
//     console.log('Connecting to MongoDB...');
//     await mongoose.connect(MONGO_URI);
//     console.log('MongoDB connected.');

//     console.log('Starting data migration...');
    
//     const updateResult = await Blog.updateMany(
//       { website: { $exists: false } },
//       {
//         $set: {
//           website: 'omlogistics', 
//           isPublished: true,     
//         },
//       }
//     );

//     console.log('Data migration complete!');
//     console.log(`Documents matched: ${updateResult.matchedCount}`);
//     console.log(`Documents modified: ${updateResult.modifiedCount}`);

//   } catch (error) {
//     console.error('Migration failed:', error);
//   } finally {
//     await mongoose.disconnect();
//     console.log('MongoDB disconnected.');
//   }
// }

// runMigration();