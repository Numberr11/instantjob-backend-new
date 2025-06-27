const xlsx = require("xlsx");
const BulkCandidate = require("../models/bulkcandidate");
const s3 = require("../utils/s3Config");
const path = require("path");

// S3 upload helper
async function uploadToS3(buffer, filename) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `resumes/${Date.now()}-${filename}`,
    Body: buffer,
    ContentType: "application/pdf",
  };

  const upload = await s3.upload(params).promise();
  return upload.Location;
}

// Controller to handle upload
exports.uploadBulkCandidates = async (req, res) => {
  try {
    const excelFile = req.files.excel?.[0];
    const resumeFiles = req.files.resumes || [];

    if (!excelFile) return res.status(400).json({ message: "Excel file required" });

    // Parse excel
    const workbook = xlsx.read(excelFile.buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    // Map resumes by email (filename without extension should be email)
    const resumeMap = {};
    for (const file of resumeFiles) {
      const email = path.basename(file.originalname, path.extname(file.originalname));
      resumeMap[email.toLowerCase()] = file.buffer;
    }

    const candidates = [];

    for (const row of rows) {
      const {
        full_name, email, phone, gender, currentLocation, prefferedLocation,
        currentpackage, expectedpackage, linkedinProfile, jobRole,
        totalExperience, relevantExperience, currentOrganization,
        noticePeriod
      } = row;

      let resumeUrl = "";

      if (email && resumeMap[email.toLowerCase()]) {
        try {
          const buffer = resumeMap[email.toLowerCase()];
          const filename = `${email}.pdf`;
          resumeUrl = await uploadToS3(buffer, filename);
          console.log(`Uploaded resume for ${email} to S3`);
        } catch (err) {
          console.warn(`Failed to upload resume for ${email}:`, err.message);
        }
      }

      candidates.push({
        full_name, email, phone, gender, currentLocation, prefferedLocation,
        currentpackage, expectedpackage, linkedinProfile, jobRole,
        totalExperience, relevantExperience, currentOrganization,
        noticePeriod, resumeUrl,
      });
    }

    await BulkCandidate.insertMany(candidates);

    res.status(200).json({ message: "Bulk candidates uploaded successfully!" });
  } catch (error) {
    console.error("Error uploading candidates:", error);
    res.status(500).json({ message: "Error uploading candidates", error });
  }
};


exports.getBulkCandidates = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await BulkCandidate.countDocuments();
    const candidates = await BulkCandidate.find()
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      message: "Candidates fetched successfully",
      total,
      page,
      totalPages: Math.ceil(total / limit),
      candidates,
    });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ message: "Error fetching candidates", error });
  }
};


exports.updateBulkCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await BulkCandidate.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }
    res.status(200).json({
      message: "Candidate updated successfully",
      candidate,
    });
  } catch (error) {
    console.error("Error updating candidate:", error);
    res.status(500).json({ message: "Error updating candidate", error });
  }
};

exports.deleteBulkCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await BulkCandidate.findByIdAndDelete(id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }
    res.status(200).json({ message: "Candidate deleted successfully" });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    res.status(500).json({ message: "Error deleting candidate", error });
  }
};


// Controller to handle single candidate creation
exports.addSingleCandidate = async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      gender,
      currentLocation,
      prefferedLocation,
      currentpackage,
      expectedpackage,
      linkedinProfile,
      jobRole,
      totalExperience,
      relevantExperience,
      currentOrganization,
      noticePeriod,
    } = req.body;

    const resumeFile = req.file; // Single file from multer.single("resume")

    // Validate required fields
    if (!full_name || !email || !phone || !jobRole) {
      return res.status(400).json({
        message: "Required fields: full_name, email, phone, jobRole",
      });
    }

    // Check if candidate with the same email already exists
    const existingCandidate = await BulkCandidate.findOne({ email });
    if (existingCandidate) {
      return res.status(400).json({
        message: "Candidate with this email already exists",
      });
    }

    let resumeUrl = "";
    if (resumeFile) {
      try {
        const filename = `${email}.pdf`;
        resumeUrl = await uploadToS3(resumeFile.buffer, filename);
        console.log(`Uploaded resume for ${email} to S3`);
      } catch (err) {
        console.warn(`Failed to upload resume for ${email}:`, err.message);
      }
    }

    // Create new candidate
    const candidate = await BulkCandidate.create({
      full_name,
      email,
      phone,
      gender,
      currentLocation,
      prefferedLocation,
      currentpackage,
      expectedpackage,
      linkedinProfile,
      jobRole,
      totalExperience,
      relevantExperience,
      currentOrganization,
      noticePeriod,
      resumeUrl,
    });

    res.status(201).json({
      message: "Candidate created successfully",
      candidate,
    });
  } catch (error) {
    console.error("Error creating candidate:", error);
    res.status(500).json({
      message: "Error creating candidate",
      error: error.message,
    });
  }
};