var Device = require("./Device.js");
class SP2 extends Device {
    constructor(host, mac, timeout = 10) {
        super(host, mac, timeout);

        this.on("payload", (err, payload) => {
            var param = payload[0];
            //console.log(payload.join(' '))
            switch (param) {
                case 1:
                    //this.emit("data", Boolean(payload[0x4]));
                    this.emit("data", Boolean(payload[0x4]));
                    break;
                case 0x04:
                    this.emit("energy", { energy: (payload[6] * 256 + payload[5] + payload[4] / 100.0) / 4});                       
                    break;
            }
            //this.emit("energy", payload);  
        });
    }
    set_power(state) {
        //"""Sets the power state of the smart plug."""
        var packet = Buffer.alloc(16, 0);
        packet[0] = 2;
        packet[4] = state ? 1 : 0;
        this.sendPacket(0x6a, packet);
    }

    check_power() {
        //"""Returns the power state of the smart plug."""
        var packet = Buffer.alloc(16, 0);
        packet[0] = 1;
        this.sendPacket(0x6a, packet);
        /*
           err = response[0x22] | (response[0x23] << 8);
           if(err == 0){
           aes = AES.new(bytes(this.key), AES.MODE_CBC, bytes(self.iv));
           payload = aes.decrypt(bytes(response[0x38:]));
           return bool(payload[0x4]);
           }
           */
    }
/**
   def get_energy(self):
    packet = bytearray([8, 0, 254, 1, 5, 1, 0, 0, 0, 45])
    response = self.send_packet(0x6a, packet)
    err = response[0x22] | (response[0x23] << 8)
    if err == 0:
      payload = self.decrypt(bytes(response[0x38:]))
      energy = int(hex(ord(payload[7]) * 256 + ord(payload[6]))[2:]) + int(hex(ord(payload[5]))[2:])/100.0
      return energy
 */
    get_energy() {
        var packet = Buffer.alloc(16, 0);
        packet[0] = 0x04;
        //var packet = new Buffer([0xaa, 0xcf, 0xb7, 0x55, 0x18, 0x08, 0x11, 0x9d, 0xab, 0x7e, 0xfd, 0xe7, 0x07, 0xc5, 0xae, 0x64]);
        //packet[0x00] = 0x08;
        //packet[0x02] = 0xFE;
        //packet[0x03] = 0x01;
        //packet[0x04] = 0x05;
        //packet[0x05] = 0x01;
        //packet[0x09] = 0x2D;
        this.sendPacket(0x6a, packet);
    }
}
module.exports = SP2;