const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware"); // JWT auth
const { getDashboard } = require("../controllers/userController");

const dashboardRouter = express.Router();

dashboardRouter.get("/", authMiddleware, getDashboard);

module.exports = dashboardRouter;
