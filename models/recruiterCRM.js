const mongoose = require("mongoose");

const recruiterCRMSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },
    sourcingDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    position: {
      type: String,
      required: true
    },
    candidate: {
      name: {
        type: String,
        required: true
      },
      contactNumber: String,
      email: {
        type: String,
        validate: {
          validator: v => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
          message: props => `${props.value} is not a valid email!`
        }
      },
      currentLocation: String,
      preferredLocation: String
    },
    professionalInfo: {
      skills: [String],
      previousCompany: String,
      currentDesignation: String,
      totalExperience: Number,
      relevantExperience: Number,
      education: String
    },
    compensation: {
      currentCTC: Number,  // In LPA
      expectedCTC: Number, // In LPA
      offeredCTC: Number,  // In LPA
      fixedCTC: Number     // In LPA
    },
    noticePeriod: {
      value: Number,
      unit: {
        type: String,
        enum: ["days", "weeks", "months"]
      }
    },
    reasonForChange: String,
    interviewRounds: [
      {
        roundNumber: {
          type: Number,
          required: true
        },
        scheduledDate: Date,
        interviewer: String,
        feedback: String,
        status: {
          type: String,
          enum: ["Scheduled", "Completed", "Cancelled", "Passed", "Failed","On Hold"],
          default: "Scheduled"
        }
      }
    ],
    status: {
      type: String,
      enum: ["Sourced", "Screening", "Interview", "Offered", "Rejected", "On Hold", "Hired"],
      default: "Sourced"
    },
    offerDetails: {
      date: Date,
      accepted: Boolean
    },
    joiningDate: Date,
    finalStatus: {
      type: String,
      enum: ["Selected", "Joined", "Offer Declined", "Withdrawn", "Did Not Join"]
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for notice period display
recruiterCRMSchema.virtual("noticePeriod.display").get(function() {
  return this.noticePeriod.value 
    ? `${this.noticePeriod.value} ${this.noticePeriod.unit}` 
    : "Immediate";
});

// Virtual for compensation difference
recruiterCRMSchema.virtual("compensation.difference").get(function() {
  return this.compensation.expectedCTC 
    ? (this.compensation.expectedCTC - this.compensation.currentCTC).toFixed(2)
    : null;
});

module.exports = mongoose.model("RecruiterCRM", recruiterCRMSchema);