import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const jwtMiddleware = async (ctx, next) => {
  const token = ctx.cookies.get('access_token');
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_TOKEN_KEY);
    ctx.state.user = {
      _id: decoded._id,
      email: decoded.email,
      username: decoded.username,
      isAdmin: decoded.isAdmin,
    };
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp - now < 60 * 60 * 24) {
      // 1day
      const user = await User.findByEmail(decoded.email);
      const token = user.genreateToken();
      ctx.cookies.set('access_token', token, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
      });
    }
    return next();
  } catch (e) {
    return next();
  }
};

export default jwtMiddleware;
