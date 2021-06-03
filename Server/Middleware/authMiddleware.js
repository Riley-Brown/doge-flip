import jwt from 'jsonwebtoken';

const handleSendAuthError = (res) =>
  res.status(401).send({ type: 'authError', message: 'Not authorized' });

const handleVerifyToken = (token) => {
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

export const setUserCookie = async (req, res, next) => {
  const token = req.cookies?.userToken;
  console.log({ token });

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
