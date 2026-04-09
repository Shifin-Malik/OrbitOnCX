import mongoose from "mongoose";

const problemCodeDraftSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
      index: true,
    },
    language: { type: String, required: true, trim: true, index: true },
    code: { type: String, default: "", maxlength: 200000 },
  },
  { timestamps: true },
);

problemCodeDraftSchema.index({ user: 1, problem: 1, language: 1 }, { unique: true });

const ProblemCodeDraft =
  mongoose.models.ProblemCodeDraft ||
  mongoose.model("ProblemCodeDraft", problemCodeDraftSchema);

export default ProblemCodeDraft;

