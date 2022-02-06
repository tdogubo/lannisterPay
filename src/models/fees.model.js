const mongoose = require("mongoose");

const feeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  currency: String,
  locale: String,
  entity: String,
  entityProperty: String,
  type: String,
  value: String,
});

feeSchema.index({ locale: 1, entity: 1, entityProperty: 1 });

module.exports = mongoose.model("Fee", feeSchema);
