import Form from "../models/Form.js";
import Submission from "../models/Submission.js";

// @desc    Get all forms
// @route   GET /api/forms
// @access  Private
export const getForms = async (req, res) => {
    try {
        const forms = await Form.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: "submissions",
                    localField: "_id",
                    foreignField: "formId",
                    as: "submissions"
                }
            },
            {
                $addFields: {
                    responseCount: { $size: "$submissions" },
                    // Re-add id field if frontend uses it, though it uses _id mostly. 
                    // Mongoose normally provides .id virtual.
                    id: "$_id"
                }
            },
            {
                $project: {
                    submissions: 0
                }
            }
        ]);
        res.json(forms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single form
// @route   GET /api/forms/:id
// @access  Private
export const getFormById = async (req, res) => {
    try {
        const form = await Form.findById(req.params.id);
        if (form) {
            res.json(form);
        } else {
            res.status(404).json({ message: "Form not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a form
// @route   POST /api/forms
// @access  Private
export const createForm = async (req, res) => {
    try {
        const form = await Form.create(req.body);
        res.status(201).json(form);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a form
// @route   PUT /api/forms/:id
// @access  Private
export const updateForm = async (req, res) => {
    try {
        const form = await Form.findById(req.params.id);
        if (form) {
            const updatedForm = await Form.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(updatedForm);
        } else {
            res.status(404).json({ message: "Form not found" });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a form
// @route   DELETE /api/forms/:id
// @access  Private
export const deleteForm = async (req, res) => {
    try {
        const form = await Form.findById(req.params.id);
        if (form) {
            await form.deleteOne();
            res.json({ message: "Form removed" });
        } else {
            res.status(404).json({ message: "Form not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get form statistics (submission count)
// @route   GET /api/forms/stats
// @access  Private
export const getFormStats = async (req, res) => {
    try {
        const stats = await Submission.aggregate([
            {
                $group: {
                    _id: "$formId",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Map stats to forms to return a clearer structure
        // But for dashboard, maybe we just want to list forms with their counts.
        // Let's attach counts to the forms list logic or return this map.
        // For now, returning the raw aggregation.
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get submissions for a form
// @route   GET /api/forms/:id/responses
// @access  Private
export const getFormResponses = async (req, res) => {
    try {
        const responses = await Submission.find({ formId: req.params.id }).sort({ createdAt: -1 });
        res.json(responses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Duplicate a form
// @route   POST /api/forms/:id/duplicate
// @access  Private
export const duplicateForm = async (req, res) => {
    try {
        const originalForm = await Form.findById(req.params.id);
        if (!originalForm) {
            return res.status(404).json({ message: "Form not found" });
        }

        // Create a copy of the form data
        const formData = originalForm.toObject();

        // Remove MongoDB fields
        delete formData._id;
        delete formData.createdAt;
        delete formData.updatedAt;
        delete formData.__v;

        // Modify fields for the duplicate
        formData.title = `Copy of ${formData.title}`;
        formData.slug = `${formData.slug}-copy-${Date.now()}`;
        formData.isPublished = false; // Start as draft
        formData.isFavorite = false;

        // Reset question IDs if necessary
        if (formData.questions) {
            formData.questions = formData.questions.map(q => {
                const newQ = { ...q };
                delete newQ._id;
                return newQ;
            });
        }

        const newForm = await Form.create(formData);
        res.status(201).json(newForm);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
