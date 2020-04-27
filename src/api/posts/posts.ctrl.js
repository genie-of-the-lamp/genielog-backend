import Joi from 'joi';
import Post from '../../models/post.js';
import sanitizeHtml from 'sanitize-html';
import mongoose from 'mongoose';
const { isValidObjectId } = mongoose;

const sanitizeOpts = {
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'p',
    'a',
    'ul',
    'ol',
    'nl',
    'li',
    'b',
    'i',
    'strong',
    'em',
    'strike',
    'code',
    'hr',
    'br',
    'div',
    'table',
    'thead',
    'caption',
    'tbody',
    'tr',
    'th',
    'td',
    'pre',
    'iframe',
    'span',
    'img',
    'del',
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    img: ['src'],
    iframe: ['src', 'allow', 'allowfullscreen', 'scrolling'],
    '*': ['class', 'id'],
    li: ['class'],
  },
  allowedSchemes: ['data', 'http'],
};

export const write = async (ctx) => {
  const schema = Joi.object().keys({
    title: Joi.string().required(),
    body: Joi.string().required(),
    // tags: Joi.array().items(Joi.string),
  });

  const result = Joi.validate(ctx.request.body, schema);
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const { title, body } = ctx.request.body;
  const post = new Post({
    title,
    body: sanitizeHtml(body, sanitizeOpts),
    // tags,
    user: ctx.state.user,
  });
  try {
    await post.save();
    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const getPostById = async (ctx, next) => {
  const { id } = ctx.params;
  if (!isValidObjectId(id)) {
    ctx.status = 400;
    return;
  }
  try {
    const post = await Post.findById(id);
    if (!post) {
      ctx.status = 404;
      return;
    }
    ctx.state.post = post;
    return next();
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const read = (ctx) => {
  ctx.body = ctx.state.post;
};

export const checkPrivilege = (ctx, next) => {
  const { user, post } = ctx.state;
  if (post.user.email !== user.email) {
    if (!user.isAdmin) {
      ctx.status = 403;
      return;
    }
  }
  return next();
};

const filterShortenText = (body) => {
  const filtered = sanitizeHtml(body, {
    allowedTags: [],
  });
  return filtered.length < 250 ? filtered : `${filtered.slice(0, 250)}...`;
};

export const list = async (ctx) => {
  const page = parseInt(ctx.query.page || '1', 10);

  if (page < 1) {
    ctx.status = 400;
    return;
  }

  const { email } = ctx.query;
  const query = {
    ...(email ? { 'user.email': email } : {}),
    // ...(tag ? { tags: tag } : {}),
  };

  try {
    const posts = await Post.find(query)
      .sort({ _id: -1 })
      .limit(10)
      .skip((page - 1) * 10)
      .lean()
      .exec();

    const postCount = await Post.countDocuments(query).exec();
    ctx.set('Last-Page', Math.ceil(postCount / 10));
    ctx.body = posts.map((post) => ({
      ...post,
      body: filterShortenText(post.body),
    }));
  } catch (e) {
    ctx.throw(500, e);
  }
};

export const remove = async (ctx) => {
  const { id } = ctx.params;
  try {
    await Post.findByIdAndRemove(id).exec();
    ctx.status = 204; // No Content
  } catch (e) {
    ctx.throw(500, e);
  }
};
export const update = async (ctx) => {
  const { id } = ctx.params;

  const schema = Joi.object().keys({
    title: Joi.string(),
    body: Joi.string(),
    // tags: Joi.array().items(Joi.string()),
  });

  const result = Joi.validate(ctx.request.body, schema);
  if (result.error) {
    ctx.status = 400;
    ctx.body = result.error;
    return;
  }

  const nextData = { ...ctx.request.body };
  if (nextData.body) {
    nextData.body = sanitizeHtml(nextData.body);
  }
  try {
    const post = await Post.findByIdAndUpdate(id, nextData, {
      new: true,
    }).exec();
    if (!post) {
      ctx.status = 404;
      return;
    }
    ctx.body = post;
  } catch (e) {
    ctx.throw(500, e);
  }
};
