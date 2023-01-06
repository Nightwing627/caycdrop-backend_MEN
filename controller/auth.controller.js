const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const UserSchema = require('../model/UserSchema');
const AccountSchema = require('../model/AccountSchema');
const UserProgressSchema = require('../model/UserProgressSchema');
const UserVerifySchema = require('../model/UserVerifySchema');
const UserWalletSchema = require('../model/UserWalletSchema');
const ForgetPasswordSchema = require('../model/ForgetPasswordSchema');
const UserShippingInfoSchema = require('../model/UserShippingInfoSchema');
const UserTagSchema = require('../model/UserTagSchema');
const UserSeedSchema = require("../model/UserSeedSchema");

const Util = require('../util');
const walletManage = require('../walletManage');
const TierSchema = require("../model/TierSchema");
const UserAffliateSchema = require("../model/UserAffliateSchema");

const AuthController = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body

      if (!(email && password)) {
        return res.status(400).send("Please input the credentials");
      }
      
      let user = await UserSchema
        .findOne({ email: email.toLowerCase() })
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
        user = user.toAuthJSON();

        return res.status(200).json({
          currentUser: user,
          token: accessToken,
          refreshToken
        });
      }

      return res.status(400).send("Email or Passowrd is Invalid");
    } catch (error) {
      console.log(error)
      return res.status(500).json({
        msg: "Something were wrong, Please contact support team",
        err: error
        }
      );
    }
  },

  register: async (req, res) => {
    const { password, subscribe = true, agreeTerms = true } = req.body;
    const email = req.body.email ? req.body.email.toLowerCase() : '';

    if (!(email && password)) {
      return res.status(400).json({
        error: "Please input all informations"
      });
    }
    if (!agreeTerms) {
      return res.status(400).json({
        error: "please read and agree the Terms of Service"
      });
    }

    try {
      let checkUser = await UserSchema.findOne({ email });
      if (checkUser) {
        return res.status(409).json({
          error: "This email is already in use."
        });
      }

      const encryptPwd = await bcrypt.hash(password, 10);

      const newUser = new UserSchema({
        email,
        password: encryptPwd,
        token: 'test',
        is_subscribe: subscribe,
        is_termsService: agreeTerms,
        email_verify: false,
      });
      await newUser.save();

      // Get User code
      const code = Util.generateCode('user', newUser._id);
      // Get max tag number
      const maxUserTag = await UserTagSchema.
        find({ status: process.env.USER_TAG_STATUS_USED }).
        sort({ tag: -1 }).
        limit(1).
        exec();

      let newTag = process.env.USER_TAG_INIT;
      if (maxUserTag.length > 0) { 
        newTag = Number(maxUserTag[0].tag) + 1;
      } 

      // create new account
      const account = new AccountSchema({
        user_code: code,
        username: "USER#" + newTag,
        g_rank: 0,
        avatar: process.env.DEFAULT_AVATAR,
        locked_chat: true,
        sticky_referee: false,
        total_deposit: 0,
        total_rake_back: 0,
        daily_withdraw_limit: 1000,
        is_trader: false,
        suspected_trader: false,
        is_authentic: false,
        is_hide_stats: false,
      });
      await account.save();

      // create user tag
      const userTag = new UserTagSchema({
        user_code: code,
        tag: Number(newTag),
        status: process.env.USER_TAG_STATUS_USED
      });
      await userTag.save();

      // create user progress
      // make the level xp alorithm
      const levelXps = Util.getLevelXps(1);
      const userProgress = new UserProgressSchema({
        user_code: code,
        xp: 0,
        required_xp: 0,
        next_required_xp: levelXps,
        level: 1,
        bet_count: 0,
        updated_at: new Date(),
      });
      await userProgress.save();

      // create user wallet
      const userWallet = new UserWalletSchema({
        user_code: code,
        main: 0, // for test, default is 0
        main_currency: 'USD',
        bonus: 0,
        bonus_currency: 'USD',
        affiliate_earning: 0,
        affiliate_currency: 'USD',
        gem_stone: 0,
        gem_currency: 'USD',
        updated_at: new Date()
      });
      await userWallet.save();

      // create user shipping info
      const country = await Util.getCountryByReq(req);
      const userShippingInfo = new UserShippingInfoSchema({
        user_code: code,
        country,
        gender: 'male'
      });
      await userShippingInfo.save();

      // create user seed
      const userSeed = new UserSeedSchema({
        userId: newUser._id,
        client_seed: null,
        server_seed: null,
        next_server_seed: null,
        old_server_seed: null,
      });
      await userSeed.save();
      userSeed.code = Util.generateCode('userseed', userSeed._id);
      await userSeed.save();
      
      // update user : code, accountid, user_progress, wallets, shipping_info
      await UserSchema.findByIdAndUpdate(newUser._id, {
        code,
        account: account._id,
        user_progress: userProgress._id,
        wallets: userWallet._id,
        shipping_info: userShippingInfo._id
      });
      
      // create user verify
      const userVerify = new UserVerifySchema({
        user_code: code,
        token: Util.getRandomToken()
      });
      await userVerify.save();

      // create user crypto wallet
      await walletManage.walletCreate(code);
      
      // create user affliate
      const tier1 = await TierSchema.findOne({ level: 1 });
      await UserAffliateSchema.create({
        user_code: code,
        level: 1,
        tier: tier1._id
      });

      // TODO: fix issues
      // Util.sendEmail(
      //   process.env.EMAIL_VERIFY,
      //   {
      //     userCode: code,
      //     email: newUser.email,
      //     token: userVerify.token
      //   }
      // );

      return res.status(200).json({ result: 'success' });
    } catch (error) {
      console.log(error)
      return res.status(400).json({
        error: 'User information is not correct',
      });
    }
  },

  refreshToken: async (req, res) => {
    let { refreshToken } = req.body;
    if (refreshToken) {
      return res.status(400).json({
        error: 'Please send the refresh token'
      })
    } else if (refreshToken.includes('"')) {
      refreshToken = refreshToken.split('"')[1]
    }
    
    try {
      const user = await UserSchema.findOne({
        refresh_token: refreshToken
      });

      if (user) {
        const newAccessToken = jwt.sign(
          { userCode: user.code },
          process.env.TOKEN_KEY,
          { expiresIn: process.env.TOKEN_EXPIRE_TIME }
        )
  
        const newRefreshToken = jwt.sign(
          { userCode: user.code },
          process.env.REFRESH_TOKEN_KEY,
          { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_TIME }
        )
        
        const result = await user.updateOne({ token: newAccessToken, refresh_token: newRefreshToken });
        console.log(result)
        return res.status(200).json({
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        })
      } else {
        return res.status(400).json({
          error: 'refreshToken is wrong'
        });
      }
    } catch( err ) {
      return res.status(400).json({
        error: 'refreshToken is invalid'
      });
    }
  },

  forgetPassword: async (req, res) => {
    const { email } = req.body;
    
    try {
      const user = await UserSchema.findOne({ email });

      if (user) {
        const token = Util.getRandomToken();
        await ForgetPasswordSchema({
          user_code: user.code,
          token,
          password: user.password,
          status: 'pending'
        });
        
        Util.sendEmail(process.env.EMAIL_FORGET_PASS, {
          userCode: user.code,
          email: user.email,
          token
        });
        
        return res.status(200).json({
          result: 'success'
        });
      } else {
        res.status(400).json({
          error: 'The Email is not registered with us'
        });
      }
    } catch (error) {
      res.status(400).json({
        error: 'Something went wrong. Please contact with support team'
      });
    }
  },

  passwordReset: async (req, res) => {
    const { code, token, password } = req.body;

    try {
      if (!(code && token && password)) {
        return res.status(400).json({
          error: 'Link or password is wrong'
        });
      }

      let user = await UserSchema.findOne({ where: { code } });

      if (user) {
        const forgetPass = await ForgetPasswordSchema.findOne({ user_code: code, token });
        if (forgetPass) {
          const enryptedPWD = await bcrypt.hash(password, 10)
          user = await UserSchema.updateOne({ code }, { password: enryptedPWD });
          await ForgetPasswordSchema.deleteOne({ user_code: code, token })
          
          return res.status(200).json({ result: 'success'})
        } else {
          res.status(405).json({
            error: 'This requst is not registered'
          });
        }
      } else {
        res.status(400).json({
          error: 'User is not registered with us'
        });
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({
        error: 'Something went wrong, Please contact with support team'
      });
    }
  },

  sendEmailVerification: async (req, res) => {
    // TODO: this feature may be added
  },

  emailVerify: async (req, res) => {
    const { code, token } = req.body;

    try {
      const user = await UserSchema.findOne({ code });

      if (user) {
        const verify = await UserVerifySchema.findOne({ user_code: user.code, token })
        if (verify) {
          await verify.remove();
          user.email_verify = true;
          await user.save();
          res.status(200).json({ result: 'success' });
        } else {
          res.status(400).json({
            error: 'This request is not registered'
          });
        }
      } else {
        res.status(400).json({
          error: 'User is not registered with us'
        });
      }
    } catch (error) {
      console.log(error)
      res.status(400).send('error')
    }
  }
};

module.exports = AuthController;