const mongoose = require("mongoose");

const Job = require("../models/jobModels");
const Candidate = require("../models/candidate.model");
const SaveJob = require("../models/saveJob");
const ApplyJob = require("../models/applyJobModels");

function calculateMatchScore(job, candidate) {
  let matchCount = 0;
  let score = 0;

  // Normalize skills
  const jobSkills = job.keySkills.map((skill) => skill.toLowerCase());
  const candidateSkills = candidate.skills.map((skill) => skill.toLowerCase());

  // Skills match (at least one skill)
  const skillMatches = jobSkills.filter((skill) =>
    candidateSkills.includes(skill)
  ).length;
  if (skillMatches > 0) {
    matchCount += 1;
    score += skillMatches * 20; // Higher weight for skills
  }

  // Location match
  const jobLocation = job.location.toLowerCase();
  const preferredLocation = candidate.preferredLocation?.toLowerCase() || "";
  if (
    preferredLocation &&
    (jobLocation === preferredLocation || jobLocation === "remote")
  ) {
    matchCount += 1;
    score += jobLocation === preferredLocation ? 20 : 10; // More points for exact match
  }

  // Experience match
  const experienceYears = parseInt(candidate.totalExperience) || 0;
  if (experienceYears >= job.minExp && experienceYears <= job.maxExp) {
    matchCount += 1;
    score += 15;
  }

  // Salary match
  const [minSalary, maxSalary] = job.salaryRange
    .split("-")
    .map((s) => (isNaN(parseInt(s)) ? 0 : parseInt(s)));
  const expectedSalary =
    parseInt(candidate.expectedSalary?.replace(/[^0-9]/g, "")) * 100000 || 0;
  if (expectedSalary >= minSalary && expectedSalary <= maxSalary) {
    matchCount += 1;
    score += 15;
  }

  // Job type match
  if (job.jobType.toLowerCase() === candidate.preferredJobType?.toLowerCase()) {
    matchCount += 1;
    score += 10;
  }

  // Return object with match count and score
  return { matchCount, score: Math.max(0, Math.min(score, 100)) };
}

exports.getRecommendedJobs = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { page = 1, limit = 9 } = req.query;
    // Fetch candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Query only requires Active status
    const query = { status: "Active" };

    // Fetch jobs with pagination
    const jobs = await Job.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Filter jobs by match count (>= 2 criteria)
    const filteredJobs = jobs
      .map((job) => {
        const { matchCount, score } = calculateMatchScore(job, candidate);
        return { ...job, matchCount, matchScore: score };
      })
      .filter((job) => job.matchCount >= 2) // At least 2 criteria must match
      .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score

    // Get total count of active jobs (for pagination)
    const totalJobs = await Job.countDocuments(query);

    // Format jobs for frontend
    const formattedJobs = filteredJobs.map((job) => ({
      id: job._id.toString(),
      title: job.title,
      company: job.companyName,
      location: job.location,
      salary: job.salaryRange,
      posted: new Date(job.postedAt).toLocaleDateString(),
      tags: job.keySkills,
      matchScore: job.matchScore,
    }));

    res.json({
      jobs: formattedJobs,
      totalJobs,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalJobs / limit),
    });
  } catch (error) {
    console.error("Error fetching recommended jobs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSavedJobs = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { page = 1, limit = 9 } = req.query;

    // Fetch candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Fetch saved jobs for the candidate with pagination
    const savedJobs = await SaveJob.find({ candidateId })
      .populate({
        path: "jobId",
        match: { status: "Active" },
        select:
          "title companyName location salaryRange postedAt keySkills minExp maxExp jobType",
      })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Filter out any null jobId results (e.g., inactive jobs)
    const validSavedJobs = savedJobs.filter((savedJob) => savedJob.jobId);

    // Get total count of saved jobs for pagination
    const totalJobs = await SaveJob.countDocuments({ candidateId });

    // Format jobs for frontend with matchScore and matchCount
    const formattedJobs = validSavedJobs.map((savedJob) => {
      const { matchCount, score } = calculateMatchScore(
        savedJob.jobId,
        candidate
      );
      return {
        id: savedJob.jobId._id.toString(),
        title: savedJob.jobId.title,
        company: savedJob.jobId.companyName,
        location: savedJob.jobId.location,
        salary: savedJob.jobId.salaryRange,
        posted: new Date(savedJob.jobId.postedAt).toLocaleDateString(),
        tags: savedJob.jobId.keySkills,
        savedAt: new Date(savedJob.createdAt).toLocaleDateString(),
        matchScore: score,
        matchCount,
      };
    });

    res.json({
      jobs: formattedJobs,
      totalJobs,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalJobs / limit),
    });
  } catch (error) {
    console.error("Error fetching saved jobs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAppliedJobs = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { page = 1, limit = 9 } = req.query;

    // Fetch candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Fetch applied jobs for the candidate with pagination
    const appliedJobs = await ApplyJob.find({ candidateId })
      .populate({
        path: "jobId",
        match: { status: "Active" },
        select:
          "title companyName location salaryRange postedAt keySkills minExp maxExp jobType",
      })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    // Filter out any null jobId results (e.g., inactive jobs)
    const validAppliedJobs = appliedJobs.filter(
      (appliedJob) => appliedJob.jobId
    );

    // Get total count of applied jobs for pagination
    const totalJobs = await ApplyJob.countDocuments({ candidateId });

    // Format jobs for frontend with matchScore and matchCount
    const formattedJobs = validAppliedJobs.map((appliedJob) => {
      const { matchCount, score } = calculateMatchScore(
        appliedJob.jobId,
        candidate
      );
      return {
        id: appliedJob.jobId._id.toString(),
        title: appliedJob.jobId.title,
        company: appliedJob.jobId.companyName,
        location: appliedJob.jobId.location,
        salary: appliedJob.jobId.salaryRange,
        posted: new Date(appliedJob.jobId.postedAt).toLocaleDateString(),
        tags: appliedJob.jobId.keySkills,
        appliedAt: new Date(appliedJob.createdAt).toLocaleDateString(),
        matchScore: score,
        matchCount,
      };
    });

    res.json({
      jobs: formattedJobs,
      totalJobs,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalJobs / limit),
    });
  } catch (error) {
    console.error("Error fetching applied jobs:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getCandidateStats = async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Fetch candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Define date ranges for current and previous months
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Count applied jobs for current and previous months
    const jobsAppliedCurrent = await ApplyJob.countDocuments({
      candidateId,
      createdAt: { $gte: currentMonthStart, $lte: now },
    });
    const jobsAppliedPrevious = await ApplyJob.countDocuments({
      candidateId,
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
    });

    // Count saved jobs for current and previous months
    const savedJobsCurrent = await SaveJob.countDocuments({
      candidateId,
      createdAt: { $gte: currentMonthStart, $lte: now },
    });
    const savedJobsPrevious = await SaveJob.countDocuments({
      candidateId,
      createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd },
    });

    // Calculate percentage changes
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0 && current === 0) return "+0% from last month";
      if (previous === 0 && current > 0) return "+100% from last month";
      if (current === 0 && previous > 0) return "-100% from last month";

      const change = ((current - previous) / previous) * 100;
      const absoluteChange = Math.abs(change).toFixed(2);
      const prefix = change >= 0 ? "+" : "-";
      return `${prefix}${absoluteChange}% from last month`;
    };

    const jobsAppliedPercentageChange = calculatePercentageChange(
      jobsAppliedCurrent,
      jobsAppliedPrevious
    );
    const savedJobsPercentageChange = calculatePercentageChange(
      savedJobsCurrent,
      savedJobsPrevious
    );

    // Calculate profile strength
    const fields = [
      candidate.full_name,
      candidate.email,
      candidate.phone,
      candidate.education?.length > 0,
      candidate.experience?.length > 0,
      candidate.skills?.length > 0,
      candidate.expectedSalary,
      candidate.preferredJobType,
      candidate.preferredLocation,
      candidate.resumeUrl,
      candidate.totalExperience,
      candidate.noticePeriod,
    ];
    const filledFields = fields.filter((field) => field && field !== "").length;
    const profileStrength = Math.round((filledFields / fields.length) * 100);

    res.json({
      jobsApplied: jobsAppliedCurrent,
      savedJobs: savedJobsCurrent,
      profileStrength,
      jobsAppliedPercentageChange,
      savedJobsPercentageChange,
    });
  } catch (error) {
    console.error("Error fetching candidate stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.searchJobs = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { search = "", type, page = 1, limit = 9 } = req.query;

    // Validate inputs
    if (!candidateId || !type) {
      return res
        .status(400)
        .json({ message: "candidateId and type are required" });
    }

    if (!["recommended", "saved", "applied"].includes(type)) {
      return res.status(400).json({ message: "Invalid type" });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res.status(400).json({ message: "Invalid page or limit" });
    }

    // Validate candidateId
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ message: "Invalid candidateId" });
    }

    // Fetch candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    const skip = (pageNum - 1) * limitNum;
    let jobs = [];
    let totalJobs = 0;

    // Escape special regex characters to prevent injection
    const escapeRegex = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    // Build regex query
    const regexQuery = search
      ? {
          $and: [
            {
              $or: [
                { title: { $regex: escapeRegex(search), $options: "i" } },
                { companyName: { $regex: escapeRegex(search), $options: "i" } },
                { location: { $regex: escapeRegex(search), $options: "i" } },
              ],
            },
            { status: "Active" },
          ],
        }
      : { status: "Active" };

    if (type === "recommended") {
      try {
        // Use regex query only
        jobs = await Job.find(regexQuery).skip(skip).limit(limitNum).lean();

        totalJobs = await Job.countDocuments(regexQuery);

        // Log index usage
        const explain = await Job.find(regexQuery).explain("executionStats");
      } catch (err) {
        console.error("Error in Job.find for recommended:", err);
        throw err;
      }

      // Filter by match count (>= 2 criteria) and calculate matchScore
      jobs = jobs
        .map((job) => {
          const { matchCount, score } = calculateMatchScore(job, candidate);
          return { ...job, matchCount, matchScore: score };
        })
        .filter((job) => job.matchCount >= 2)
        .sort((a, b) => b.matchScore - a.matchScore);

      // Format jobs for frontend
      jobs = jobs.map((job) => ({
        id: job._id.toString(),
        title: job.title,
        company: job.companyName,
        location: job.location,
        salary: job.salaryRange,
        posted: new Date(job.postedAt).toLocaleDateString(),
        tags: job.keySkills,
        matchScore: job.matchScore,
      }));
    } else if (type === "saved") {
      // Saved jobs: Use regex search only in lookup
      const savedJobsPipeline = [
        { $match: { candidateId: candidate._id } },
        {
          $lookup: {
            from: "jobs",
            let: { jobId: "$jobId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$jobId"] },
                  status: "Active",
                  ...regexQuery,
                },
              },
              {
                $project: {
                  title: 1,
                  companyName: 1,
                  location: 1,
                  salaryRange: 1,
                  postedAt: 1,
                  keySkills: 1,
                  minExp: 1,
                  maxExp: 1,
                  jobType: 1,
                },
              },
            ],
            as: "jobId",
          },
        },
        { $unwind: "$jobId" },
        {
          $group: {
            _id: null,
            jobs: { $push: "$$ROOT" },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            jobs: { $slice: ["$jobs", skip, limitNum] },
            total: 1,
          },
        },
      ];

      const savedJobsResult = await SaveJob.aggregate(savedJobsPipeline).catch(
        (err) => {
          console.error("Aggregation error for saved jobs:", err);
          throw err;
        }
      );

      jobs = savedJobsResult[0]?.jobs || [];
      totalJobs = savedJobsResult[0]?.total || 0;

      jobs = jobs.map((savedJob) => {
        const { matchCount, score } = calculateMatchScore(
          savedJob.jobId,
          candidate
        );
        return {
          id: savedJob.jobId._id.toString(),
          title: savedJob.jobId.title,
          company: savedJob.jobId.companyName,
          location: savedJob.jobId.location,
          salary: savedJob.jobId.salaryRange,
          posted: new Date(savedJob.jobId.postedAt).toLocaleDateString(),
          tags: savedJob.jobId.keySkills,
          savedAt: new Date(savedJob.createdAt).toLocaleDateString(),
          matchScore: score,
          matchCount,
        };
      });
    } else if (type === "applied") {
      const appliedJobsPipeline = [
        { $match: { candidateId: candidate._id } },
        {
          $lookup: {
            from: "jobs",
            let: { jobId: "$jobId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$jobId"] },
                  status: "Active",
                  ...regexQuery,
                },
              },
              {
                $project: {
                  title: 1,
                  companyName: 1,
                  location: 1,
                  salaryRange: 1,
                  postedAt: 1,
                  keySkills: 1,
                  minExp: 1,
                  maxExp: 1,
                  jobType: 1,
                },
              },
            ],
            as: "jobId",
          },
        },
        { $unwind: "$jobId" },
        {
          $group: {
            _id: null,
            jobs: { $push: "$$ROOT" },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            jobs: { $slice: ["$jobs", skip, limitNum] },
            total: 1,
          },
        },
      ];

      const appliedJobsResult = await ApplyJob.aggregate(
        appliedJobsPipeline
      ).catch((err) => {
        console.error("Aggregation error for applied jobs:", err);
        throw err;
      });

      jobs = appliedJobsResult[0]?.jobs || [];
      totalJobs = appliedJobsResult[0]?.total || 0;

      jobs = jobs.map((appliedJob) => {
        const { matchCount, score } = calculateMatchScore(
          appliedJob.jobId,
          candidate
        );
        return {
          id: appliedJob.jobId._id.toString(),
          title: appliedJob.jobId.title,
          company: appliedJob.jobId.companyName,
          location: appliedJob.jobId.location,
          salary: appliedJob.jobId.salaryRange,
          posted: new Date(appliedJob.jobId.postedAt).toLocaleDateString(),
          tags: appliedJob.jobId.keySkills,
          appliedAt: new Date(appliedJob.createdAt).toLocaleDateString(),
          matchScore: score,
          matchCount,
        };
      });
    }

    res.json({
      jobs,
      totalJobs,
      currentPage: pageNum,
      totalPages: Math.ceil(totalJobs / limitNum),
    });
  } catch (error) {
    console.error("Error searching jobs:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
};


const profileTasksConfig = [
  {
    id: 1,
    task: "Upload resume",
    check: (candidate) => !!candidate.resumeUrl && candidate.resumeUrl !== "",
  },
  {
    id: 2,
    task: "Add work experience",
    check: (candidate) =>
      !!candidate.experience && candidate.experience.length > 0,
  },
  {
    id: 3,
    task: "Add education",
    check: (candidate) =>
      !!candidate.education && candidate.education.length > 0,
  },
  {
    id: 4,
    task: "Add skills",
    check: (candidate) => !!candidate.skills && candidate.skills.length > 0,
  },
  {
    id: 5,
    task: "Complete about section",
    check: (candidate) => !!candidate.about && candidate.about.trim() !== "",
  },
  {
    id: 6,
    task: "Add profile picture",
    check: (candidate) =>
      !!candidate.profileImage && candidate.profileImage !== "",
  },
  {
    id: 7,
    task: "Add projects",
    check: (candidate) => !!candidate.projects && candidate.projects.length > 0,
  },
];

exports.getProfileTasks = async (req, res) => {
  try {
    const { candidateId } = req.params;

    // Validate candidateId
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ message: "Invalid candidateId" });
    }

    // Fetch candidate
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Generate profile tasks with completion status
    const profileTasks = profileTasksConfig.map((task) => ({
      id: task.id,
      task: task.task,
      completed: task.check(candidate),
    }));

    // Calculate completion stats
    const completedTasks = profileTasks.filter((task) => task.completed).length;
    const completionPercentage = Math.round(
      (completedTasks / profileTasks.length) * 100
    );

    res.json({
      profileTasks,
      completedTasks,
      totalTasks: profileTasks.length,
      completionPercentage,
    });
  } catch (error) {
    console.error("Error fetching profile tasks:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
};