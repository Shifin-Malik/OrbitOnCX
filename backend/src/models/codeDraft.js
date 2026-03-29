import mongoose from "mongoose";

const codeDraftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: ["javascript", "python", "java", "cpp", "c", "go", "rust", "php"],
    },
    code: {
      type: String,
      default: "",
      trim: true,
      maxlength: [10000, "Code is too long! Max 10,000 characters allowed"],
    },
  },
  {
    timestamps: true,
  }
);


codeDraftSchema.index({ userId: 1, language: 1 }, { unique: true });

const CodeDraft = mongoose.model("CodeDraft", codeDraftSchema);
export default CodeDraft;