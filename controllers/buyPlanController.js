const BuyPlan = require('../models/buyPlanModels');


exports.createPlan = async (req, res) => {
  try {
    const plan = new BuyPlan(req.body);
    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


exports.getAllPlans = async (req, res) => {
  try {
    const plans = await BuyPlan.find();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Plan By ID
exports.getPlanById = async (req, res) => {
  try {
    const plan = await BuyPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Plan By ID
exports.updatePlan = async (req, res) => {
  try {
    const plan = await BuyPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Plan By ID
exports.deletePlan = async (req, res) => {
  try {
    const plan = await BuyPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};