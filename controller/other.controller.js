const BoxSchema = require('../model/BoxSchema');
const BoxOpenSchema = require('../model/BoxSchema');
const TagSchema = require('../model/TagSchema');
const CountrySchema = require('../model/CountrySchema');

const OtherController = {
  getAllCountries: async (req, res) => {
    return res.status(200).json({ data: await CountrySchema.find() })
  }
}

module.exports = OtherController;