const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const PvpRoundBetSchema = new Schema({
  player: { type: SchemaTypes.String },
  bet: { type: SchemaTypes.Number },
  item: { type: SchemaTypes.ObjectId },
  currency: { type: SchemaTypes.String },
  payout: { type: SchemaTypes.Number },
  rewarded_xp: { type: SchemaTypes.Number },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

// PvpRoundBetSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('PvpRoundBet', PvpRoundBetSchema);