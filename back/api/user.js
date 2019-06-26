const user = async (req, res) => {
  res
    .status(200)
    .send({
      auth: true,
      name: 'Зубков Константин',
      phone: '89166206605',
      userId: 1,
    });
};

module.exports = user;