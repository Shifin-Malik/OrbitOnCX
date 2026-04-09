import mongoose from "mongoose";

const dailyActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dayKey: { type: String, required: true, index: true }, // YYYY-MM-DD (UTC)
    acceptedCount: { type: Number, default: 0 },
    solvedProblemIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Problem",
      default: [],
    },
  },
  { timestamps: true },
);

dailyActivitySchema.index({ user: 1, dayKey: 1 }, { unique: true });

const DailyActivity =
  mongoose.models.DailyActivity ||
  mongoose.model("DailyActivity", dailyActivitySchema);

export default DailyActivity;

