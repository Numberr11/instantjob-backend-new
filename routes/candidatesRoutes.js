const express = require('express');
const Candidate = require('../models/candidate.model')
const { uploadResume, uploadProfileImage } = require('../middlewares/multerS3'); // 

const router = express.Router();


router.get('/filter-options', async (req, res) => {
  try {
    const skills = await Candidate.distinct('skills');
    const cities = (await Candidate.distinct('city')).filter(city => city);
    const states = (await Candidate.distinct('state')).filter(state => state.length);
    const jobTypes = (await Candidate.distinct('preferredJobType')).filter(type => type);
    const experienceRanges = [
      '0-2 Years',
      '2-5 Years',
      '5-10 Years',
      '10+ Years'
    ];
    const salaryRanges = [
      '0-5 LPA',
      '5-10 LPA',
      '10-20 LPA',
      '20+ LPA'
    ];

    res.status(200).json({
      message: 'Filter options retrieved successfully',
      filters: {
        skills: skills.sort(),
        cities: cities.sort(),
        states: states.sort(),
        experienceRanges,
        jobTypes: jobTypes.sort(),
        salaryRanges
      }
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ error: 'Failed to fetch filter options' });
  }
});

// Updated /all-candidate API with search and filters
router.get('/all-candidate', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Extract query parameters
    const { search, skills, city, state, experience, salary, jobType, status = 'Active' } = req.query;

    // Build query object
    const query = { role: 'candidate', status };

    // Search by name, skills, or about
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } },
        { about: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by skills (multiple skills)
    if (skills) {
      const skillArray = Array.isArray(skills) ? skills : skills.split(',');
      query.skills = { $all: skillArray };
    }

    // Filter by city
    if (city) {
      query.city = Array.isArray(city) ? { $in: city } : city;
    }

    // Filter by state
    if (state) {
      query.state = Array.isArray(state) ? { $in: state } : state;
    }

    // Filter by job type
    if (jobType) {
      query.preferredJobType = Array.isArray(jobType) ? { $in: jobType } : jobType;
    }

    // Initialize $and array to combine filters
    const andConditions = [];

    // Filter by experience
    if (experience) {
      const experienceRanges = {
        '0-2 Years': [0, 2],
        '2-5 Years': [2, 5],
        '5-10 Years': [5, 10],
        '10+ Years': [10, Infinity]
      };
      const selectedRanges = Array.isArray(experience) ? experience : [experience];
      const experienceConditions = selectedRanges.map(range => {
        const [min, max] = experienceRanges[range] || [0, Infinity];
        const condition = {
          $expr: {
            $and: [
              {
                $gte: [
                  { $toDouble: { $replaceAll: { input: "$totalExperience", find: " years", replacement: "" } } },
                  min
                ]
              }
            ]
          }
        };
        if (max !== Infinity) {
          condition.$expr.$and.push({
            $lte: [
              { $toDouble: { $replaceAll: { input: "$totalExperience", find: " years", replacement: "" } } },
              max
            ]
          });
        }
        return condition;
      });
      andConditions.push({ $or: experienceConditions });
    }

    // Filter by salary
    if (salary) {
      const salaryRanges = {
        '0-5 LPA': [0, 5],
        '5-10 LPA': [5, 10],
        '10-20 LPA': [10, 20],
        '20+ LPA': [20, Infinity]
      };
      const selectedSalaries = Array.isArray(salary) ? salary : [salary];
      const salaryConditions = selectedSalaries.map(range => {
        const [min, max] = salaryRanges[range] || [0, Infinity];
        const condition = {
          $expr: {
            $and: [
              {
                $gte: [
                  { $toDouble: { $replaceAll: { input: "$expectedSalary", find: " LPA", replacement: "" } } },
                  min
                ]
              }
            ]
          }
        };
        if (max !== Infinity) {
          condition.$expr.$and.push({
            $lte: [
              { $toDouble: { $replaceAll: { input: "$expectedSalary", find: " LPA", replacement: "" } } },
              max
            ]
          });
        }
        return condition;
      });
      andConditions.push({ $or: salaryConditions });
    }

    // Combine all conditions
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    const candidates = await Candidate.find(query)
      .select('-role -password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Candidate.countDocuments(query);

    res.status(200).json({
      message: 'Candidates retrieved successfully',
      candidates,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCandidates: total,
        candidatesPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

router.get('/in-active/all-candidate', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const candidates = await Candidate.find({ role: 'candidate', status: 'In-Active' })
    .select('-role -password')
    .sort({updatedAt: -1})
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Candidate.countDocuments({ role: 'candidate', status: 'In-Active' });

    res.status(200).json({
      message: 'Candidates retrieved successfully',
      candidates,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCandidates: total,
        candidatesPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

router.get('/get/:id', async (req, res) => {
    try {
      const candidate = await Candidate.findById(req.params.id)
      .select('-role -password')
      if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }
      res.json(candidate);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

  router.patch('/update/status/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // Expect status: "Active" or "In-Active"
      if (!['Active', 'In-Active'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
  
      const updatedCandidate = await Candidate.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).select('-role -password');
  
      if (!updatedCandidate) {
        return res.status(404).json({ message: 'Candidate not found' });
      }
  
      res.status(200).json({
        message: `Candidate ${status === 'Active' ? 'activated' : 'deactivated'} successfully`,
        candidate: updatedCandidate,
      });
    } catch (error) {
      console.error('Error updating candidate status:', error);
      res.status(500).json({ error: 'Failed to update candidate status' });
    }
  });

// Resume upload route
router.put('/resume/:id/upload', uploadResume.single('resume'), async (req, res) => {
    try {
      const candidateId = req.params.id;
  
      const updatedCandidate = await Candidate.findByIdAndUpdate(
        candidateId,
        { resumeUrl: req.file.location }, // save S3 file URL
        { new: true }
      );
  
      res.status(200).json({ message: 'Resume uploaded successfully', candidate: updatedCandidate });
    } catch (error) {
      console.error('Resume upload failed:', error);
      res.status(500).json({ error: 'Resume upload failed' });
    }
  });

  router.put('/update/:id', uploadProfileImage.single('profileImage'), async (req, res) => {
    try {
      const candidateId = req.params.id;
      const updates = req.body;
  
      // Handle profile image upload
      if (req.file) {
        updates.profileImage = req.file.location; // Store the S3 URL
      }
  
      // Update candidate document
      const updatedCandidate = await Candidate.findByIdAndUpdate(
        candidateId,
        { $set: updates },
        { new: true, runValidators: true }
      );
  
      if (!updatedCandidate) {
        return res.status(404).json({ error: 'Candidate not found' });
      }
  
      res.status(200).json({ message: 'Profile updated successfully', candidate: updatedCandidate });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile', details: error.message });
    }
  });
  

module.exports = router;
