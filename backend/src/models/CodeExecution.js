import mongoose from "mongoose";

const codeExecutionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  language: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true, // ഇവിടെ മാറ്റമില്ല, കോഡ് സേവ് ചെയ്യാൻ ഇത് വേണം.
  },
  output: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Success", "Error"],
  },
  executedAt: {
    type: Date,
    default: Date.now,
    index: { expires: "2h" },
  },
});

codeExecutionSchema.index({ userId: 1, executedAt: -1 });

const CodeExecution = mongoose.model("CodeExecution", codeExecutionSchema);
export default CodeExecution;
