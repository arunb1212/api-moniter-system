const mongoose = require('mongoose');

const PingSchema = new mongoose.Schema({
  apiId: { type: mongoose.Schema.Types.ObjectId, ref: 'Api', required: true, index: true },
  responseTime: { type: Number, default: null }, // ms
  statusCode: { type: Number, default: null },
  status: { type: String, enum: ['up', 'down'], required: true },
  error: { type: String, default: null },
  timestamp: { type: Date, default: Date.now, index: true },
});

// Keep only last 1440 pings per API (24h at 1/min)
PingSchema.index({ apiId: 1, timestamp: -1 });

module.exports = mongoose.model('Ping', PingSchema);
