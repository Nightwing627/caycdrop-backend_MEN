const crypto = require('crypto');

var serverHashed;
var clientHashed;
var game = '';
const max = process.env.ROLL_MAX;

function getRoll(type, clientValue, serverValue, nonce) {
  serverHashed = crypto.createHash('sha3-256').update(clientValue).digest('hex');
  clientHashed = crypto.createHash('sha3-256').update(serverValue).digest('hex');
  if (type == 'PVP') { 
    game = process.env.COMBINE_SEED_PVP;
  } else if (type == 'BOX') {
    game = process.env.COMBINE_SEED_BOX;
  }
  
  const seed = getCombinedSeed(game, serverHashed, clientHashed, nonce);
  
  const rollValue = getRandomInt({ max, seed });
  // console.log(rollValue);
  return rollValue;
}

function getRandomInt({ max, seed }) {
  // Get hash from seed
  const hash = crypto.createHmac('sha3-256', seed).digest('hex');
  
  // Get value from hash
  let subHash = hash.slice(0, 13);
  console.log(subHash)
  // subHash = Math.floor(Math.random() * 9) + subHash.slice(subHash.length - 10);
  // console.log(subHash)
  const valueFromHash = Number.parseInt(subHash, 16);

  // Get dynamic result for this roll
  const e = Math.pow(2, 52);
  const result = valueFromHash / e;
  return Math.floor(result * max);
}

function getCombinedSeed(game, serverSeed, clientSeed, nonce) {
  // Add main parameters
  const seedParameters = [serverSeed, clientSeed, nonce];

  // Add game parameter if needed
  if (game) {
    seedParameters.unshift(game);
  }

  // Combine parameters to get seed value
  return seedParameters.join('-')
}

module.exports = {
  getRoll
}