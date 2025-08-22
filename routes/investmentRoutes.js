const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadProof");
const investmentController = require("../controllers/investmentController");

// Upload proof
router.post("/upload", upload.single("proofImage"), investmentController.uploadProof);

// Get all proofs (admin)
router.get("/", investmentController.getAllProofs);

// Update proof status
router.put("/:id", investmentController.updateProofStatus);

module.exports = router;
