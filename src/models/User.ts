import { InferSchemaType, Model, model, models, Schema } from "mongoose";

export interface User {
  username: string;
  email: string;
  passwordHash: string;
  geminiToken: string;
}

const userSchema = new Schema({
  username: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  passwordHash: { type: String, required: true, select: false },
  geminiToken: { type: String, required: true, select: false },
});

const User: Model<User> = models.User || model<User>("User", userSchema);

export default User;
