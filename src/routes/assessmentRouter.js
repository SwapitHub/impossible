const express = require("express");
const assentsRoute = express.Router();
const controller = require("../controllers/assessmentController");

assentsRoute.post("/assessment", controller.handlePostAssessment);
assentsRoute.get("/insights/:submission_id", controller.handleGetAssessment);

module.exports = assentsRoute;
