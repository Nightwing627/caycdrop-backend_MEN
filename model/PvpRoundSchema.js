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
  creator_bet: {
    type: SchemaTypes.ObjectId,
    ref: 'PvpRoundBet'
  },
  joiner_bet: {
    type: SchemaTypes.ObjectId,
    ref: 'PvpRoundBet'
  },
  started_at: { type: SchemaTypes.Date },
  finished_at: { type: SchemaTypes.Date },
}, {
  timestamps: {
  	createdAt: 'created_at',
  	updatedAt: 'updated_at'
  },
});

// PvpRoundSchema.plugin(uniqueValidator, { message: " is already exist" });
PvpRoundSchema.methods.toGameJSON = function () {
  return {
    code: this.code,
    round_number: this.round_number,
    box: this.box,
    bet: this.bet,
    currency: this.currency,
    started_at: this.started_at,
    finished_at: this.finished_at
  }
}

module.exports = mongoose.model('PvpRound', PvpRoundSchema);