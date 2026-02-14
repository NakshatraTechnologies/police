import express from "express";
import {
    getForms,
    getFormById,
    createForm,
    updateForm,
    deleteForm,
    getFormStats,
    getFormResponses,
    duplicateForm
} from "../controllers/formController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth); // Protect all form routes

router.route("/")
    .get(getForms)
    .post(createForm);

router.get("/stats", getFormStats);

router.route("/:id")
    .get(getFormById)
    .put(updateForm)
    .delete(deleteForm);

router.post("/:id/duplicate", duplicateForm);

router.get("/:id/responses", getFormResponses);


// router.post("/:id/publish", updateForm); // Can use updateForm with { isPublished: true } body

export default router;
