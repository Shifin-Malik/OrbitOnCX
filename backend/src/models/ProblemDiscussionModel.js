import mongoose from "mongoose";

const problemDiscussionSchema = new mongoose.Schema(
  {
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProblemDiscussion",
      default: null,
      index: true,
    },
    content: { type: String, required: true, trim: true, maxlength: 4000 },
    likeCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

problemDiscussionSchema.index({ problem: 1, createdAt: -1 });
problemDiscussionSchema.index({ parentComment: 1, createdAt: 1 });

const ProblemDiscussion =
  mongoose.models.ProblemDiscussion ||
  mongoose.model("ProblemDiscussion", problemDiscussionSchema);

export default ProblemDiscussion;

