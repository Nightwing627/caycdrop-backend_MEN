const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;
const uniqueValidator = require('mongoose-unique-validator');

const UserDocumentSchema = new Schema({
  user_code: {
    type: SchemaTypes.String,
    index: true
  },
  doc_type: { 
  	type: SchemaTypes.String,
  	enum: ['identity', 'residence']
  },
  files: { type: SchemaTypes.Array },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

UserDocumentSchema.methods.toGetJSON = function () {
  let filePaths = [];
  this.files.forEach(item => {
    filePaths.push(process.env.LINK + process.env.DOC_PATH + item);
  });

  return {
    userCode: this.user_code,
    files: filePaths,
    createdAt: this.created_at
  }
}

UserDocumentSchema.plugin(uniqueValidator, { message: " is already exist" });

module.exports = mongoose.model('UserDocument', UserDocumentSchema);