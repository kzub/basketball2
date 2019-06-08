const user = (req, res) => {
  res
    .status(200)
    .send({
      auth: true,
      name: 'Зубков Константин',
      phone: '89166206605',
      userId: 323,
    });
};

module.exports = user;