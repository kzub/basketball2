const book = async (req, res) => {
  req.log.info(`book: ${JSON.stringify(req.body)}`);

  res
    .status(200)
    .send({
      result: 'booked',
      gameId: 1,
      bookId: 3,
    });
};

module.exports = book;