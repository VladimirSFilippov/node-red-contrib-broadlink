var Device = require("./Device.js");

class SP2 extends Device {
  
    constructor(host, mac, timeout = 10) {
        super(host, mac, timeout);

        this.on("payload", (err, payload) => {
            var param = payload[0];
            switch (param) {
                case 0x01:
                    this.emit("data", Boolean(payload[0x4]));
                    break;
                case 0x08:
                    this.emit("energy", { energy: (payload[7] * 256 + payload[6]) + payload[5] / 100.0}); 
                    break;
            }
        });
    }

    set_power(state) {
        // Sets the power state of the smart plug.
        var packet = Buffer.alloc(16, 0);
        packet[0] = 2;
        packet[4] = state ? 1 : 0;
        this.sendPacket(0x6a, packet);
    }

    check_power() {
        // Returns the power state of the smart plug.
        var packet = Buffer.alloc(16, 0);
        packet[0] = 1;
        this.sendPacket(0x6a, packet);
    }
    
    get_energy() {
        // Returns the current energy consuption
        var packet = Buffer.alloc(16, 0);
        packet[0x00] = 0x08;
        packet[0x01] = 0x00;
        packet[0x02] = 0xFE;
        packet[0x03] = 0x01;
        packet[0x04] = 0x05;
        packet[0x05] = 0x01;
        packet[0x06] = 0x00;
        packet[0x07] = 0x00;
        packet[0x08] = 0x00;
        packet[0x09] = 0x2D;
        this.sendPacket(0x6a, packet);
    }

}
module.exports = SP2;