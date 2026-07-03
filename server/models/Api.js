const mongoose = require("mongoose");

const ApiSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  name: { type: String, required: true, trim: true },
  url: { type: String, required: true, trim: true },
  method: {
    type: String,
    default: "GET",
    enum: ["GET", "POST", "PUT", "DELETE", "HEAD"],
  },
  headers: { type: Map, of: String, default: {} },
  expectedStatus: { type: Number, default: 200 },
  alertEmail: { type: String, default: "" },
  pingInterval: { type: Number, default: 1, enum: [1, 5, 10, 15, 30, 60] }, // minutes
  isActive: { type: Boolean, default: true },
  lastStatus: {
    type: String,
    enum: ["up", "down", "unknown"],
    default: "unknown",
  },
  lastChecked: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Api", ApiSchema);
