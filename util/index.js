const crypto = require('crypto');
const randToken = require('rand-token');
const axios = require('axios');
const geoip = require('geoip-country');
const CountrySchema = require('../model/CountrySchema');
const BoxSchema = require('../model/BoxSchema');
const BoxItemSchema = require('../model/BoxItemSchema');
const UserSchema = require('../model/UserSchema');
require('dotenv').config();
const multer = require('multer');
const uuid = require('uuid');
const path = require('path');

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
    return { error: 'Encrypt module error' }
  }
}

function decrypt(data) { 
  let iv = Buffer.from(data.iv, 'hex');
  let encryptedText = Buffer.from(data.encryptedData, 'hex')
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
    case "pvpround":
      prefix = process.env.CODE_PREFIX_PVP_ROUND; break;
    case "tier":
      prefix = process.env.CODE_PREFIX_AFFLIATE_TIER; break;
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

async function getItemAndXP(boxCode, rollValue) {
  const box = await BoxSchema.findOne({ code: boxCode });
  
  let boxItems = await BoxItemSchema.aggregate([
        { $match: { box_code: boxCode } },
        {
          $project: {
            _id: 0, __v: 0, created_at: 0, updated_at: 0
          }
        },
        {
          $lookup: {
            from: 'items',
            localField: 'item',
            foreignField: '_id',
            as: 'item',
          },
        },
        { $unwind: { path: "$item"} },
        {
          $sort: { "item.value": -1 }
        }
      ]);
  
  const pickedItem = getItemByRollValue(boxItems, rollValue);
  
  const profit = Number(box.original_price - pickedItem.item.value);
  let xpRewarded = 0;
  if (profit > 0) {
    xpRewarded = profit * process.env.XP_CALC_VALUE;
  }
  
  return { item: pickedItem.item, xp: xpRewarded, profit };
}


function getHashValue(value) {
  const hashed = crypto.createHash('sha3-256').update(value).digest('hex');
  console.log(`${value} hashed: ${hashed}`);
  return hashed;
}

function getCryptoValue(value) {
  return crypto.createHash('sha3-256').update(value).digest('hex');
}

function hexToDecimal(hex) {
  return parseInt(hex, 16);
}

function getNonce(value) {  
  return Number(process.env.ROLL_MAX) + value;
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

function getRandomWinner() { 
  const time = Date.now();
  const value = Math.floor(Math.random() * time);
  return Math.floor(value % 2);
}

async function getUserByCode(code) {
  const user = await UserSchema
    .findOne({ code })
    .populate('account', '-_id -__v -user_code')
    .populate('user_progress', '-_id -__v -user_code -bet_count')
    .populate('wallets', '-_id -__v -user_code')
    .populate({
      path: 'shipping_info',
      select: '-_id -__v -user_code',
      populate: [
        {
          path: 'country',
          select: '-_id -__v'
        }
      ]
    })
    .select('-__v');
  return user.toAuthJSON();
}

const Seed = require('./seed');
const CryptoRate = require('./exchangeRate');

const base64 = require('base-64');

const encryption = (text) => {
  return base64.encode(text);
}

const decryption = (text) => {
  // let textParts = text.split('.');
  // let iv = Buffer.from(textParts.shift(), 'hex');
  // let encryptedText = Buffer.from(textParts.join('.'), 'hex');
  // let decipher = crypto.createDecipheriv(algorithm,
  //   Buffer.from(process.env.ENCRYPT_KEY), iv);
  // let decrypted = decipher.update(encryptedText);

  // decrypted = Buffer.concat([decrypted, decipher.final()]);

  return base64.decode(text);
}

module.exports = {
  encryption,
  decryption,
  generateCode,
  sendEmail,
  getCountryByReq,
  getRandomToken,
  getLevelXps,
  setBoxItemRolls,
  getHashValue,
  getItemByRollValue,
  getItemAndXP,
  updateUserProgress,
  getCryptoValue,
  hexToDecimal,
  getNonce,
  Seed,
  CryptoRate,
  getRandomWinner,
  getUserByCode,
}