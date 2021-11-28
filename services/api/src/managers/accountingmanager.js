const FD = require('./frontdata');
const occupantModel = require('../models/occupant');

////////////////////////////////////////////////////////////////////////////////
// Exported functions
////////////////////////////////////////////////////////////////////////////////
function all(req, res) {
  const year = req.params.year;

  occupantModel.findAll(req.realm, (errors, occupants) => {
    res.json(FD.toAccountingData(year, occupants));
  });
}

module.exports = {
  all,
};
