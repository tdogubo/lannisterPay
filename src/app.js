const express = require("express");
const { FeesRouter } = require("./routes/fees.routes");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use("/", FeesRouter);

module.exports = { app };
