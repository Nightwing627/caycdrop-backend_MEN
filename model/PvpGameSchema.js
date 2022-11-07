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
  total_cost: { type: SchemaTypes.Number },
  winner: {
    type: SchemaTypes.ObjectId,
    ref: 'User'
  },
  status: { type: SchemaTypes.String },
  total_payout: { type: SchemaTypes.Number },
  player1: {
    type: SchemaTypes.ObjectId,
    ref: 'User'
  },
  player2: {
    type: SchemaTypes.ObjectId,
    ref: 'User'
  },
  box_list: [{
    type: SchemaTypes.ObjectId,
    ref: 'Box'
  }],
  finished_at: { type: SchemaTypes.Date },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

PvpGameSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('PvpGame', PvpGameSchema);