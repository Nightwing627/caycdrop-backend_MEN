const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
// const uniqueValidator = require('mongoose-unique-validator');

// ** -- The data structure of player in the battle at the time.
// code, name, avatar, rank, xp, required_xp, next_required_xp, level

const PvpGamePlayerSchema = new Schema({
  pvpId: { type: SchemaTypes.ObjectId },
  creator: { type: Map },
  joiner: { type: Map },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

// PvpGamePlayerSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('PvpGamePlayer', PvpGamePlayerSchema);