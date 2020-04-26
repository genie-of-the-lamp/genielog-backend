import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const { Schema } = mongoose;

const UserSchema = new Schema({
  email: String,
  username: String,
  hashedPassword: String,
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

UserSchema.methods.setPassword = async function (password) {
  const hash = await bcrypt.hash(password, 10);
  this.hashedPassword = hash;
};

UserSchema.methods.checkPassword = async function (password) {
  const result = await bcrypt.compare(password, this.hashedPassword);
  return result;
};

UserSchema.statics.findByEmail = function (email) {
  return this.findOne({ email });
};

UserSchema.methods.serialize = function () {
  const data = this.toJSON();
  delete data.hashedPassword;
  return data;
};

UserSchema.methods.generateToken = function () {
  const token = jwt.sign(
    {
      _id: this.id,
      email: this.email,
      username: this.username,
      isadmin: this.isadmin,
    },
    process.env.JWT_TOKEN_KEY,
    {
      expiresIn: '7d',
    },
  );

  return token;
};

UserSchema.methods.setAdmin = function (boolean) {
  this.isAdmin = boolean;
};

const User = mongoose.model('User', UserSchema);

export default User;
