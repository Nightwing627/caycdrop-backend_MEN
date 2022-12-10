const SocketIO = require('socket.io');
const uuid = require('uuid');
const UnBoxHandler = require('./unBox.handler');
const PvpHandler = require('./pvp.handler');
const LiveDropHandler = require('./liveDrop.handler');
const jwt = require('jsonwebtoken');

let socketIO, socketInstance;

module.exports = {
  init: (server) => {
    const io = SocketIO(server, {
      // path: '/caycdrop_socket/',
      serveClient: false,
      connectTimeout: 24 * 60 * 60 * 1000,
      maxHttpBufferSize: 1e8,
      cors: {
        origin: "*"
      }
    });

    io.engine.generateId = (req) => {
      return uuid.v4();
    }

    io.on("connection", (socket) => {
      // console.log(`${socket.id} Client Connected`);
      socketIO = io;
      socketInstance = socket;

      UnBoxHandler(io, socket);

      socket.on('user:loggedin', (payload) => {
        
      });

      socket.on("disconnect", () => {
        // console.log(`${socket.id} Client disconnected`);
      });

      socket.conn.on("close", (reason) => {
        // called when the underlying connection is closed
        // console.log(`${socket.id} is closed, reason is ${reason}`);
      });

      socket.on('connect_error', (error) => {
        console.log('Connect Error: ', error);
      });
    });

    io.of('/pvp').on("connection", (socket) => {
      // console.log(`${socket.id} is connected on PVP`)
      PvpHandler.listeners(io, socket);
    });
  },

  deposit: (result) => {
    // TODO: get user who deposited the money
    socketInstance.emit("player.wallet.deposit", { result });
  },

  braodcasting: async (pvpId) => {
    await PvpHandler.broadcasting(pvpId);
  }
};

const validaToken = (token) => {
  try {
    const userData = jwt.verify(token, process.env.TOKEN_KEY);
    return userData.userCode;
  } catch (error) {
    return null;
  }
}