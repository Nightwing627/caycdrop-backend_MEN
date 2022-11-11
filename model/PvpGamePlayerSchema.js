const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const PvpGamePlayerSchema = new Schema({
  code: {
    type: SchemaTypes.String,
    index: true
  },
  pvpId: { type: SchemaTypes.ObjectId },
  payer1: { type: SchemaTypes.Mixed },
  payer2: { type: SchemaTypes.Mixed },
  // ** -- Structure of player data at the time of being pvp game
  // user_code,
	// name,
	// avatar,
	// rank,
	// xp,
	// required_xp,
	// next_required_xp,
	// level
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

PvpGamePlayerSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('PvpGamePlayer', PvpGamePlayerSchema);