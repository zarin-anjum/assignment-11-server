import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    photo: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "creator", "admin"],
      default: "user",
    },
    bio: { type: String, default: "" },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
