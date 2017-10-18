var Device = require("./Device.js");
class RM extends Device {
    constructor(host, mac, timeout = 10) {
        super(host, mac, timeout);

        this.on("payload", (err, payload) => {
            var param = payload[0];
            switch (param) {
                case 1:
                    var temp = (payload[0x4] * 10 + payload[0x5]) / 10.0;
                    this.emit("temperature", temp);
                    break;
                case 4: //get from check_data
                    var data = Buffer.alloc(payload.length - 4, 0);
                    payload.copy(data, 0, 4);
                    this.emit("data", Array.prototype.slice.call(data, 0));
                    break;
                case 3:
                    ////this.emit("temperature", payload);
                    break;

                    
                case 26: //get from check_data
                    var data = Buffer.alloc(1, 0);
                    payload.copy(data, 0, 0x4);
                    // console.log('payload', payload)

                    // console.log('data', data)

                    if (data[0] !== 0x1) break;

                    this.emit("rawRFData", data);
                    break;
                case 27: //get from check_data
                    var data = Buffer.alloc(1, 0);
                    payload.copy(data, 0, 0x4);
                    // console.log('payload', payload)

                    // console.log('data', data)

                    if (data[0] !== 0x1) break;

                    this.emit("rawRFData2", data);
                    break;
            }
        });
    }

    checkTemperature() {
        var packet = Buffer.alloc(16, 0);
        packet[0] = 1;
        this.sendPacket(0x6a, packet);
    }


    enterLearning() {
        var packet = Buffer.alloc(16, 0);
        packet[0] = 3;
        this.sendPacket(0x6a, packet);
    }
    checkData() {
        var packet = Buffer.alloc(16, 0);
        packet[0] = 4;
        this.sendPacket(0x6a, packet);
    }

    sendData(data) {
        var packet = new Buffer([0x02, 0x00, 0x00, 0x00]);
        packet = Buffer.concat([packet, data]);
        this.sendPacket(0x6a, packet);
    }

    //if(isPlus) {
        enterRFSweep() {
            var packet = Buffer.alloc(16, 0);
            packet[0] = 0x19;
            this.sendPacket(0x6a, packet);
        }

        checkRFData() {
            var packet = Buffer.alloc(16, 0);
            packet[0] = 0x1a;
            this.sendPacket(0x6a, packet);
        }

        checkRFData2() {
            var packet = Buffer.alloc(16, 0);
            packet[0] = 0x1b;
            this.sendPacket(0x6a, packet);
        }

        cancelRFSweep() {
            var packet = Buffer.alloc(16, 0);
            packet[0] = 0x1e;
            this.sendPacket(0x6a, packet);
        }
    //}
}
module.exports = RM;


/*

device.prototype.rm = function(isPlus){
    this.type = "RM2";
    this.checkData = function(){
        var packet = Buffer.alloc(16,0);
        packet[0] = 4;
        this.sendPacket(0x6a, packet);
    }

    if (isPlus) {
      this.enterRFSweep = function(){
          var packet = Buffer.alloc(16,0);
          packet[0] = 0x19;
          this.sendPacket(0x6a, packet);
      }

      this.checkRFData = function(){
        var packet = Buffer.alloc(16,0);
        packet[0] = 0x1a;
        this.sendPacket(0x6a, packet);
      }

      this.checkRFData2 = function(){
        var packet = Buffer.alloc(16,0);
        packet[0] = 0x1b;
        this.sendPacket(0x6a, packet);
      }

      this.cancelRFSweep = function(){
          var packet = Buffer.alloc(16,0);
          packet[0] = 0x1e;
          this.sendPacket(0x6a, packet);
      }
    }

    this.sendData = function(data){
        packet = new Buffer([0x02, 0x00, 0x00, 0x00]);
        packet = Buffer.concat([packet, data]);
        this.sendPacket(0x6a, packet);
    }

    this.enterLearning = function(){
        var packet = Buffer.alloc(16,0);
        packet[0] = 3;
        this.sendPacket(0x6a, packet);
    }

    this.checkTemperature = function(){
        var packet = Buffer.alloc(16,0);
        packet[0] = 1;
        this.sendPacket(0x6a, packet);
    }

    this.on("payload", (err, payload) => {
        var param = payload[0];
        // console.log('param', param)


        var data = Buffer.alloc(payload.length - 4,0);
        payload.copy(data, 0, 4);

        switch (param){
            case 1:
                var temp = (payload[0x4] * 10 + payload[0x5]) / 10.0;
                this.emit("temperature", temp);
                break;
            case 4: //get from check_data
                var data = Buffer.alloc(payload.length - 4,0);
                payload.copy(data, 0, 4);
                this.emit("rawData", data);
                break;
            case 26: //get from check_data
                var data = Buffer.alloc(1,0);
                payload.copy(data, 0, 0x4);
                // console.log('payload', payload)

                // console.log('data', data)

                if (data[0] !== 0x1) break;

                this.emit("rawRFData", data);
                break;
            case 27: //get from check_data
                var data = Buffer.alloc(1,0);
                payload.copy(data, 0, 0x4);
                // console.log('payload', payload)

                // console.log('data', data)

                if (data[0] !== 0x1) break;

                this.emit("rawRFData2", data);
                break;
            case 3:
                break;
            case 4:
                break;
        }
    });
}


*/