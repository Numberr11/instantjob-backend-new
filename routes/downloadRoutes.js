const express = require("express");
const ResumeDownload = require("../models/resumeDownload");

const router = express.Router();

// Log a resume download
router.post("/resume-download", async (req, res) => {
  const { candidateId, employerId } = req.body;

  if (!candidateId || !employerId) {
    return res.status(400).json({ message: "candidateId and employerId are required" });
  }

  try {
    const existingDownload = await ResumeDownload.findOne({ candidateId, employerId });

    if (existingDownload) {
      
        existingDownload.isDownload = true;
        await existingDownload.save();
      }

    if (!existingDownload) {
      const download = new ResumeDownload({ candidateId, employerId, isDownload: true });
      await download.save();

    }
      return res.status(201).json({ message: "Resume download logged successfully" });
    

  } catch (error) {
    console.error("Error logging download:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get download stats
router.get("/resume-download-stats", async (req, res) => {
  try {
    const totalDownloads = await ResumeDownload.countDocuments({ isDownload: true });
    res.status(200).json({ totalDownloads });
  } catch (error) {
    console.error("Error fetching download stats:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.post("/candidate-save", async (req, res) => {
  const { candidateId, employerId } = req.body;

  if (!candidateId || !employerId) {
    return res.status(400).json({ message: "candidateId and employerId are required" });
  }
  try {
    const existing = await ResumeDownload.findOne({ candidateId, employerId });

    if (existing) {
      // ✅ If already exists, just update isSave
      if (!existing.isSave) {
        existing.isSave = true;
        await existing.save();
      }
      return res.status(200).json({ message: "Candidate saved successfully (already existed)" });
    }

    // ✅ If not found, create new entry with isSave true
    const newEntry = new ResumeDownload({ candidateId, employerId, isSave: true });
    await newEntry.save();

    return res.status(201).json({ message: "Candidate saved successfully" });

  } catch (error) {
    console.error("Error saving candidate:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

router.get("/resume-save-status/:candidateId/:employerId", async (req,res) => {
  const { candidateId, employerId } = req.params;

  try {
    const record = await ResumeDownload.findOne({ candidateId, employerId });
    return res.status(200).json({ isSave: record ? record.isSave : false });
  } catch (error) {
    console.error("Error fetching save status:", error);
    return res.status(500).json({ message: "Server error" });
  }
});


router.post("/candidate-unsave", async (req, res) => {
  const { candidateId, employerId } = req.body;

  if (!candidateId || !employerId) {
    return res.status(400).json({ message: "candidateId and employerId are required" });
  }

  try {
    const existing = await ResumeDownload.findOne({ candidateId, employerId });

    if (!existing) {
      return res.status(404).json({ message: "No saved candidate found to unsave" });
    }

    if (existing.isSave) {
      existing.isSave = false;
      await existing.save();
      return res.status(200).json({ message: "Candidate unsaved successfully" });
    } else {
      return res.status(200).json({ message: "Candidate was already not saved" });
    }

  } catch (error) {
    console.error("Error unsaving candidate:", error);
    return res.status(500).json({ message: "Server error" });
  }
});


router.get("/get-saved-candidates/:employerId", async (req, res) => {
  const { employerId } = req.params;

  try {
    const savedCandidates = await ResumeDownload.find({
      employerId,
      isSave: true
    })
      .populate("candidateId")

    const candidates = savedCandidates.map(entry => entry.candidateId); 

    res.status(200).json({ count: candidates.length, data: candidates });
  } catch (error) {
    console.error("Error fetching saved candidates:", error);
    res.status(500).json({ message: "Server error" });
  }
});



module.exports = router;
