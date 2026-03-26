import mongoose from "mongoose";

const codeExecutionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
     
    },
    language: {
      type: String,
      required: true,
      enum: ["javascript", "python", "java", "cpp", "c", "go", "rust", "php"],
    },
    code: { type: String, required: true },
    output: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Success", "Error"],
      default: "Success",
    },
    time: { type: String },
    memory: { type: String },
  },
  {
    timestamps: true, 
  }
);


codeExecutionSchema.index({ userId: 1, createdAt: -1 });


codeExecutionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const CodeExecution = mongoose.model("CodeExecution", codeExecutionSchema);
export default CodeExecution;