const express = require("express");
const { saveFeeConfigurations, feeComputation } = require("../services/fees.service");

const FeesRouter = express.Router();

FeesRouter.post("/fees", saveFeeConfigurations);
FeesRouter.post("/compute-transaction-fee", feeComputation);

module.exports = { FeesRouter };
