import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const UserSchema = new Schema({
  userid: String,
  username: String,
  hashedPassword: String,
});

UserSchema.methods.setPassword = async function(password) {
  const hash = await bcrypt.hash(password, 10);
  this.hashedPassword = hash;
};

UserSchema.methods.checkPassword = async function(password) {
  const result = await bcrypt.compare(password, this.hashedPassword);
  return result;
};

UserSchema.statics.findByUserid = function(userid) {
  return this.findOne({ userid });
};

UserSchema.methods.serialize = function() {
  const data = this.toJSON();
  delete data.hashedPassword;
  return data;
};

UserSchema.methods.generateToken = function() {
  const token = jwt.sign(
    {
      _id: this.id,
      userid: this.userid,
      username: this.username,
    },
    process.env.JWT_TOKEN_KEY,
    {
      expiresIn: '7d',
    },
  );

  return token;
};

const User = mongoose.model('User', UserSchema);

export default User;
