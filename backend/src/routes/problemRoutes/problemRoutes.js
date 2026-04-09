import express from "express";
import { protect } from "../../middlewares/authMiddleware.js";
import { listProblems, getProblemBySlug } from "../../controllers/problemController/problemController.js";
import { runProblem, submitProblem } from "../../controllers/problemController/problemExecutionController.js";
import { getMySubmissionsForProblem } from "../../controllers/problemController/problemSubmissionController.js";
import { getProblemDraft, upsertProblemDraft } from "../../controllers/problemController/problemDraftController.js";

const router = express.Router();

router.use(protect);

router.get("/", listProblems);
router.get("/:slug", getProblemBySlug);

router.post("/:slug/run", runProblem);
router.post("/:slug/submit", submitProblem);

router.get("/:slug/submissions", getMySubmissionsForProblem);

router.get("/:slug/draft", getProblemDraft);
router.put("/:slug/draft", upsertProblemDraft);

export default router;

