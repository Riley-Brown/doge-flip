import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import { getWalletsCollection } from '../DB';

export const createToken = ({ userId, publicAddress }) => {
  return jwt.sign({ userId, publicAddress }, process.env.JWT_SECRET_KEY);
};

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

export async function validatePasswordHash({ password, hashedPassword }) {
  return bcrypt.compare(password, hashedPassword);
}

export const handleVerifyToken = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decodedToken) => {
      if (err) {
        reject('session expired');
      } else {
        resolve(decodedToken);
      }
    });
  });
};

export const handleVerifyAdminToken = async (token) => {
  try {
    const decodedToken = await handleVerifyToken(token);
    if (!decodedToken?.userId) return false;

    const walletsCollection = getWalletsCollection();

    const user = await walletsCollection.findOne({
      _id: decodedToken.userId
    });

    if (user.isAdmin) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};
