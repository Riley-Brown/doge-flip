import { handleVerifyToken } from '../Auth';

const handleSendAuthError = (res) =>
  res.status(401).send({ type: 'authError', message: 'Not authorized' });

export const requireUserAuth = async (req, res, next) => {
  const token = req.cookies?.userToken;

  try {
    if (!token) {
      res.locals.userTokenObject = { userId: null, publicAddress: null };
    } else {
      res.locals.userTokenObject = await handleVerifyToken(token);
    }
  } catch (err) {
    console.log(err);
    res.locals.userTokenObject = { userId: null, publicAddress: null };
  } finally {
    next();
  }
};
