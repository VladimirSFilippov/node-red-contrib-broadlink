var Device = require("./Device.js");
class MP1 extends Device {
    constructor(host, mac, devType = "272a", timeout = 10) {
        super(host, mac, devType, timeout);

        this.on("payload", (err, payload) => {
            var result = {
                "s1": (Boolean(payload[0x0e] & 0x01)),
                "s2": (Boolean(payload[0x0e] & 0x02)),
                "s3": (Boolean(payload[0x0e] & 0x04)),
                "s4": (Boolean(payload[0x0e] & 0x08))
            };
            this.emit("data", result);
        });
    }
    set_power_mask(sid_mask, state) {
        //"""Sets the power state of the smart power strip."""

        var packet = Buffer.alloc(16, 0);
        packet[0x00] = 0x0d;
        packet[0x02] = 0xa5;
        packet[0x03] = 0xa5;
        packet[0x04] = 0x5a;
        packet[0x05] = 0x5a;
        packet[0x06] = 0xb2 + (state ? (sid_mask << 1) : sid_mask);
        packet[0x07] = 0xc0;
        packet[0x08] = 0x02;
        packet[0x0a] = 0x03;
        packet[0x0d] = sid_mask;
        packet[0x0e] = state ? sid_mask : 0;

        this.sendPacket(0x6a, packet);
        //console.log('err', response[0x22] | (response[0x23] << 8))
    }

    set_power(sid, state) {
        //"""Sets the power state of the smart power strip."""
        var sid_mask = 0x01 << (sid - 1);
        this.set_power_mask(sid_mask, state);
    }
    check_power_raw() {
        //"""Returns the power state of the smart power strip in raw format."""
        var packet = Buffer.alloc(16, 0);
        packet[0x00] = 0x0a;
        packet[0x02] = 0xa5;
        packet[0x03] = 0xa5;
        packet[0x04] = 0x5a;
        packet[0x05] = 0x5a;
        packet[0x06] = 0xae;
        packet[0x07] = 0xc0;
        packet[0x08] = 0x01;

        this.sendPacket(0x6a, packet);
        /*
           err = response[0x22] | (response[0x23] << 8);
           if(err == 0){
           aes = AES.new(bytes(this.key), AES.MODE_CBC, bytes(self.iv));
           payload = aes.decrypt(bytes(response[0x38:]));
           if(type(payload[0x4]) == int){
           state = payload[0x0e];
           }else{
           state = ord(payload[0x0e]);
           }
           return state;
           }
           */
    }









    /*check_power() {
        //"""Returns the power state of the smart power strip."""

        var state = this.check_power_raw();
        var data = {};
        data['s1'] = (state & 0x01);
        data['s2'] = (state & 0x02);
        data['s3'] = (state & 0x04);
        data['s4'] = (state & 0x08);
        return data;

    }*/
}
module.exports = MP1;
