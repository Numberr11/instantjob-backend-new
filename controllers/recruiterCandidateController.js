const RecruiterCandidate = require("../models/recruiterCandidate");

exports.addCandidate = async (req, res) => {
  try {
    const { full_name, phone, email,jobRole,exp } = req.body;
    const resumeUrl = req.file?.location;

    const emailExists = await RecruiterCandidate.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        message: "Candidate with this email already exists."
      });
    }

    // Check for existing phone
    const phoneExists = await RecruiterCandidate.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({
        message: "Candidate with this phone number already exists."
      });
    }

    const newCandidate = new RecruiterCandidate({
      full_name,
      phone,
      email,
      jobRole,
      exp,
      resumeUrl,
      createdBy: req.user.id,
    });

    await newCandidate.save();
    res.status(201).json({ message: "Candidate added", candidate: newCandidate });
  } catch (err) {
    res.status(500).json({ message: "Failed to add candidate", error: err.message });
  }
};

exports.getAllCandidates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const candidates = await RecruiterCandidate.find()
      .populate('createdBy', 'full_name')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await RecruiterCandidate.countDocuments();

    res.status(200).json({
      message: "Candidates fetched successfully",
      candidates,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
};

exports.getCandidatesByRecruiter = async (req, res) => {
  try {
    const recruiterId = req.user.id;

    const candidates = await RecruiterCandidate.find({ createdBy: recruiterId })
    .sort({createdAt: -1})

    res.status(200).json({
      message: "Candidates fetched successfully.",
      candidates,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch candidates.",
      error: err.message,
    });
  }
};


exports.updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    if (req.file?.location) updateData.resumeUrl = req.file.location;

    const updated = await RecruiterCandidate.findOneAndUpdate(
      { _id: id, createdBy: req.user.id },
      updateData,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Candidate not found" });

    res.status(200).json({ message: "Candidate updated", candidate: updated });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await RecruiterCandidate.findOneAndDelete({
      _id: id,
      createdBy: req.user.id,
    });

    if (!deleted) return res.status(404).json({ message: "Candidate not found" });

    res.status(200).json({ message: "Candidate deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};
