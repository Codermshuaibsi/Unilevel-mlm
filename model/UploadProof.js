const mongoose = require("mongoose");

const proofSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    proofImage: {
      type: String, // URL of uploaded image (from Cloudinary, S3, etc.)
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Proof", proofSchema);
