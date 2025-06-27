const Job = require("../models/jobModels");
const Candidate = require("../models/candidate.model");
const JobApplieds = require("../models/applyJobModels");
const { format } = require("date-fns");

exports.getJobCandidateDetails = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Total count
    const totalJobApplications = await JobApplieds.countDocuments();

    // Paginated fetch
    const jobApplications = await JobApplieds.find()
      .populate({
        path: "candidateId",
        model: "Candidate",
        select: "full_name email resumeUrl phone totalExperience city",
      })
      .populate({
        path: "jobId",
        model: "Job",
        select:
          "title companyName location salaryRange jobType minExp maxExp keySkills industryType category openings status postedAt",
      })
      .select("createdAt updatedAt")
      .sort({createdAt: -1})
      .skip(skip)
      .limit(limit)
      .lean();

    if (!jobApplications.length) {
      return res.status(404).json({
        success: false,
        message: "No job applications found",
      });
    }

    // Format the data
    const formattedApplications = jobApplications.map((app) => ({
      applicationId: app._id,
      appliedAt: app.createdAt
        ? format(new Date(app.createdAt), "d MMMM yyyy")
        : "N/A",
      updatedAt: app.updatedAt
        ? format(new Date(app.updatedAt), "d MMMM yyyy")
        : "N/A",
      candidate: {
        fullName: app.candidateId?.full_name || "N/A",
        email: app.candidateId?.email || "N/A",
        resumeUrl: app.candidateId?.resumeUrl || "N/A",
        phone: app.candidateId?.phone || "N/A",
        totalExperience: app.candidateId?.totalExperience || 0,
        city: app.candidateId?.city || "N/A",
      },
      job: {
        jobId: app.jobId?._id,
        title: app.jobId?.title || "N/A",
        companyName: app.jobId?.companyName || "N/A",
        location: app.jobId?.location || "N/A",
        salaryRange: app.jobId?.salaryRange || "N/A",
        jobType: app.jobId?.jobType || "N/A",
        minExperience: app.jobId?.minExp || 0,
        maxExperience: app.jobId?.maxExp || 0,
        keySkills: app.jobId?.keySkills || [],
        industryType: app.jobId?.industryType || "N/A",
        category: app.jobId?.category || "N/A",
        openings: app.jobId?.openings || 0,
        status: app.jobId?.status || "N/A",
        postedAt: app.jobId?.postedAt
          ? format(new Date(app.jobId.postedAt), "d MMMM yyyy")
          : "N/A",
      },
    }));

    res.status(200).json({
      success: true,
      totalJobApplications,
      totalPages: Math.ceil(totalJobApplications / limit),
      currentPage: page,
      count: formattedApplications.length,
      data: formattedApplications,
    });
  } catch (error) {
    console.error("Error fetching job applications:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching job applications",
      error: error.message,
    });
  }
};
