const book = (req, res) => {
  res
    .status(200)
    .send({
      result: 'booked',
      rsvId: 12318,
    });
};

module.exports = book;