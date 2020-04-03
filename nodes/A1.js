var Device = require("./Device.js");
class A1 extends Device {
    constructor(host, mac, devType = "272a", timeout = 10) {
        super(host, mac, devType, timeout);

        this.on("payload", (err, payload) => {
            var param = payload[0];
            switch (param) {
                case 1:
                    var temperature = (payload[0x4] * 10 + payload[0x5]) / 10.0;
                    var humidity = (payload[0x6] * 10 + payload[0x7]) / 10.0;
                    var light = payload[0x8];
                    var air_quality = payload[0x0a];
                    var noise = payload[0xc];
                    this.emit("data", { temperature: temperature, humidity: humidity, light: light, air_quality: air_quality, noise: noise });
                    break;
            }
        });
    }
    check_sensors() {
        var packet = Buffer.alloc(16, 0);
        packet[0] = 1;
        this.sendPacket(0x6a, packet);
    }
}
module.exports = A1;