const Job = require("../models/Job");

const createJob = async (req, res, next) => {
  try {
    const { description, category, location, fundiId, imageUrl } = req.body;
    if (!description || !category || !location) {
      return res.status(400).json({ message: "description, category and location are required" });
    }

    const job = await Job.create({
      customerId: req.user._id,
      description,
      category,
      location,
      fundiId,
      imageUrl
    });

    return res.status(201).json(job);
  } catch (error) {
    return next(error);
  }
};

const getJobsByUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const jobs = await Job.find({
      $or: [{ customerId: userId }, { fundiId: userId }]
    })
      .populate("customerId", "name phone")
      .populate("fundiId", "name phone");
    return res.json(jobs);
  } catch (error) {
    return next(error);
  }
};

const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("customerId", "name phone location locationLabel")
      .populate("fundiId", "name phone location locationLabel");
    if (!job) return res.status(404).json({ message: "Job not found" });
    return res.json(job);
  } catch (error) {
    return next(error);
  }
};

const respondQuote = async (req, res, next) => {
  try {
    const { quoteAmount } = req.body;
    if (quoteAmount == null) return res.status(400).json({ message: "quoteAmount is required" });

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (String(job.fundiId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Only assigned fundi can quote" });
    }

    job.quoteAmount = Number(quoteAmount);
    job.status = "quoted";
    await job.save();

    return res.json(job);
  } catch (error) {
    return next(error);
  }
};

const updateJobStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["open", "quoted", "accepted", "in_progress", "completed", "cancelled"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
    }

    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    const isCustomer = String(job.customerId) === String(req.user._id);
    const isFundi = String(job.fundiId) === String(req.user._id);
    if (!isCustomer && !isFundi) {
      return res.status(403).json({ message: "Not allowed to update this job" });
    }

    job.status = status;
    await job.save();
    return res.json(job);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createJob,
  getJobsByUser,
  getJobById,
  respondQuote,
  updateJobStatus
};
