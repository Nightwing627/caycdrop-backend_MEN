const uuid = require('uuid');
const BoxSchema = require('../model/BoxSchema');
const BoxItemSchema = require('../model/BoxItemSchema');
const PvpGameSchema = require('../model/PvpGameSchema');
const Util = require('../util');
var pvpIO;
let battles = {};

module.exports = (io, pvpSocket) => {
  pvpIO = io.of('/pvp');
  // pvpIO.use((pvpSocket, next) => {
  //   next();
  // });

  pvpSocket.on('battle:join', async (payload, callback) => {
    const { pvpId } = payload;
    const pvpGame = await PvpGameSchema.findOne({ code: pvpId });
    if (pvpGame == null) {
      return callback({ error: 'wrong battle id' });
    }
    let battleName = 'battle_' + pvpId;
    console.log('@@@@@@@@@@', battles[battleName])
    if (battles[battleName] == undefined) {
      battles[battleName] = [pvpSocket.id];
      pvpSocket.join(battleName);
    } else {
      if (!battles[battleName].includes(pvpSocket.id)) {
        battles[battleName].push(pvpSocket.id);
        pvpSocket.join(battleName);
      }
    }
    
    console.log(`battle joined: ${pvpSocket.id}`);
    sendBattleData(pvpSocket, pvpId, battleName);
    callback({ result: 'joined' });

  });

  pvpSocket.conn.on("close", (reason) => {
    // called when the underlying connection is closed
    console.log(`reason is ${reason}`)
  });

  pvpSocket.on('disconnect', (data) => {
    console.log('PVP socket disconnected')
  });

};

const sendBattleData = async (pvpSocket, pvpId, battle) => {
  console.log('called sendbattledata function')
  const pvpGame = await PvpGameSchema.findOne({ code: pvpId });
  const boxList = await BoxSchema.find(
    { _id: { $in: pvpGame.box_list } }
  );
  
  let boxData = [];
  
  for (var i = 0; i < boxList.length; i ++) {
    const item = boxList[i];

    let boxItems = await BoxItemSchema.aggregate([
      { $match: { box_code: item.code } },
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
    boxItems = Util.setBoxItemRolls(boxItems);
    boxData.push({ ...item.toGetOneJSON(), slots: boxItems })
  }
  
  pvpSocket.emit('battle:data', boxData);
}
