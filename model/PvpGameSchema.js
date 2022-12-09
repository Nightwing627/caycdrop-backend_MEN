const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const PvpGameSchema = new Schema({
  code: {
    type: SchemaTypes.String,
    index: true
  },
  is_private: { type: SchemaTypes.Boolean },
  bot_enable: { type: SchemaTypes.Boolean },
  strategy: {
    type: SchemaTypes.String,
    enum: ['MAX_SUM', 'MIN_SUM'],
  },
  rounds: { type: SchemaTypes.Number },
  current_round: { type: SchemaTypes.Number },
  total_bet: { type: SchemaTypes.Number },
  winner: {
    type: SchemaTypes.ObjectId,
    ref: 'User'
  },
  status: { type: SchemaTypes.String }, /* created, started, completed */
  total_payout: { type: SchemaTypes.Number },
  box_list: [{
    type: SchemaTypes.ObjectId,
    ref: 'Box'
  }],
  roll: {
    type: SchemaTypes.ObjectId,
    ref: 'RollHistory'
  },
  started_at: { type: SchemaTypes.Date },
  finished_at: { type: SchemaTypes.Date },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

PvpGameSchema.plugin(uniqueValidator, { message: " is already exist" });

PvpGameSchema.methods.toGameJSON = function() {
  return {
    code: this.code,
    isPrivate: this.is_private,
    botEnable: this.bot_enable,
    strategy: this.strategy,
    totalRounds: this.rounds,
    totalBet: this.total_bet,
    status: this.status.toUpperCase(),
    totalPayout: this.total_payout
  }
}

module.exports = mongoose.model('PvpGame', PvpGameSchema);