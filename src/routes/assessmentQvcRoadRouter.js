const express = require("express");
const { runAssessment } = require("../controllers/assessmentQvcRoadController");
const QVCRouter = express.Router();


QVCRouter.post("/identity-assessment", runAssessment);

module.exports = QVCRouter;
