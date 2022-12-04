const SocketIO = require('socket.io');
const uuid = require('uuid');
const UnBoxHandler = require('./unBox.handler');
const PvpHandler = require('./pvp.handler');
const LiveDropHandler = require('./liveDrop.handler');

let socketIO, socketInstance;

module.exports = {
  init: async (server) => {
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
      var clientIp = socket.request.connection.remoteAddress;
      // console.log('Remote address: ', clientIp);
      // console.log(`${socket.id} Sockect connected!`);
      socketIO = io;
      socketInstance = socket;

      UnBoxHandler(io, socket);

      PvpHandler.initBCAST(io);

      socket.on("disconnect", () => {
        console.log(`${socket.id} Client disconnected`);
      });
    });

    io.of('/pvp').on("connection", (socket) => {
      console.log('pvp connected')
      PvpHandler.listeners(io, socket);
    });
  },

  deposit: (result) => {
    // TODO: get user who deposited the money
    socketInstance.emit("player.wallet.deposit", { result });
  },

  braodcasting: async () => {
    await PvpHandler.broadcasting();
  }
};

const Handler = (io, socket) => { 
  socket.emit("connected");
  LiveDropHandler(io, socket);
}

