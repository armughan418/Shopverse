const mongoose = require("mongoose");

const orderChargeSettingSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    deliveryCost: { type: Number, default: 250, min: 0 },
    discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
    taxPercentage: { type: Number, default: 10, min: 0, max: 100 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("OrderChargeSetting", orderChargeSettingSchema);
