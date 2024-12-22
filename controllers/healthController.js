exports.healthCheck = (req, res) => {
  res.status(200).send("Server is up and running!");
};
