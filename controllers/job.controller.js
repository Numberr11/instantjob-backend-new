const multer = require("multer");

const Job = require("../models/jobModels");
const Candidate = require("../models/candidate.model");
const dayjs = require("dayjs");
const relativeTime = require("dayjs/plugin/relativeTime");
const s3 = require("../utils/s3Config");
const {
  capitalizeTitle,
  capitalizeSentenceCase,
} = require("../utils/wordFormat");

dayjs.extend(relativeTime);

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// AWS S3 upload function
const uploadToS3 = (file) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `job-logos/${Date.now()}-${file.originalname}`, // Unique file name
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  return new Promise((resolve, reject) => {
    s3.upload(params, (err, data) => {
      if (err) reject(err);

      if (data && data.Location) {
        resolve(data.Location); // Return the file URL from S3
      } else {
        reject(new Error("S3 upload response doesn't contain Location"));
      }
    });
  });
};

// Job creation function
exports.createJob = [
  upload.single("companyLogo"), // Handle single image upload with field name 'companyLogo'
  async (req, res) => {
    try {
      const { id, role } = req.user;
      let jobData = req.body;

      jobData.title = capitalizeTitle(jobData.title);
      jobData.companyName = capitalizeTitle(jobData.companyName);
      jobData.location = capitalizeTitle(jobData.location);
      jobData.jobType = capitalizeTitle(jobData.jobType); // Optional
      jobData.industryType = capitalizeTitle(jobData.industryType); // Optional
      jobData.description = capitalizeSentenceCase(jobData.description); // Apply sentence case
      jobData.companyDescription = capitalizeSentenceCase(
        jobData.companyDescription
      );

      // If an image file is provided, upload it to S3 and get the URL
      if (req.file) {
        const companyLogoUrl = await uploadToS3(req.file);
        jobData.companyLogo = companyLogoUrl;
      }

       jobData.postedBy = id;
      jobData.postedByModel = role;


      const job = new Job(jobData); // Create instance
      await job.save(); // Save to DB

      res.status(201).json({
        success: true,
        message: "Job created successfully",
        data: job,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error creating job",
        error: error.message,
      });
    }
  },
];

exports.getJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: "Active" }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching jobs",
      error: err.message,
    });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });

    // Helper function to parse fields that may have extra brackets and quotes
    const parseField = (field) => {
      if (Array.isArray(field)) {
        return field.map((item) => item.replace(/[\[\]"]+/g, "").trim());
      }
      return [];
    };

    // Parse keySkills, qualifications, responsibilities, and benefits
    const parsedKeySkills = parseField(job.keySkills);
    const parsedResponsibilities = parseField(job.responsibilities);
    const parsedQualifications = parseField(job.qualifications);
    const parsedBenefits = parseField(job.benefits);

    // Return the job with parsed data
    res.status(200).json({
      success: true,
      job: {
        ...job._doc, // Spread the job object to maintain other properties
        keySkills: parsedKeySkills,
        responsibilities: parsedResponsibilities,
        qualifications: parsedQualifications,
        benefits: parsedBenefits,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching job",
      error: err.message,
    });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const updates = req.body;
    if (req.file) updates.companyLogo = req.file.location; // Assuming S3 upload
    const job = await Job.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!job)
      return res.status(404).json({ success: false, message: "Job not found" });
    res.json({ success: true, message: "Job updated successfully", job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: "In-Active" },
      { new: true } // Return the updated document
    );
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    res.status(200).json({
      success: true,
      message: "Job marked as In-Active",
      data: job, // Return the updated job
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating job status",
      error: err.message,
    });
  }
};

exports.getIndustryStats = async (req, res) => {
  try {
    const stats = await Job.aggregate([
      {
        $group: {
          _id: "$industryType",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          industryType: "$_id",
          count: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch industry stats",
      error: err.message,
    });
  }
};

exports.getAllJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    const {
      title,
      companyName,
      location,
      industryType,
      category,
      jobType,
      minMaxExp,
      keySkills,
    } = req.query;

    // Build dynamic filter
    const filter = { status: "Active" };

if (title && location) {
      filter.$and = [
        {
          $or: [
            { title: { $regex: title, $options: "i" } },
            // { keySkills: { $regex: title, $options: "i" } },
            // { companyName: { $regex: title, $options: "i" } },
            // { jobType: { $regex: title, $options: "i" } },
            // { location: { $regex: title, $options: "i" } },
            // { industryType: { $regex: title, $options: "i" } },
            // { category: { $regex: title, $options: "i" } },
          ],
        },
        { location: { $regex: location, $options: "i" } },
      ];
    } else if (title) {
      // Apply only title-related filters if no location is provided
      filter.$or = [
        { title: { $regex: title, $options: "i" } },
        // { keySkills: { $regex: title, $options: "i" } },
        // { companyName: { $regex: title, $options: "i" } },
        // { jobType: { $regex: title, $options: "i" } },
        // { location: { $regex: title, $options: "i" } },
        // { industryType: { $regex: title, $options: "i" } },
        // { category: { $regex: title, $options: "i" } },
      ];
    } else if (location) {
      // Apply only location filter if no title is provided
      filter.location = { $regex: location, $options: "i" };
    }

    // Specific filters (unchanged for other fields)
    if (companyName && !title)
      filter.companyName = { $regex: companyName, $options: "i" };
    if (industryType)
      filter.industryType = { $regex: industryType, $options: "i" };
    if (category) filter.category = { $regex: category, $options: "i" };
    if (jobType) filter.jobType = { $regex: jobType, $options: "i" };
    if (minMaxExp) {
      const maxExp = parseInt(minMaxExp);
      filter.$and = filter.$and
        ? [
            ...filter.$and,
            { minExp: { $lte: maxExp } },
            { maxExp: { $lte: maxExp } },
          ]
        : [
            { minExp: { $lte: maxExp } },
            { maxExp: { $lte: maxExp } },
          ];
    }

    // KeySkills
    if (keySkills) {
      const skillsArray = keySkills.split(",").map((skill) => skill.trim());
      filter.keySkills = { $in: skillsArray };
    }

    const totalJobs = await Job.countDocuments(filter);

    const jobs = await Job.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedJobs = jobs.map((job) => {
      // Function to clean up the data
      const cleanArrayField = (field) => {
        if (Array.isArray(job[field])) {
          // Convert stringified arrays to actual arrays
          return job[field]
            .map((item) => {
              try {
                return JSON.parse(item); // Try to parse the string into an array
              } catch (error) {
                return item; // Return item as is if it can't be parsed
              }
            })
            .flat(); // Flatten the array if there are nested arrays
        }
        return [];
      };

      return {
        ...job,
        postedAt: dayjs(job.createdAt).fromNow(),
        keySkills: cleanArrayField("keySkills"),
        qualifications: cleanArrayField("qualifications"),
        responsibilities: cleanArrayField("responsibilities"),
        benefits: cleanArrayField("benefits"),
      };
    });

    res.status(200).json({
      success: true,
      message: "Jobs fetched successfully",
      currentPage: page,
      totalPages: Math.ceil(totalJobs / limit),
      totalJobs,
      data: formattedJobs,
    });
  } catch (error) {
    console.error("Error in getAllJobs:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getFilterOptions = async (req, res) => {
  try {
    // Fetch distinct values and count jobs for each filter
    const locations = await Job.aggregate([
      { $match: { status: "Active" } },
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const jobTypes = await Job.aggregate([
      { $match: { status: "Active" } },
      { $group: { _id: "$jobType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const industryTypes = await Job.aggregate([
      { $match: { status: "Active" } },
      { $group: { _id: "$industryType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Send response with all the filter data including counts
    res.status(200).json({
      success: true,
      data: {
        locations,
        workModes: jobTypes,
        // jobTypes,
        departments: industryTypes,
        industryTypes,
      },
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching filter options",
      error: error.message,
    });
  }
};

exports.getJobsForAdminPannel = async (req, res) => {
  try {
    const offset = parseInt(req.query.offset) || 0; // Starting index
    const limit = parseInt(req.query.limit) || 10; // Number of jobs per chunk

    // Get total job count for the filter
    const totalJobs = await Job.countDocuments({ status: "Active" });

    // Fetch jobs
    const jobs = await Job.find({ status: "Active" })
      .sort({ createdAt: -1 }) // Newest first
      .skip(offset)
      .limit(limit)
      .lean();

    // Helper function to parse fields with array data
    const parseArray = (field) => {
      if (Array.isArray(field)) {
        return field.map((item) => item.replace(/[\[\]"]+/g, "").trim()); // Clean up any unwanted characters
      } else if (typeof field === "string") {
        return field
          .split(",")
          .map((item) => item.replace(/[\[\]"]+/g, "").trim()); // Split by comma and clean up
      }
      return [];
    };

    // Format jobs with relative time and clean up array fields
    const formattedJobs = jobs.map((job) => ({
      ...job,
      id: job._id, // Use _id as id for DataGrid
      posted: dayjs(job.createdAt).fromNow(), // Relative time (e.g., "2 days ago")
      keySkills: parseArray(job.keySkills), // Clean and parse keySkills
      responsibilities: parseArray(job.responsibilities), // Clean and parse responsibilities
      qualifications: parseArray(job.qualifications), // Clean and parse qualifications
      benefits: parseArray(job.benefits), // Clean and parse benefits
    }));

    res.status(200).json({
      success: true,
      message: "Jobs fetched successfully",
      data: formattedJobs,
      totalJobs,
    });
  } catch (error) {
    console.error("Error in getJobsForInfiniteScroll:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching jobs",
      error: error.message,
    });
  }
};

exports.getInActiveJobsForAdminPannel = async (req, res) => {
  try {
    const offset = parseInt(req.query.offset) || 0; // Starting index
    const limit = parseInt(req.query.limit) || 10; // Number of jobs per chunk

    // Get total job count for the filter
    const totalJobs = await Job.countDocuments({ status: "In-Active" });

    // Fetch jobs
    const jobs = await Job.find({ status: "In-Active" })
      .sort({ updatedAt: -1 }) // Newest first
      .skip(offset)
      .limit(limit)
      .lean();

    // Helper function to parse fields with array data
    const parseArray = (field) => {
      if (Array.isArray(field)) {
        return field.map((item) => item.replace(/[\[\]"]+/g, "").trim()); // Clean up any unwanted characters
      } else if (typeof field === "string") {
        return field
          .split(",")
          .map((item) => item.replace(/[\[\]"]+/g, "").trim()); // Split by comma and clean up
      }
      return [];
    };

    // Format jobs with relative time and clean up array fields
    const formattedJobs = jobs.map((job) => ({
      ...job,
      id: job._id, // Use _id as id for DataGrid
      posted: dayjs(job.createdAt).fromNow(), // Relative time (e.g., "2 days ago")
      keySkills: parseArray(job.keySkills), // Clean and parse keySkills
      responsibilities: parseArray(job.responsibilities), // Clean and parse responsibilities
      qualifications: parseArray(job.qualifications), // Clean and parse qualifications
      benefits: parseArray(job.benefits), // Clean and parse benefits
    }));

    res.status(200).json({
      success: true,
      message: "Jobs fetched successfully",
      data: formattedJobs,
      totalJobs,
    });
  } catch (error) {
    console.error("Error in getJobsForInfiniteScroll:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching jobs",
      error: error.message,
    });
  }
};

exports.getAdminDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 1)
    );
    const endOfCurrentMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() + 1, 1)
    );
    const startOfPreviousMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth() - 1, 1)
    );
    const endOfPreviousMonth = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), 1)
    );

    const totalJobsCurrent = await Job.countDocuments({
      status: "Active",
    });
    const totalJobsPrevious = await Job.countDocuments({
      status: "Active",
      applyBy: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth },
    });
    const totalJobsChange = totalJobsPrevious
      ? ((totalJobsCurrent - totalJobsPrevious) / totalJobsPrevious) * 100
      : totalJobsCurrent > 0
      ? 100
      : 0;
    const totalJobsChangeFormatted =
      totalJobsChange >= 0
        ? `+${totalJobsChange.toFixed(1)}%`
        : `${totalJobsChange.toFixed(1)}%`;

    const activeJobsCurrent = await Job.countDocuments({
      status: "Active",
      applyBy: { $gte: startOfCurrentMonth, $lt: endOfCurrentMonth },
    });
    const activeJobsPrevious = await Job.countDocuments({
      status: "Active",
      applyBy: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth },
    });
    const activeJobsChange = activeJobsPrevious
      ? ((activeJobsCurrent - activeJobsPrevious) / activeJobsPrevious) * 100
      : activeJobsCurrent > 0
      ? 100
      : 0;
    const activeJobsChangeFormatted =
      activeJobsChange >= 0
        ? `+${activeJobsChange.toFixed(1)}%`
        : `${activeJobsChange.toFixed(1)}%`;

    const candidatesCurrent = await Candidate.countDocuments({
      createdAt: { $gte: startOfCurrentMonth, $lt: endOfCurrentMonth },
    });
    const candidatesPrevious = await Candidate.countDocuments({
      createdAt: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth },
    });
    const candidatesChange = candidatesPrevious
      ? ((candidatesCurrent - candidatesPrevious) / candidatesPrevious) * 100
      : candidatesCurrent > 0
      ? 100
      : 0;
    const candidatesChangeFormatted =
      candidatesChange >= 0
        ? `+${candidatesChange.toFixed(1)}%`
        : `${candidatesChange.toFixed(1)}%`;

    const activeJobs = await Job.find(
      {
        status: "Active",
        applyBy: { $gte: startOfCurrentMonth, $lt: endOfCurrentMonth },
      },
      { _id: 1, status: 1, createdAt: 1, applyBy: 1 }
    );
    const previousJobs = await Job.find(
      {
        status: "Active",
        applyBy: { $gte: startOfPreviousMonth, $lt: endOfCurrentMonth },
      },
      { _id: 1, status: 1, createdAt: 1, applyBy: 1 }
    );

    const stats = [
      {
        title: "Total Jobs",
        value: totalJobsCurrent.toString(),
        change: totalJobsChangeFormatted,
        changeType: totalJobsChange >= 0 ? "positive" : "negative",
        icon: totalJobsChange >= 0 ? "ArrowUpwardIcon" : "ArrowDownwardIcon",
        color: "#5E35B1",
      },
      {
        title: "Active Jobs",
        value: activeJobsCurrent.toString(),
        change: activeJobsChangeFormatted,
        changeType: activeJobsChange >= 0 ? "positive" : "negative",
        icon: activeJobsChange >= 0 ? "ArrowUpwardIcon" : "ArrowDownwardIcon",
        color: "#66BB6A",
      },
      {
        title: "Registered Employees",
        value: candidatesCurrent.toString(),
        change: candidatesChangeFormatted,
        changeType: candidatesChange >= 0 ? "positive" : "negative",
        icon: candidatesChange >= 0 ? "ArrowUpwardIcon" : "ArrowDownwardIcon",
        color: "#29B6F6",
      },
    ];

    res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error in getAdminDashboardStats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
};

exports.jobStatusUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Expect status: "Active" or "In-Active"
    if (!["Active", "In-Active"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedJobStatus = await Job.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedJobStatus) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json({
      message: `Job ${
        status === "Active" ? "activated" : "deactivated"
      } successfully`,
      job: updatedJobStatus,
    });
  } catch (error) {
    console.error("Error updating job status:", error);
    res.status(500).json({ error: "Failed to update job status" });
  }
};
