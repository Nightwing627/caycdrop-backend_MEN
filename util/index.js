const crypto = require('crypto');
const randToken = require('rand-token');
const axios = require('axios');
const geoip = require('geoip-country');
const CountrySchema = require('../model/CountrySchema');

const algorithm = 'aes-256-cbc';

// secret key generate 32 bytes of random data
const key = crypto.randomBytes(32);

// generate 16 bytes of random data
const iv = crypto.randomBytes(16);
// const SENDGRID_API = process.env.SENDGRID_API_THOMAS

// const transporter = nodemailer.createTransport(
//   sendgirdTransport({
//     auth: {
//       api_key: SENDGRID_API
//     }
//   })
// )

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
    case "account":
      prefix = process.env.CODE_PREFIX_ACCOUNT; break;
    case "box":
      prefix = process.env.CODE_PREFIX_BOX; break;
    case "item":
      prefix = process.env.CODE_PREFIX_ITEM; break;
    case "tag":
      prefix = process.env.CODE_PREFIX_TAG; break;
    case "pvp":
      prefix = process.env.CODE_PREFIX_PVP; break;
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

async function getCountryByReq(request) { 
  let ip = request.headers['x-forwarded-for']
    || request.connection.remoteAddress;
  if (ip == '::1') ip = '193.203.203.26';
  var geo = geoip.lookup(ip)
  const country = await CountrySchema.findOne({ code: geo.country });
  return country;
}

module.exports = {
  generateCode, sendEmail, getCountryByReq, getRandomToken
}