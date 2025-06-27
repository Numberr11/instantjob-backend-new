const candidateApplyJobsByCareers = require("../models/candApplyJobsByCareers");
const s3 = require("../utils/s3Config");

async function uploadToS3(buffer, filename) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `resumes-by-careers/${Date.now()}-${filename}`,
    Body: buffer,
    ContentType: "application/pdf",
  };

  const upload = await s3.upload(params).promise();
  return upload.Location;
}

const applyJobController = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      contact,
      experience,
      email,
      title,
    } = req.body;

    const resumeFile = req.file;

    if (!resumeFile) {
      return res.status(400).json({ message: "Resume file is required." });
    }

    const existingCandidate = await candidateApplyJobsByCareers.findOne({
      email,
    });
    if (existingCandidate) {
      return res.status(200).json({
        message:
          "No worries! You’ve already submit the resume. We’ll get back to you soon.",
        alreadyApplied: true,
        data: existingCandidate,
      });
    }

    let resumeUrl = "";
    try {
      const filename = `${email}-${Date.now()}.pdf`;
      resumeUrl = await uploadToS3(resumeFile.buffer, filename);
    } catch (err) {
      console.warn(`Failed to upload resume for ${email}:`, err.message);
      return res.status(500).json({ message: "Resume upload failed" });
    }

    if (!resumeUrl) {
      return res.status(500).json({ message: "Resume URL is empty" });
    }

    const newCandidate = new candidateApplyJobsByCareers({
      firstName,
      middleName: middleName || "",
      lastName: lastName || "",
      contact,
      experience,
      email,
      title,
      resumeUrl,
    });

    await newCandidate.save();

    res.status(201).json({
      message: "Application submitted successfully.",
      data: newCandidate,
    });
  } catch (error) {
    console.error("Error submitting job application:", error);
    res.status(500).json({ message: "Internal Server Error." });
  }
};

module.exports = { applyJobController };
