const mongoose = require('mongoose');

const candidateRegister = new mongoose.Schema({
  full_name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String },
  role: { type: String, enum: ['admin', 'candidate','s-admin'], default: 'candidate' },
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  about: { type: String },
  profileImage: { type: String },

  // 🎓 Education Details (Multiple degrees)
  education: [{
    degree: { type: String },
    stream: { type: String },
    institute: { type: String },
    passingYear: { type: Number },
    score: { type: String } // CGPA or percentage
  }],

  // 👨‍💼 Work Experience (Multiple jobs)
  experience: [{
    companyName: { type: String },
    jobTitle: { type: String },
    location: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    currentlyWorking: { type: Boolean, default: false },
    description: { type: String }
  }],
  totalExperience: { type: String }, // e.g., "2 years", "Fresher"

  // 🛠️ Skills
  skills: [String],

  // 📄 Resume
  resumeUrl: { type: String }, // Link to resume file

  // 🔍 Job Preferences
  preferredJobType: { type: String, enum: ['Full-time', 'Part-time', 'Internship', 'Remote'] },
  preferredLocation: { type: String },
  expectedSalary: { type: String }, // e.g., "5 LPA"
  noticePeriod: { type: String }, // e.g., "Immediate", "15 days", etc.

  projects: [{
    projectName: { type: String },
    description: { type: String },
    technologies: [String], // e.g., ["React", "Node.js", "MongoDB"]
    startDate: { type: Date },
    endDate: { type: Date },
    ongoing: { type: Boolean, default: false },
    link: { type: String } // e.g., GitHub, deployed site
  }],

  status: { type: String, enum: ['Active', 'In-Active'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Candidate', candidateRegister);
