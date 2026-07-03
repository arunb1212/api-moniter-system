const express = require('express');
const router = express.Router();
const Api = require('../models/Api');
const Ping = require('../models/Ping');
const { pingApi } = require('../services/pinger');

// Helper — find an API that belongs to the current user, or 404
const findOwned = async (id, userId) => {
  const api = await Api.findOne({ _id: id, userId });
  return api; // null if not found or wrong owner
};

// GET /api/apis — list only the current user's APIs
router.get('/', async (req, res) => {
  try {
    const apis = await Api.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(apis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/apis — create, stamped with the current user's id
router.post('/', async (req, res) => {
  try {
    const api = await Api.create({ ...req.body, userId: req.user.id });
    pingApi(api).catch(console.error);
    res.status(201).json(api);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/apis/:id — single API (must belong to user)
router.get('/:id', async (req, res) => {
  try {
    const api = await findOwned(req.params.id, req.user.id);
    if (!api) return res.status(404).json({ error: 'Not found' });
    res.json(api);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/apis/:id — update (must belong to user)
router.patch('/:id', async (req, res) => {
  try {
    const api = await Api.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!api) return res.status(404).json({ error: 'Not found' });
    res.json(api);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/apis/:id (must belong to user)
router.delete('/:id', async (req, res) => {
  try {
    const api = await Api.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!api) return res.status(404).json({ error: 'Not found' });
    await Ping.deleteMany({ apiId: req.params.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/apis/:id/pings — ping history (ownership check)
router.get('/:id/pings', async (req, res) => {
  try {
    const api = await findOwned(req.params.id, req.user.id);
    if (!api) return res.status(404).json({ error: 'Not found' });

    const limit = parseInt(req.query.limit) || 60;
    const pings = await Ping.find({ apiId: req.params.id })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    res.json(pings.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/apis/:id/stats — uptime stats (ownership check)
router.get('/:id/stats', async (req, res) => {
  try {
    const api = await findOwned(req.params.id, req.user.id);
    if (!api) return res.status(404).json({ error: 'Not found' });

    const pings = await Ping.find({ apiId: req.params.id }).lean();
    const total = pings.length;
    const upCount = pings.filter((p) => p.status === 'up').length;
    const avgResponseTime =
      total > 0
        ? Math.round(pings.filter((p) => p.responseTime).reduce((s, p) => s + p.responseTime, 0) / total)
        : 0;
    const uptime = total > 0 ? ((upCount / total) * 100).toFixed(2) : '0.00';
    res.json({ total, upCount, downCount: total - upCount, uptime, avgResponseTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/apis/:id/ping — manual ping (ownership check)
router.post('/:id/ping', async (req, res) => {
  try {
    const api = await findOwned(req.params.id, req.user.id);
    if (!api) return res.status(404).json({ error: 'Not found' });
    await pingApi(api);
    const latest = await Ping.findOne({ apiId: api._id }).sort({ timestamp: -1 });
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
