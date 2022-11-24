const crypto = require('crypto');
const randToken = require('rand-token');
const axios = require('axios');
const geoip = require('geoip-country');
const CountrySchema = require('../model/CountrySchema');
require('dotenv').config();
const algorithm = 'aes-256-cbc';
// secret key generate 32 bytes of random data
const key = crypto.randomBytes(32);
// generate 16 bytes of random data
const iv = crypto.randomBytes(16);


function encrypt(text) { 
  try {
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text.toString());
    encrypted = Buffer.concat([ encrypted, cipher.final() ]);
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };  
  } catch (error) {
    console.log(error)
    return { error: 'encrypt module error' }
  }
}

function decrypt(text) { 
  let iv = Buffer.from(text.iv, 'hex');
  let encryptedText = Buffer.from(text.encryptedData, 'hex')
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([ decrypted, decipher.final() ]);
  return decrypted.toString();
}

function generateCode(type, text) {

  const encrypted = encrypt(text);
  let content = encrypted.encryptedData;

  if (content.length > process.env.CODE_LENGTH) {
    content = content.substring(content.length - process.env.CODE_LENGTH);
  }
  
  let prefix = '';
  switch (type) {
    case "user":
      prefix = process.env.CODE_PREFIX_USER; break;
    case "box":
      prefix = process.env.CODE_PREFIX_BOX; break;
    case "item":
      prefix = process.env.CODE_PREFIX_ITEM; break;
    case "tag":
      prefix = process.env.CODE_PREFIX_TAG; break;
    case "boxopen":
      prefix = process.env.CODE_PREFIX_BOX_OPEN; break;
    case "userseed":
      prefix = process.env.CODE_PREFIX_USER_SEED; break;
    case "seed":
      prefix = process.env.CODE_PREFIX_SEED; break;
    case "rollhistory":
      prefix = process.env.CODE_PREFIX_ROLL_HISTORY; break;
    case "walletexchange":
      prefix = process.env.CODE_PREFIX_WALLET_EXCHANGE; break;
    case "usercart":
      prefix = process.env.CODE_PREFIX_USER_CART; break;
    case "transaction":
      prefix = process.env.CODE_PREFIX_TRANSACTION; break;
    case "pvpgame":
      prefix = process.env.CODE_PREFIX_PVP_GAME; break;
  }

  return prefix + content;
}

function getRandomToken() {
  return randToken.uid(200);
}

function sendEmail(type, data) {
  let subject, content;
  if (type == process.env.EMAIL_VERIFY) {
    subject = 'Email Verification - CAYCDROP';
    // email_verify/u/' + user.code +'?token=' + token +
    content = `
      <p>To confirm your email address, please click on the link below, or copy and paste the entire link into your browser.</p>
      ${process.env.LINK}/emailverify/u/${data.userCode}?token=${data.token}
      <p>Please note that this confirmation link expires in 24 hours and may require your immediate attention if you wish to access your online account in the future.</p>
      <p>If you require additional assistance logging into your account, please contact us at ${process.env.LINK}/about-us/contact-us.</p>

      <p>PLEASE DO NOT REPLY TO THIS MESSAGE</p>
    `;

    axios
      .post(process.env.SMTP_URL, {
        authuser: process.env.SMTP_USER,
        authpass: process.env.SMTP_PASSWORD,
        from: process.env.SMTP_USER,
        to: data.email,
        subject,
        content
      }
    );
  }
  // TODO: change the link and content
  if (type == process.env.EMAIL_FORGET_PASS) {
    subject = 'Forget Password - CAYCDROP';
    // email_verify/u/' + user.code +'?token=' + token +
    content = `
      <p>To reset your password, please click on the link below, or copy and paste the entire link into your browser.</p>
      ${process.env.LINK}/resetpassword/u/${data.userCode}?token=${data.token}
      <p>Please note that this confirmation link expires in 24 hours and may require your immediate attention if you wish to access your online account in the future.</p>
      <p>If you require additional assistance logging into your account, please contact us at ${process.env.LINK}/about-us/contact-us.</p>

      <p>PLEASE DO NOT REPLY TO THIS MESSAGE</p>
    `;

    axios
      .post(process.env.SMTP_URL, {
        authuser: process.env.SMTP_USER,
        authpass: process.env.SMTP_PASSWORD,
        from: process.env.SMTP_USER,
        to: data.email,
        subject,
        content
      }
    );
  }
  
}

function getLevelXps(level) {
  return Number(
    process.env.XP_SEED_1 * level +
    process.env.XP_SEED_2 * (level - 1) * level / 2 +
    100 * (
      Math.pow(level, 4) -
      2 * Math.pow(level, 3) -
      Math.pow(level, 2) +
      2 * level)
    / 24
  );
}

async function getCountryByReq(request) { 
  let ip = request.headers['x-forwarded-for']
    || request.connection.remoteAddress;
  if (ip == '::1') ip = '193.203.203.26';
  var geo = geoip.lookup(ip)
  const country = await CountrySchema.findOne({ code: geo.country });
  return country;
}

function setBoxItemRolls(data) { 
  const diff = Number(process.env.ROLL_DIFF);
  
  let preRoll = 0;
  data.forEach(item => {
    item.roll_start = preRoll + 1;
    item.roll_end = preRoll + item.rate * diff;
    preRoll = item.roll_end;
  });

  return data;
}

function getItemByRollValue(data, rollValue) { 
  data = setBoxItemRolls(data);
  var item = data.find(item => rollValue > item.roll_start && rollValue < item.roll_end);
  return item;
}

function getHashValue(type) {
  let value = "" + type + "_" + Date.now();
  const hashed = crypto.createHash('sha3-256').update(value).digest('hex');
  console.log(`${type}: ${hashed}`);
  return hashed;
}

function updateUserProgress(upData, newXp) {
  upData.xp += newXp;
  var upLevel = false;
  while (upData.xp > getLevelXps(upData.level)) {
    upLevel = true;
    upData.required_xp = upData.next_required_xp;
    upData.level++;
    upData.next_required_xp = getLevelXps(upData.level);
  }
  upData.level = upLevel ? upData.level - 1 : upData.level;
  return upData;
}

const Seed = require('./seed');
const CryptoRate = require('./exchangeRate');

module.exports = {
  generateCode,
  sendEmail,
  getCountryByReq,
  getRandomToken,
  getLevelXps,
  setBoxItemRolls,
  getHashValue,
  getItemByRollValue,
  updateUserProgress,
  Seed,
  CryptoRate
}