import mongoose from "mongoose";

const contestSchema = new mongoose.Schema(
  {
    contestName: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "Image Design",
        "Article Writing",
        "Business Ideas",
        "Gaming Review",
        "Movie Review",
      ],
    },
    description: {
      type: String,
      required: true,
    },
    taskDetails: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: "",
    },
    prizeMoney: {
      type: Number,
      required: true,
    },
    entryFee: {
      type: Number,
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    participantsCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    createdBy: {
      type: String, // store creator's email
      required: true,
    },
    winner: {
      name: { type: String, default: null },
      photo: { type: String, default: null },
      email: { type: String, default: null },
    },
    submissions: [
      {
        userEmail: String,
        userName: String,
        userPhoto: String,
        submissionLink: String,
        submittedAt: { type: Date, default: Date.now },
      },
    ],
    registeredUsers: [
      {
        type: String, // array of emails
      },
    ],
  },
  { timestamps: true }
);

const Contest = mongoose.model("Contest", contestSchema);
export default Contest;