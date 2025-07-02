// controllers/candidateController.js
const Candidate = require("../models/recruiterCRM");
const { getDateRange } = require("../utils/dateUtils");

// Add Candidate
exports.addCandidate = async (req, res) => {
  try {
    const candidate = new Candidate({
      ...req.body,
      createdBy: req.user.id,
      sourcingDate: req.body.sourcingDate || Date.now(),
    });
    await candidate.save();
    res.status(201).json(candidate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update Candidate
exports.updateCandidate = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    // const allowedUpdates = [
    //   "position",
    //   "candidate",
    //   "professionalInfo",
    //   "compensation",
    //   "noticePeriod",
    //   "reasonForChange",
    //   "interviewRounds",
    //   "status",
    //   "offerDetails",
    //   "joiningDate",
    //   "finalStatus",
    // ];

    // const isValidUpdate = updates.every((update) =>
    //   allowedUpdates.includes(update)
    // );

    // if (!isValidUpdate) {
    //   return res.status(400).json({ message: "Invalid updates!" });
    // }

    const candidate = await Candidate.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!candidate) {
      return res
        .status(404)
        .json({ message: "Candidate not found or unauthorized" });
    }

    res.json(candidate);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Candidate
exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!candidate) {
      return res
        .status(404)
        .json({ message: "Candidate not found or unauthorized" });
    }

    res.json({ message: "Candidate deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// View Candidates with Advanced Filtering
exports.viewCandidates = async (req, res) => {
  try {
    const { period, date, month, status, position, search } = req.query;
    const filter = { createdBy: req.user.id };
  
    // Position filter
    if (position) {
      filter.position = new RegExp(position, "i"); // Case-insensitive search
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // General search filter (name, email, location, position)
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { "candidate.name": searchRegex },
        { "candidate.email": searchRegex },
        { "candidate.currentLocation": searchRegex },
        { "candidate.preferredLocation": searchRegex },
        { position: searchRegex },
        { "professionalInfo.skills": searchRegex },
        { "professionalInfo.previousCompany": searchRegex },
      ];
    }

    // Specific date filter (YYYY-MM-DD)
    else if (date) {
      const [year, month, day] = date.split("-").map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return res
          .status(400)
          .json({ message: "Invalid date format. Use YYYY-MM-DD" });
      }

      // Create start/end in UTC
      const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      const end = new Date(Date.UTC(year, month - 1, day+1 , 0, 0, 0));

      filter.sourcingDate = {
        $gte: start,
        $lt: end,
      };
    }
    // Month filter (YYYY-MM)
    else if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      if (isNaN(year) || isNaN(monthNum)) {
        return res
          .status(400)
          .json({ message: "Invalid month format. Use YYYY-MM" });
      }

      filter.sourcingDate = {
        $gte: new Date(year, monthNum - 1, 1),
        $lt: new Date(year, monthNum, 1),
      };
    }

    // Relative period filter
    else if (period) {
      try {
        const dateRange = getDateRange(period, date);
        filter.sourcingDate = {
          $gte: dateRange.start,
          $lte: dateRange.end,
        };
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }
    // Default: today's candidates
    else {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();
      const day = now.getUTCDate();

      const todayStart = new Date(Date.UTC(year, month, day , 0, 0, 0));
      const todayEnd = new Date(Date.UTC(year, month, day +1, 0, 0, 0));

      filter.sourcingDate = {
        $gte: todayStart,
        $lt: todayEnd,
      };
    }

    const candidates = await Candidate.find(filter)
      .sort("-sourcingDate")
      .populate("createdBy", "full_name email");

    res.json({
      filter: {
        period: period || "today",
        date: date || null,
        month: month || null,
        status: status || null,
        position: position || null,
      },
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin View All Candidates
exports.viewAllCandidates = async (req, res) => {
  try {
    const { period, date, month, recruiter } = req.query;
    const filter = {};

    // Recruiter filter
    if (recruiter) {
      filter.createdBy = mongoose.Types.ObjectId(recruiter);
    }

    // Month filter
    if (month) {
      const [year, monthNum] = month.split("-").map(Number);
      if (isNaN(year) || isNaN(monthNum)) {
        return res
          .status(400)
          .json({ message: "Invalid month format. Use YYYY-MM" });
      }

      filter.sourcingDate = {
        $gte: new Date(year, monthNum - 1, 1),
        $lt: new Date(year, monthNum, 1),
      };
    }
    // Date filter
    else if (date) {
      const dateObj = new Date(date);
      if (isNaN(dateObj)) {
        return res
          .status(400)
          .json({ message: "Invalid date format. Use YYYY-MM-DD" });
      }

      const start = new Date(dateObj);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);

      filter.sourcingDate = {
        $gte: start,
        $lt: end,
      };
    }
    // Period filter
    else if (period) {
      try {
        const dateRange = getDateRange(period, date);
        filter.sourcingDate = {
          $gte: dateRange.start,
          $lte: dateRange.end,
        };
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    const aggregation = [
      { $match: filter },
      {
        $lookup: {
          from: "recruiters",
          localField: "createdBy",
          foreignField: "_id",
          as: "recruiter",
        },
      },
      { $unwind: "$recruiter" },
      {
        $sort: {
          "recruiter.name": 1,
          "candidate.name": 1,
        },
      },
      {
        $group: {
          _id: "$createdBy",
          recruiter: { $first: "$recruiter" },
          candidates: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          recruiterId: "$_id",
          "recruiter.name": 1,
          "recruiter.email": 1,
          candidates: 1,
        },
      },
    ];

    const results = await Candidate.aggregate(aggregation);

    res.json({
      filter: {
        period: period || "all-time",
        date: date || null,
        month: month || null,
        recruiter: recruiter || null,
      },
      count: results.reduce((sum, group) => sum + group.candidates.length, 0),
      recruiters: results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
