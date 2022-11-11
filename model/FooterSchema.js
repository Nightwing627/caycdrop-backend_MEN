const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;

const FooterSchema = new Schema({
  classes: { type: SchemaTypes.String },
  link: { type: SchemaTypes.String },
  is_new_tab: { type: SchemaTypes.Boolean },
  image: { type: SchemaTypes.ObjectId, ref: 'Asset' },
  text: { type: SchemaTypes.String },
  visibleFor: { type: SchemaTypes.String },
  has_next: { type: SchemaTypes.Boolean },
  has_prev: { type: SchemaTypes.Boolean },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

module.exports = mongoose.model('Footer', FooterSchema);