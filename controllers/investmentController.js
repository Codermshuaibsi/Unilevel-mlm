const Proof = require("../model/UploadProof");
const cloudinary = require("../config/cloudinary");

exports.uploadProof = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Proof screenshot is required" });
    }

    // Wrap upload_stream in a Promise
    const uploadTocloudinary = () => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "proofs" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
    };

    const uploadResult = await uploadTocloudinary();

    // Save to DB
    const newProof = new Proof({
      userId: req.body.userId,
      proofImage: uploadResult.secure_url,
      status: "pending",
    });

    await newProof.save();

    res.status(201).json({
      message: "Proof uploaded successfully, awaiting approval",
      proof: newProof,
    });

  } catch (error) {
    console.error("Error uploading proof:", error);
    res.status(500).json({ message: "Server error", error });
  }
};


// Get all proofs (admin side)
exports.getAllProofs = async (req, res) => {
  try {
    const proofs = await Proof.find().populate("userId", "name email");
    res.status(200).json(proofs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Update proof status (approve/reject)
exports.updateProofStatus = async (req, res) => {
  try {
    const { id } = req.params; // proof id
    const { status } = req.body; // new status ("approved" / "rejected")

    const updatedProof = await Proof.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedProof) {
      return res.status(404).json({ message: "Proof not found" });
    }

    res.status(200).json({
      message: `Proof ${status} successfully`,
      proof: updatedProof,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
