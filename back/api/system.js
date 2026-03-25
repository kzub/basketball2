const status = async (req, res) => {
  try {
    // Simple query to verify DB is accessible
    await req.dal.system.status();
    res.status(200).send({ status: 'ok', db: 'connected' });
  } catch (err) {
    req.log.error(`Healthcheck failed: ${err.message}`);
    res.status(500).send({ status: 'error', reason: 'db_unreachable' });
  }
};

module.exports = { status };
