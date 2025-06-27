const EmployerPlan = require("../models/employerPlanModels");
const BuyPlan = require("../models/buyPlanModels");

exports.purchasePlan = async (req, res) => {
  try {
    const { employerId, planId } = req.body;
    const plan = await BuyPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const now = new Date();
    const alreadyBuyPlanByEmployer = await EmployerPlan.findOne({
      employerId,
      planId,
      startDate: { $lte: now },
      endDate: { $gte: now },
    });

    if (alreadyBuyPlanByEmployer) {
      return res
        .status(400)
        .json({
          message:
            "You have already purchased this plan and it is still active.",
        });
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + plan.validityInDays);

    const employerPlan = new EmployerPlan({
      employerId,
      planId,
      startDate,
      endDate,
      remainingJobPosts: plan.jobPostLimit,
      remainingResumeViews: plan.resumeViewLimit,
    });

    await employerPlan.save();

    res.status(201).json({
      message: "Plan purchased successfully",
      employerPlan,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEmployerPlan = async (req, res) => {
  try {
    const { employerId } = req.params;

    const plan = await EmployerPlan.findOne({ employerId })
      .sort({ createdAt: -1 })
      .populate("planId");

    if (!plan) {
      return res
        .status(404)
        .json({ message: "No plan found for this employer" });
    }

    res.status(200).json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
