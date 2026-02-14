import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema(
    {
        formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form" },
        ipAddress: String,
        name: String,
        email: String,
        answers: mongoose.Schema.Types.Mixed
    },
    { timestamps: true }
);

export default mongoose.model("Submission", SubmissionSchema);
