import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
    id: String,
    label: String,
    type: {
        type: String,
        enum: ['text', 'textarea', 'select', 'checkbox', 'radio', 'date', 'email', 'number', 'rating', 'file', 'section'],
        default: 'text'
    },
    required: { type: Boolean, default: false },
    placeholder: String,
    options: [String],
    order: Number
});

const FormSchema = new mongoose.Schema(
    {
        title: String,
        description: String,
        slug: { type: String, unique: true },
        isPublished: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        limitOneResponse: { type: Boolean, default: false },
        collectEmails: { type: Boolean, default: false },
        isAnonymous: { type: Boolean, default: false },
        isFavorite: { type: Boolean, default: false },
        questions: [QuestionSchema],
        reportSettings: {
            startDate: Date,
            endDate: Date,
            totalDays: String,
            trainingDay: String,
            presentCount: String,
            signatureImage: String,
            signatureName: String,
            signatureTitle: String,
            signatureDepartment: String,
            signatureLocation: String
        }
    },
    { timestamps: true }
);

export default mongoose.model("Form", FormSchema);
