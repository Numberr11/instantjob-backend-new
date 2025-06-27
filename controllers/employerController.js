const mongoose = require("mongoose");
const multer = require("multer");
const xlsx = require("xlsx");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Employer = require("../models/employer");
const JobApplied = require("../models/applyJobModels");
const Job = require("../models/jobModels");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_EXPIRES_IN = "7d";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files (.xlsx, .xls) are allowed"), false);
    }
  },
}).single("file");

const signupEmployer = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      companyName,
      companyLogo,
      website,
      industry,
      location,
      contactNumber,
      companySize,
      bio,
    } = req.body;

    // Validate required fields
    if (!email || !password || !companyName) {
      return res.status(400).json({
        status: "fail",
        message:
          "Please provide all required fields: email, password, companyName",
      });
    }

    // Check if employer already exists
    const existingEmployer = await Employer.findOne({ email });
    if (existingEmployer) {
      return res.status(400).json({
        status: "fail",
        message: "Email already registered",
      });
    }

    const existingEmployerByPhone = await Employer.findOne({ contactNumber });
    if (existingEmployerByPhone) {
      return res.status(400).json({
        status: "fail",
        message: "Mobile number already registered",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new employer
    const employer = await Employer.create({
      name,
      email,
      password: hashedPassword,
      companyName,
      companyLogo: companyLogo || "",
      website: website || "",
      industry,
      location: location || "",
      contactNumber: contactNumber || "",
      companySize: companySize || "1-10",
      bio: bio || "",
    });

    // Generate JWT
    const token = jwt.sign(
      { id: employer._id, role: employer.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      status: "success",
      auth: {
        id: employer._id,
        role: employer.role,
        token,
        employer: {
          name: employer.name,
          email: employer.email,
          companyName: employer.companyName,
          industry: employer.industry,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const loginEmployer = async (req, res, next) => {
  try {
    const { email, contactNumber, password } = req.body;

    // Validate input
    if ((!email && !contactNumber) || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email or contact number and password",
      });
    }

    const query = email ? { email } : { contactNumber };
    const employer = await Employer.findOne(query).select("+password");
    if (!employer) {
      return res.status(401).json({
        status: "fail",
        message: "Unable to log in. Your account is not registered",
      });
    }

    if (!employer.verified) {
      return res.status(401).json({
        status: "fail",
        message: `Your account (${
          email || contactNumber
        }) is not verified yet. Please wait for approval or contact support.`,
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, employer.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect password",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: employer._id, role: employer.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      status: "success",
      auth: {
        id: employer._id,
        role: employer.role,
        token,
        employer: {
          name: employer.name,
          email: employer.email,
          companyName: employer.companyName,
          industry: employer.industry,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getAllEmployers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const employers = await Employer.find()
      .select("-password -role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Employer.countDocuments();

    res.status(200).json({
      message: "Employers retrieved successfully",
      employers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalEmployers: total,
        employersPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching employers:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch employers", error: error.message });
  }
};

const updateEmployerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    // Validate input
    if (typeof verified !== "boolean") {
      return res.status(400).json({
        status: "fail",
        message: "Verified status must be a boolean",
      });
    }

    const employer = await Employer.findByIdAndUpdate(
      id,
      { verified },
      { new: true }
    );

    if (!employer) {
      return res.status(404).json({
        status: "fail",
        message: "Employer not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Employer status updated successfully",
    });
  } catch (error) {
    console.error("Error updating employer status:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update employer status",
      error: error.message,
    });
  }
};

const getEmployerById = async (req, res) => {
  try {
    const { id } = req.params;

    const employer = await Employer.findById(id)
      .select("-password -role")
      .lean();

    if (!employer) {
      return res.status(404).json({
        status: "fail",
        message: "Employer not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Employer retrieved successfully",
      employer,
    });
  } catch (error) {
    console.error("Error fetching employer by ID:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch employer",
      error: error.message,
    });
  }
};

const getEmployerStats = async (req, res) => {
  try {
    const employerId = req.params.id;

    // Validate employer ID
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid employer ID",
      });
    }

    // Calculate stats
    const currentDate = new Date();
    const sevenDaysAgo = new Date(
      currentDate.getTime() - 7 * 24 * 60 * 60 * 1000
    );
    const startOfToday = new Date(currentDate.setHours(0, 0, 0, 0)); // Start of today

    // 1. Total Active Jobs
    const totalActiveJobs = await Job.countDocuments({
      postedBy: employerId,
      status: "Active",
    });

    // 2. Total Applicants (all applications for employer's jobs)
    const employerJobs = await Job.find({ postedBy: employerId }).select("_id");
    const jobIds = employerJobs.map((job) => job._id);
    const totalApplicants = await JobApplied.countDocuments({
      jobId: { $in: jobIds },
    });

    // 3. New Applicants (last 7 days)
    // const newApplicants = await JobApplied.countDocuments({
    //   jobId: { $in: jobIds },
    //   createdAt: { $gte: sevenDaysAgo },
    // });

    // 4. Shortlisted Applicants
    const shortlistedApplicants = await JobApplied.countDocuments({
      jobId: { $in: jobIds },
      status: "shortlisted",
    });

    // 5. Today's Applications
    const todayApplications = await JobApplied.countDocuments({
      jobId: { $in: jobIds },
      createdAt: { $gte: startOfToday },
    });

    // 6. Interviews (assuming status: "interview")
    const interviews = await JobApplied.countDocuments({
      jobId: { $in: jobIds },
      status: "interviews",
    });

    res.status(200).json({
      status: "success",
      stats: [
        {
          title: "Active Jobs",
          value: totalActiveJobs,
          icon: { name: "WorkIcon", color: "#4F46E5", size: 24 },
          color: "#4F46E5",
          trend:
            totalActiveJobs > 0
              ? `+${totalActiveJobs} jobs active`
              : "No active jobs",
          trendColor: totalActiveJobs > 0 ? "#10B981" : "#6B7280",
        },
        {
          title: "Total Applicants",
          value: totalApplicants,
          icon: { name: "UsersIcon", color: "#10B981", size: 24 },
          color: "#10B981",
          trend:
            totalApplicants > 0
              ? `${totalApplicants} applications received`
              : "No applicants",
          trendColor: totalApplicants > 0 ? "#10B981" : "#6B7280",
        },
        // {
        //   title: "New Applicants",
        //   value: newApplicants,
        //   icon: { name: "MessageSquareIcon", color: "#F59E0B", size: 24 },
        //   color: "#F59E0B",
        //   trend: newApplicants > 0 ? `${newApplicants} in last 7 days` : "No new applicants",
        //   trendColor: newApplicants > 0 ? "#10B981" : "#6B7280",
        // },
        {
          title: "Shortlisted",
          value: shortlistedApplicants,
          icon: { name: "CheckCircleIcon", color: "#EF4444", size: 24 },
          color: "#EF4444",
          trend:
            shortlistedApplicants > 0
              ? `${shortlistedApplicants} candidates shortlisted`
              : "No shortlisted candidates",
          trendColor: shortlistedApplicants > 0 ? "#10B981" : "#6B7280",
        },
        {
          title: "Today's Applications",
          value: todayApplications,
          icon: { name: "PostAddIcon", color: "#6B7280", size: 24 },
          color: "#6B7280",
          trend:
            todayApplications > 0
              ? `${todayApplications} applied today`
              : "No applications today",
          trendColor: todayApplications > 0 ? "#10B981" : "#6B7280",
        },
        {
          title: "Interviews",
          value: interviews,
          icon: { name: "CalendarIcon", color: "#D946EF", size: 24 },
          color: "#D946EF",
          trend:
            interviews > 0
              ? `${interviews} scheduled interviews`
              : "No interviews scheduled",
          trendColor: interviews > 0 ? "#10B981" : "#6B7280",
        },
      ],
    });
  } catch (error) {
    console.error("Error fetching employer stats:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch employer stats",
      error: error.message,
    });
  }
};

const getApplicationTrends = async (req, res) => {
  try {
    const employerId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid employer ID",
      });
    }

    const employerJobs = await Job.find({ postedBy: employerId }).select("_id");
    const jobIds = employerJobs.map((job) => job._id);

    if (!jobIds.length) {
      return res.status(200).json({
        status: "success",
        message: "No jobs found for this employer",
        data: Array(12).fill(0),
      });
    }

    const currentYear = new Date().getFullYear(); 
    const applicationsByMonth = await JobApplied.aggregate([
      {
        $match: {
          jobId: { $in: jobIds },
          createdAt: {
            $gte: new Date(currentYear, 0, 1), 
            $lte: new Date(currentYear, 11, 31, 23, 59, 59, 999), 
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const monthlyData = Array(12).fill(0);
    applicationsByMonth.forEach((item) => {
      monthlyData[item._id - 1] = item.count;
    });

    res.status(200).json({
      status: "success",
      message: "Application trends retrieved successfully",
      data: monthlyData,
    });
  } catch (error) {
    console.error("Error fetching application trends:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch application trends",
      error: error.message,
    });
  }
};

const getRecentApplicants = async (req, res) => {
  try {
    const employerId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Validate employer ID
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid employer ID",
      });
    }

    // Find jobs posted by the employer
    const employerJobs = await Job.find({ postedBy: employerId }).select("_id title");
    const jobIds = employerJobs.map((job) => job._id);

    if (!jobIds.length) {
      return res.status(200).json({
        status: "success",
        message: "No jobs found for this employer",
        applicants: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalApplicants: 0,
          applicantsPerPage: limit,
        },
      });
    }

    // Aggregate applications with candidate and job details
    const applications = await JobApplied.aggregate([
      {
        $match: {
          jobId: { $in: jobIds },
        },
      },
      {
        $lookup: {
          from: "candidates",
          localField: "candidateId",
          foreignField: "_id",
          as: "candidate",
        },
      },
      {
        $unwind: "$candidate",
      },
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $unwind: "$job",
      },
      {
        $project: {
          id: "$_id",
          applicantId: "$candidateId",
          name: "$candidate.full_name",
          phone: "$candidate.phone",
          email: "$candidate.email",
          position: "$job.title",
          experience: "$candidate.totalExperience",
          skills: "$candidate.skills",
          resumeUrl: "$candidate.resumeUrl",
          applied: "$createdAt",
          status: "$status",
        },
      },
      {
        $sort: { applied: -1 }, // Sort by most recent applications
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    // Format applied date to relative time (Today, Yesterday, etc.)
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const formattedApplications = applications.map((app) => {
      const appliedDate = new Date(app.applied);
      const diffDays = Math.floor((now - appliedDate) / oneDayMs);
      let appliedText;
      if (diffDays === 0) appliedText = "Today";
      else if (diffDays === 1) appliedText = "Yesterday";
      else if (diffDays <= 7) appliedText = `${diffDays} days ago`;
      else appliedText = appliedDate.toLocaleDateString();

      return {
        ...app,
        applied: appliedText,
      };
    });

    // Get total count for pagination
    const totalApplicants = await JobApplied.countDocuments({
      jobId: { $in: jobIds },
    });

    res.status(200).json({
      status: "success",
      message: "Recent applicants retrieved successfully",
      applicants: formattedApplications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalApplicants / limit),
        totalApplicants,
        applicantsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching recent applicants:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch recent applicants",
      error: error.message,
    });
  }
};

const updateJobApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["new", "shortlisted", "interview", "hired", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid status value",
      });
    }

    // Find and update the job application
    const jobApplication = await JobApplied.findOneAndUpdate(
      { _id: id },
      { status },
      { new: true, runValidators: true }
    );

    if (!jobApplication) {
      return res.status(404).json({
        status: "fail",
        message: `No job application found with id ${id}`,
      });
    }

    res.status(200).json({
      status: "success",
      message: "Job application status updated successfully",
      jobApplication,
    });
  } catch (error) {
    console.error("Error updating job application status:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update job application status",
      error: error.message,
    });
  }
};


const bulkSignupEmployers = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        status: "fail",
        message: err.message || "Failed to upload file",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        status: "fail",
        message: "No file uploaded",
      });
    }

    try {
      // Parse Excel file
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      if (!data.length) {
        return res.status(400).json({
          status: "fail",
          message: "Excel file is empty",
        });
      }

      const results = [];
      const errors = [];

      // Validate and process each employer
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // Excel rows start at 1, header is row 1

        // Validate required fields
        if (!row.email || !row.password || !row.companyName || !row.contactNumber) {
          errors.push({
            row: rowNumber,
            message:
              "Missing required fields: email, password, companyName, contactNumber",
          });
          continue;
        }

        // Check for duplicate email or contactNumber
        const existingEmployer = await Employer.findOne({ email: row.email });
        if (existingEmployer) {
          errors.push({
            row: rowNumber,
            message: `Email ${row.email} already registered`,
          });
          continue;
        }

        const existingEmployerByPhone = await Employer.findOne({
          contactNumber: row.contactNumber,
        });
        if (existingEmployerByPhone) {
          errors.push({
            row: rowNumber,
            message: `Mobile number ${row.contactNumber} already registered`,
          });
          continue;
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(row.password.toString(), salt);

        // Prepare employer data
        const employerData = {
          name: row.name || "",
          email: row.email,
          password: hashedPassword,
          companyName: row.companyName,
          companyLogo: row.companyLogo || "",
          website: row.website || "",
          industry: row.industry || "",
          location: row.location || "",
          contactNumber: row.contactNumber,
          companySize: row.companySize || "1-10",
          bio: row.bio || "",
        };

        try {
          const employer = await Employer.create(employerData);
          results.push({
            row: rowNumber,
            email: employer.email,
            status: "success",
            message: "Employer created successfully",
          });
        } catch (error) {
          errors.push({
            row: rowNumber,
            message: error.message || "Failed to create employer",
          });
        }
      }

      res.status(200).json({
        status: "success",
        message: "Bulk employer upload processed",
        results,
        errors,
        totalProcessed: data.length,
        totalSuccess: results.length,
        totalErrors: errors.length,
      });
    } catch (error) {
      next(error);
    }
  });
};

const getJobsByEmployer = async (req, res) => {
  try {
    const { id } = req.params; // Employer ID
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || null;
    const jobType = req.query.jobType || null;
    const location = req.query.location || null;
    const skip = (page - 1) * limit;

    // Validate employer ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid employer ID",
      });
    }

    // Check if employer exists
    const employer = await Employer.findById(id).lean();
    if (!employer) {
      return res.status(404).json({
        status: "fail",
        message: "Employer not found",
      });
    }

    // Build query
    const query = { postedBy: id };
    if (status) query.status = status;
    if (jobType) query.jobType = jobType;
    if (location) query.location = location;

    // Fetch jobs
    const jobs = await Job.find(query)
      .select(
        "title companyName location salaryRange jobType minExp maxExp keySkills industryType category applyBy openings status postedAt createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalJobs = await Job.countDocuments(query);

    // Format jobs data for response
    const formattedJobs = jobs.map((job) => ({
      id: job._id,
      title: job.title,
      companyName: job.companyName,
      location: job.location,
      salaryRange: job.salaryRange,
      jobType: job.jobType,
      minExp: job.minExp,
      maxExp: job.maxExp,
      keySkills: job.keySkills,
      industryType: job.industryType,
      category: job.category,
      applyBy: job.applyBy,
      openings: job.openings,
      status: job.status,
      postedAt: job.postedAt,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }));

    res.status(200).json({
      status: "success",
      message: "Jobs retrieved successfully",
      jobs: formattedJobs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalJobs / limit),
        totalJobs,
        jobsPerPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching jobs by employer:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch jobs",
      error: error.message,
    });
  }
};

const getJobFiltersByEmployer = async (req, res) => {
  try {
    const { id } = req.params; // Employer ID (postedBy)

    // Validate employer ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid employer ID",
      });
    }

    // Aggregate to get unique values for location, status, and jobType (case-insensitive for location)
    const filters = await Job.aggregate([
      {
        $match: {
          postedBy: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $group: {
          _id: null,
          locations: {
            $addToSet: {
              $toLower: "$location",
            },
          },
          statuses: {
            $addToSet: "$status",
          },
          jobTypes: {
            $addToSet: "$jobType",
          },
        },
      },
      {
        $project: {
          _id: 0,
          locations: {
            $map: {
              input: "$locations",
              as: "loc",
              in: {
                $cond: {
                  if: { $eq: ["$$loc", ""] },
                  then: "$$loc",
                  else: {
                    $concat: [
                      { $toUpper: { $substrCP: ["$$loc", 0, 1] } },
                      { $substrCP: ["$$loc", 1, { $strLenCP: "$$loc" }] },
                    ],
                  },
                },
              },
            },
          },
          statuses: 1,
          jobTypes: 1,
        },
      },
    ]);

    // Return the first result (since group returns a single document)
    const result = filters[0] || { locations: [], statuses: [], jobTypes: [] };

    res.status(200).json({
      status: "success",
      message: "Job filters for employer retrieved successfully",
      data: {
        locations: result.locations.sort(),
        statuses: result.statuses.sort(),
        jobTypes: result.jobTypes.sort(),
      },
    });
  } catch (error) {
    console.error("Error fetching job filters by employer:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch job filters",
      error: error.message,
    });
  }
};

const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Find and update the job status
    const job = await Job.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        status: "fail",
        message: `No job found with id ${id}`,
      });
    }

    res.status(200).json({
      status: "success",
      message: "Job status updated successfully",
      job: {
        id: job._id,
        title: job.title,
        status: job.status,
      },
    });
  } catch (error) {
    console.error("Error updating job status:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update job status",
      error: error.message,
    });
  }
};

const updateEmployer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      companyName,
      companyLogo,
      website,
      industry,
      location,
      contactNumber,
      companySize,
      bio
    } = req.body;

    // Validate employer ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid employer ID",
      });
    }

    const employer = await Employer.findById(id);
    if (!employer) {
      return res.status(404).json({
        status: "fail",
        message: "Employer not found",
      });
    }

    // Check for duplicate email (if email is being updated)
    if (email && email !== employer.email) {
      const existingEmployer = await Employer.findOne({ email });
      if (existingEmployer) {
        return res.status(400).json({
          status: "fail",
          message: "Email already registered",
        });
      }
    }

    // Check for duplicate contact number (if contactNumber is being updated)
    if (contactNumber && contactNumber !== employer.contactNumber) {
      const existingEmployerByPhone = await Employer.findOne({ contactNumber });
      if (existingEmployerByPhone) {
        return res.status(400).json({
          status: "fail",
          message: "Mobile number already registered",
        });
      }
    }

    // Update only provided fields
    if (name) employer.name = name;
    if (email) employer.email = email;
    if (companyName) employer.companyName = companyName;
    if (companyLogo) employer.companyLogo = companyLogo;
    if (website) employer.website = website;
    if (industry) employer.industry = industry;
    if (location) employer.location = location;
    if (contactNumber) employer.contactNumber = contactNumber;
    if (companySize) employer.companySize = companySize;
    if (bio) employer.bio = bio;

    employer.updatedAt = new Date();
    await employer.save();

    const updatedEmployer = await Employer.findById(id)
      .select("-password -role")
      .lean();

    res.status(200).json({
      status: "success",
      message: "Employer updated successfully",
      employer: updatedEmployer,
    });
  } catch (error) {
    console.error("Error updating employer:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update employer",
      error: error.message,
    });
  }
};

const updateEmployerPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Validate employer ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid employer ID",
      });
    }

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: "fail",
        message: "Current password and new password are required",
      });
    }

    const employer = await Employer.findById(id).select("+password");
    if (!employer) {
      return res.status(404).json({
        status: "fail",
        message: "Employer not found",
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, employer.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "fail",
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    employer.password = hashedPassword;
    employer.updatedAt = new Date();
    await employer.save();

    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating employer password:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update password",
      error: error.message,
    });
  }
};



module.exports = {
  signupEmployer,
  loginEmployer,
  getAllEmployers,
  updateEmployerStatus,
  getEmployerById,
  getEmployerStats,
  getApplicationTrends,
  getRecentApplicants,
  updateJobApplicationStatus,
  bulkSignupEmployers,
  getJobsByEmployer,
  getJobFiltersByEmployer,
  updateJobStatus,
  updateEmployer,
  updateEmployerPassword
};
