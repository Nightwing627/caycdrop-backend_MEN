const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const UserSchema = require('../model/UserSchema');
const AccountSchema = require('../model/AccountSchema');
const UserProgressSchema = require('../model/UserProgressSchema');
const UserVerifySchema = require('../model/UserVerifySchema');
const UserWalletSchema = require('../model/UserWalletSchema');
const ForgetPasswordSchema = require('../model/ForgetPasswordSchema');

const AuthController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body

      if (!(email && password)) {
        return res.status(400).send("Please input the credentials");
      }
      
      const user = await UserSchema
        .findOne({ email: email.toLowerCase() })
        .populate('account')
        .populate('user_progress')
        .populate('wallets')
        .populate('shipping_info');
      
      if (user && (await bcrypt.compare(password, user.password))) {
        const accessToken = jwt.sign(
          { userCode: user.code },
          process.env.TOKEN_KEY,
          { expiresIn: process.env.TOKEN_EXPIRE_TIME }
        );

        const refreshToken = jwt.sign(
          { userCode: user.code },
          process.env.REFRESH_TOKEN_KEY,
          { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_TIME }
        );

        user.token = accessToken;
        user.refresh_token = refreshToken;
        
        await user.save();
        
        return res.status(200).json({
          currentUser: user,
          token,
          refreshToken
        })
      }

      return res.status(400).send("Email or Passowrd is Invalid")
    } catch (error) {
      return res.status(500).send("Something were wrong, Please contact support team")
    }
  },
  register: async (req, res) => {

  },
  refreshToken: async (req, res) => {

  },
  forgetPassword: async (req, res) => {

  },
  passwordReset: async (req, res) => {

  },
  sendEmailVerification: async (req, res) => {

  },
  emailVerify: async (req, res) => {

  }
};

module.exports = AuthController;