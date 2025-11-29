import { MongoClient } from 'mongodb';

const DB_URI = '';

async function cleanAllCollections() {
  const client = new MongoClient(DB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db('sports');
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    console.log(`Found ${collections.length} collections`);
    
    // Delete all documents from each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = db.collection(collectionName);
      
      const result = await collection.deleteMany({});
      console.log(`Deleted ${result.deletedCount} documents from ${collectionName}`);
    }
    
    console.log('All collections cleaned successfully!');
    
  } catch (error) {
    console.error('Error cleaning collections:', error);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

cleanAllCollections();