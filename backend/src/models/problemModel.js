import mongoose from "mongoose";

const problemSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, lowercase: true, unique: true, required: true },
    description: { type: String, required: true },
    constraints: { type: String }, 
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
    topic: [{ type: String }], 
    sampleInput: { type: String, required: true },
    sampleOutput: { type: String, required: true },
    testCases: [{
        input: { type: String, required: true },
        output: { type: String, required: true },
        isHidden: { type: Boolean, default: true }
    }],
    timeLimit: { type: Number, default: 1000 },
    languagesSupported: { 
        type: [String], 
        default: ["javascript", "python", "cpp", "typescript", "go"] 
    },
    solvedCount: { type: Number, default: 0 }, 
    hints: [{ type: String }]
}, { timestamps: true });



export default mongoose.model("Problem", problemSchema);