const mongoose = require('mongoose');
const { Schema, SchemaTypes } = mongoose;

const UserSeedSchema = new Schema({
  userId: { type: SchemaTypes.ObjectId },
  code: { type: SchemaTypes.String },
  client_seed: {
    type: SchemaTypes.ObjectId,
    ref: 'Seed'
  },
  old_client_seed: {
    type: SchemaTypes.ObjectId,
    ref: 'Seed'
  },
  server_seed: {  // current
    type: SchemaTypes.ObjectId,
    ref: 'Seed'
  },
  next_server_seed: { // future
    type: SchemaTypes.ObjectId,
    ref: 'Seed'
  },
  old_server_seed: { // old
    type: SchemaTypes.ObjectId,
    ref: 'Seed'
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});

UserSeedSchema.methods.toGetJSON = function() {
	let clientSeed = [];
  if (this.client_seed != null) {
    clientSeed.push({
      code: this.client_seed.code,
      type: this.client_seed.type,
      future: this.client_seed.future,
      value: this.client_seed.value,
      hash: this.client_seed.hash,
    });
  } else clientSeed.push({});

  if (this.old_client_seed != null) {
    clientSeed.push({
      code: this.old_client_seed.code,
      type: this.old_client_seed.type,
      future: this.old_client_seed.future,
      value: this.old_client_seed.value,
      hash: this.old_client_seed.hash,
    });
  } else clientSeed.push({});

  let serverSeed = [];
  if (this.server_seed != null) {
    serverSeed.push({
      code: this.server_seed.code,
      type: this.server_seed.type,
      future: this.server_seed.future,
      value: this.server_seed.hash,
      hash: this.server_seed.hash,
    });
  } else serverSeed.push({});

  if (this.next_server_seed != null) {
    serverSeed.push({
      code: this.next_server_seed.code,
      type: this.next_server_seed.type,
      future: this.next_server_seed.future,
      value: this.next_server_seed.hash,
      hash: this.next_server_seed.hash,
    });
  } else serverSeed.push({});

  if (this.old_server_seed != null) {
    serverSeed.push({
      code: this.old_server_seed.code,
      type: this.old_server_seed.type,
      future: this.old_server_seed.future,
      value: this.old_server_seed.value,
      hash: this.old_server_seed.hash,
    });
  } else serverSeed.push({});

  return { clientSeed, serverSeed };
}

module.exports = mongoose.model('UserSeed', UserSeedSchema);