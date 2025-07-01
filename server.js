const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const passport = require("passport");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const jobsRoutes  = require("./routes/job.routes");
const saveJobs = require('./routes/saveJobRoutes');
const applyJob = require('./routes/jobApplyRoutes');
const candidates = require('./routes/candidatesRoutes')
const candidatesDashboard = require('./routes/candidateDashboardRoutes')
const jobApplications = require('./routes/jobApplicationRoutes')
const employeeRoutes = require('./routes/employerRoutes')
const buyPlanRoutes = require('./routes/buyPlanRoutes')
const employerPlanRoutes = require('./routes/employerPlanRoutes')

const recruiterAuth = require("./routes/recruiterAuth");
const recruiterCandidate = require("./routes/recruiterCandidate");
// const pageRoutes = require('./routes/PageRoutes');
const uploadBulkCanidate = require('./routes/bulkCandidateRoutes')

const contactRoutes = require('./routes/contactRoutes')
const applyJobByCareers = require('./routes/applyJobByCareersRoutes')
const resumeDownloads = require('./routes/downloadRoutes')

// blogs
const blogRoutes = require("./routes/blogRoutes")



dotenv.config();

require("./utils/passport")

connectDB();

const app = express();

app.use(
  session({
    secret: "instantjob-secret", // Replace with secure secret
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());


// Allow only specific origin (your Vercel frontend)
const corsOptions = {
  origin: ['https://instantjob-frontend-nuiz.vercel.app', 'https://www.instantjob.in','https://instantjob-frontend-kappa.vercel.app', 'http://localhost:3000'],
  methods: 'GET, POST, PUT, DELETE , PATCH',
  allowedHeaders: 'Content-Type, Authorization',
};

// Use CORS middleware with the above configuration
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/save-jobs', saveJobs);
app.use('/api/apply-job', applyJob);
app.use('/api/candidates',candidates)
app.use('/api/job-applications', jobApplications)
app.use('/api/candidate-dashboard', candidatesDashboard)
app.use('/api/employers', employeeRoutes)
app.use('/api/buy-plan', buyPlanRoutes)
app.use('/api/employer-purchase',employerPlanRoutes)

app.use("/api/recruiter", recruiterAuth);
app.use("/api/recruiter/candidates", recruiterCandidate);
app.use("/api",uploadBulkCanidate)

app.use('/api',contactRoutes)
app.use('/api',applyJobByCareers)
app.use('/api', resumeDownloads)
app.use('/api/blog',blogRoutes)

// app.use('/api', pageRoutes);


app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
