import MongoDB from 'mongodb';

export const ObjectId = MongoDB.ObjectID;

/**
 * @type MongoDB.MongoClient
 */
const client = MongoDB.MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

client.connect().then(() => {
  console.log('connected to mongo');
});

export const mongoClient = client;
