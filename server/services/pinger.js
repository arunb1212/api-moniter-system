const cron = require('node-cron');
const axios = require('axios');
const Api = require('../models/Api');
const Ping = require('../models/Ping');
const { sendAlert } = require('./mailer');

const pingApi = async (api) => {
  const start = Date.now();
  let status = 'down';
  let responseTime = null;
  let statusCode = null;
  let error = null;

  try {
    const response = await axios({
      method: api.method,
      url: api.url,
      headers: api.headers ? Object.fromEntries(api.headers) : {},
      timeout: 10000,
      validateStatus: () => true, // don't throw on 4xx/5xx
    });

    responseTime = Date.now() - start;
    statusCode = response.status;
    status = statusCode === api.expectedStatus ? 'up' : 'down';
  } catch (err) {
    responseTime = Date.now() - start;
    error = err.message;
    status = 'down';
  }

  // Save ping record
  await Ping.create({ apiId: api._id, responseTime, statusCode, status, error });

  // Prune old pings — keep last 1440 per API
  const count = await Ping.countDocuments({ apiId: api._id });
  if (count > 1440) {
    const oldest = await Ping.find({ apiId: api._id })
      .sort({ timestamp: 1 })
      .limit(count - 1440)
      .select('_id');
    await Ping.deleteMany({ _id: { $in: oldest.map((p) => p._id) } });
  }

  // Send alert if status changed
  const previousStatus = api.lastStatus;
  if (previousStatus !== status && api.alertEmail) {
    await sendAlert({
      to: api.alertEmail,
      apiName: api.name,
      apiUrl: api.url,
      status,
      responseTime,
      statusCode,
      error,
    });
  }

  // Update API last status
  await Api.findByIdAndUpdate(api._id, {
    lastStatus: status,
    lastChecked: new Date(),
  });

  console.log(`[${new Date().toISOString()}] Pinged ${api.name} → ${status.toUpperCase()} (${responseTime}ms)`);
};

const startPinger = () => {
  // Master cron runs every minute — individual APIs are skipped if their interval hasn't elapsed
  cron.schedule('* * * * *', async () => {
    try {
      const apis = await Api.find({ isActive: true });
      const now = Date.now();

      const due = apis.filter((api) => {
        if (!api.lastChecked) return true; // never pinged
        const elapsedMs = now - new Date(api.lastChecked).getTime();
        const intervalMs = (api.pingInterval || 1) * 60 * 1000;
        return elapsedMs >= intervalMs - 5000; // 5-second margin to prevent skipping due to execution time
      });

      if (due.length > 0) {
        console.log(`\n🔄 Pinging ${due.length}/${apis.length} API(s) (due by interval)...`);
        await Promise.allSettled(due.map(pingApi));
      }
    } catch (err) {
      console.error('Pinger error:', err.message);
    }
  });

  console.log('⏱️  Pinger started — checks every minute, respects per-API intervals');
};

module.exports = { startPinger, pingApi };
