const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;

const BoxStatisticsSchema = new Schema({
  box_code: { type: SchemaTypes.String },
  opened: { type: SchemaTypes.Number },
  popular: { type: SchemaTypes.Number },
}, {
  timestamps: false
});

module.exports = mongoose.model('BoxStatistics', BoxStatisticsSchema);