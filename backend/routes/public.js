import express from "express";
import Form from "../models/Form.js";
import Submission from "../models/Submission.js";

const router = express.Router();

router.get("/forms/:slug", async (req, res) => {
    const form = await Form.findOne({ slug: req.params.slug, isPublished: true });
    if (!form) {
        return res.status(404).json({ message: "Form not found" });
    }
    if (!form.isActive) {
        return res.status(403).json({ message: "Form is inactive" });
    }
    res.json(form);
});

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Unique filename: formSlug-date-originalName
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

router.post("/forms/:slug/submit", upload.any(), async (req, res) => {
    try {
        const form = await Form.findOne({ slug: req.params.slug });
        if (!form) {
            return res.status(404).json({ message: "Form not found" });
        }
        if (!form.isActive) {
            return res.status(403).json({ message: "Form is inactive" });
        }

        // Process Answers
        // When using multer, req.body.answers might be a JSON string if sent as a single field
        // OR it might be individual fields if the frontend appends them one by one.
        // Let's assume frontend sends a field 'answers' which is JSON stringified, OR we handle plain fields.

        let answers = {};
        if (req.body.answers) {
            try {
                answers = typeof req.body.answers === 'string' ? JSON.parse(req.body.answers) : req.body.answers;
            } catch (e) {
                console.error("Error parsing answers JSON", e);
                answers = req.body.answers;
            }
        } else {
            // If answers are sent as separate fields (e.g. questions[id]=answer), we might need to reconstruct.
            // But simpler to force frontend to send 'answers' as JSON string.
            // or spread req.body if not structured.
            answers = { ...req.body };
            delete answers.email; // remove keys that are separate
        }

        // Handle Files
        // req.files is array of files. We need to map them to the question IDs.
        // Frontend should use question ID as the field name for the file input.
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                // file.fieldname should be the question ID
                // Construct public URL
                // Assuming server runs on PORT 5000 and we serve /uploads
                // We'll store the relative path or full URL. Relative is safer for migration.
                const fileUrl = `/uploads/${file.filename}`;
                answers[file.fieldname] = fileUrl;
            });
        }

        // Check for limit one response
        if (form.limitOneResponse && !form.collectEmails) {
            const existingSubmission = await Submission.findOne({
                formId: form._id,
                ipAddress: req.ip
            });
            if (existingSubmission) {
                return res.status(409).json({ message: "You have already submitted this form." });
            }
        }

        // Email logic
        let submissionEmail = null;
        if (form.collectEmails) {
            if (!req.body.email) {
                return res.status(400).json({ message: "Email address is required." });
            }
            submissionEmail = req.body.email;

            if (form.limitOneResponse) {
                const existingEmailSubmission = await Submission.findOne({
                    formId: form._id,
                    email: submissionEmail
                });
                if (existingEmailSubmission) {
                    return res.status(409).json({ message: "You have already shared your feedback using this email." });
                }
            }
        }

        await Submission.create({
            formId: form._id,
            answers: answers,
            ipAddress: req.ip,
            email: submissionEmail,
            name: req.body.name // Add name field
        });

        res.json({ success: true });

    } catch (error) {
        console.error("Submission Error:", error);
        res.status(500).json({ message: "Server Error processing submission" });
    }
});

export default router;
