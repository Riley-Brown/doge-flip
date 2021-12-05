import { MongoClient, ObjectId } from 'mongodb';

export { ObjectId };

const client = new MongoClient(process.env.MONGO_URI as string);

client.connect().then(() => {
  console.log('connected to mongo');
});

export const mongoClient = client;

export const getWalletsCollection = () =>
  mongoClient.db('doge-flip').collection('wallets');

export const getActiveCoinFlipsCollection = () =>
  mongoClient.db('doge-flip').collection('active-coin-flips');
