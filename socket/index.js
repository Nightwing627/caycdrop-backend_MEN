const SocketIO = require('socket.io');
const uuid = require('uuid');
const UnBoxHandler = require('./unBox.handler');
const PvpHandler = require('./pvp.handler');
const LiveDropHandler = require('./liveDrop.handler');

let socketIO, socketInstance;

module.exports = {
  init: (server) => {
    const io = SocketIO(server, {
      // path: '/caycdrop_socket/',
      serveClient: false,
      connectTimeout: 60000,
      maxHttpBufferSize: 1e8,
      cors: {
        origin: "*"
      }
    });

    io.engine.generateId = (req) => {
      return uuid.v4();
    }

    io.on("connection", (socket) => {
      var address = socket.handshake.address;
      console.log('New connection from ' + address.address + ':' + address.port);
      var clientIp = socket.request.connection.remoteAddress;
      console.log('Remote address: ', clientIp);
      socketIO = io;
      socketInstance = socket;
      Handler(io, socket);
    });
  },

  deposit: (result) => {
    socketInstance.emit("player.wallet.deposit", { result });
  }
};

const Handler = (io, socket) => { 
  
  console.log(`${socket.id} Sockect connected!`);
  socket.emit("connected");
  UnBoxHandler(io, socket);
  PvpHandler(io, socket);
  LiveDropHandler(io, socket);

  socket.on("disconnect", () => {
    console.log(`${socket.id} Client disconnected`);
    // clearInterval(interval);
  });
}