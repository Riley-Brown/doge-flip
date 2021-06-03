import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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
