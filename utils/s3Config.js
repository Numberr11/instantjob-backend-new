// utils/s3Config.js
const AWS = require("aws-sdk");
require("dotenv").config(); // Load environment variables

// Set AWS credentials from environment variables
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
module.exports = s3;
