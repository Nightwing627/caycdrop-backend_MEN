const SocketIO = require('socket.io');
const uuid = require('uuid');
const UnBoxHandler = require('./unBox.handler');
const PvpHandler = require('./pvp.handler');
const LiveDropHandler = require('./liveDrop.handler');

const Init = (server) => {
  const io = SocketIO(server, {
    // path: '/caycdrop_socket/',
    serveClient: false,
    connectTimeout: 60000,
    maxHttpBufferSize: 1e8,
    cors: {
      origin: "http://localhost:3000/"
    }
  });

  io.engine.generateId = (req) => {
    return uuid.v4();
  }

  io.on("connection", (socket) => { 
    Handler(io, socket);
  });

}

const Handler = (io, socket) => { 
  console.log(`${socket.id} Sockect connected!`);

  UnBoxHandler(io, socket);
  PvpHandler(io, socket);
  LiveDropHandler(io, socket);

  // /**** TEST Socket connection **/
  // let interval;
  // if (interval) {
  //   clearInterval(interval);
  // }
  // interval = setInterval(() => getApiAndEmit(socket), 1000);
  // /**** END TEST **/


  socket.on("disconnect", () => {
    console.log(`${socket.id} Client disconnected`);
    // clearInterval(interval);
  });
}

const getApiAndEmit = socket => {
  const response = new Date();
  console.log(response);
  // Emitting a new message. Will be consumed by the client
  socket.emit("FromAPI", response);
};

module.exports = Init;