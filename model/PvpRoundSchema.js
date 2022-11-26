const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const PvpRoundSchema = new Schema({
  code: {
    type: SchemaTypes.String,
    index: true
  },
  pvpId: { 
    type: SchemaTypes.ObjectId,
    ref: 'PvpGame'
  },
  round_number: { type: SchemaTypes.Number },
  box: {
    type: SchemaTypes.ObjectId,
    ref: 'Box'
  },
  bet: { type: SchemaTypes.Number },
  currency: { type: SchemaTypes.String },
  player1_bet: {
    type: SchemaTypes.ObjectId,
    ref: 'PvpRoundBet'
  },
  player2_bet: {
    type: SchemaTypes.ObjectId,
    ref: 'PvpRoundBet'
  },
  roll_code: {
  	type: SchemaTypes.ObjectId,
    ref: 'RollHistory'
  },
  startd_at: { type: SchemaTypes.Date },
  finished_at: { type: SchemaTypes.Date },
}, {
  timestamps: {
  	createdAt: 'created_at',
  	updatedAt: 'updated_at'
  },
});

// PvpRoundSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('PvpRound', PvpRoundSchema);