import { handleVerifyToken } from '../Auth';

const handleSendAuthError = (res) =>
  res.status(401).send({ type: 'authError', message: 'Not authorized' });

export const requireUserAuth = async (req, res, next) => {
  const token = req.cookies?.userToken;

  try {
    if (!token) {
      return handleSendAuthError(res);
    }

    res.locals.userTokenObject = await handleVerifyToken(token);
    next();
  } catch (err) {
    console.log(err);
    return handleSendAuthError(res);
  }
};

export const setUserTokenFromCookie = async (req, res, next) => {
  const token = req.cookies?.userToken;
  const defaultUserToken = { userId: null, publicAddress: null };

  res.locals.userTokenObject = defaultUserToken;

  try {
    if (!token) return;
    res.locals.userTokenObject = await handleVerifyToken(token);
  } finally {
    next();
  }
};
