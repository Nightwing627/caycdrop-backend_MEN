const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const AccountSchema = new Schema({
  user_code: { type: SchemaTypes.String },
  username: { type: SchemaTypes.String },
  g_rank: { type: SchemaTypes.Number },
  avatar: { type: SchemaTypes.String },
  locked_chat: { type: SchemaTypes.Boolean },
  sticky_referee: { type: SchemaTypes.Boolean },
  total_deposit: { type: SchemaTypes.Number },
  total_rake_back: { type: SchemaTypes.Number },
  daily_withdraw_limit: { type: SchemaTypes.Number },
  team_id: { type: SchemaTypes.String },
  is_trader: { type: SchemaTypes.Boolean },
  suspected_trader: { type: SchemaTypes.Boolean },
  is_authentic: { type: SchemaTypes.Boolean },
  is_hide_stats: { type: SchemaTypes.Boolean },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

AccountSchema.plugin(uniqueValidator, { message: "is ready taken" });

module.exports = mongoose.model('Account', AccountSchema);