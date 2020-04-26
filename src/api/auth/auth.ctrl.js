import Joi from 'joi';
import User from '../../models/user.js';

export const signUp = async (ctx) => {
  const schema = Joi.object().keys({
    email: Joi.string().email().required(),
    username: Joi.string().alphanum().min(3).max(20).required(),
    password: Joi.string().required(),
  });

  const result = Joi.validate(ctx.request.body, schema);
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const { email, username, password } = ctx.request.body;
  try {
    const exist = await User.findByEmail(email);
    if (exist) {
      ctx.status = 409;
      return;
    }
    const user = new User({ email, username });
    await user.setPassword(password);
    await user.save();
    ctx.body = user.serialize();
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const signIn = async (ctx) => {
  const { email, password } = ctx.request.body;

  if (!email || !password) {
    ctx.status = 400;
    return;
  }

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      ctx.status = 401;
      ctx.body = 'email';
      return;
    }
    const valid = await user.checkPassword(password);
    if (!valid) {
      ctx.status = 401;
      ctx.body = 'password';
      return;
    }
    ctx.body = user.serialize();
    const token = user.generateToken();
    ctx.cookies.set('access_token', token, {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
    });
  } catch (e) {
    throw (500, e);
  }
};

export const userCheck = async (ctx) => {
  const { user } = ctx.state;
  if (!user) {
    ctx.status = 401;
    return;
  }
  ctx.body = user;
};

export const signOut = async (ctx) => {
  ctx.cookies.set('access_token');
  ctx.status = 204;
};

export const setAdmin = async (ctx) => {
  const { email, boolean } = ctx.request.body;
  const user = await User.findByEmail(email);
  user.setAdmin(boolean);
};
