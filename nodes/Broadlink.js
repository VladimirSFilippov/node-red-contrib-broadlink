let EventEmitter = require('events');
let dgram = require('dgram');
let os = require('os');
let crypto = require('crypto');
class Broadlink {
    constructor(timeout = 10) {
        this.devices = {};
    }

    discover() {
        var interfaces = os.networkInterfaces();
        var addresses = [];
        for (var k in interfaces) {
            for (var k2 in interfaces[k]) {
                var address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }
        var address = addresses[0].split('.');

        var cs = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        // --- Fix for UDP ports not being closed
        setTimeout( function() {
            cs.close();
            cs = null;
        }, 10000); // 10 seconds wait for response from device

        cs.on('listening', function () {
            cs.setBroadcast(true);

            var port = cs.address().port;
            var now = new Date();
            var starttime = now.getTime();

            var timezone = now.getTimezoneOffset() / -3600;
            var packet = Buffer.alloc(0x30, 0);

            var year = now.getYear();

            if (timezone < 0) {
                packet[0x08] = 0xff + timezone - 1;
                packet[0x09] = 0xff;
                packet[0x0a] = 0xff;
                packet[0x0b] = 0xff;
            } else {
                packet[0x08] = timezone;
                packet[0x09] = 0;
                packet[0x0a] = 0;
                packet[0x0b] = 0;
            }
            packet[0x0c] = year & 0xff;
            packet[0x0d] = year >> 8;
            packet[0x0e] = now.getMinutes();
            packet[0x0f] = now.getHours();
            var subyear = year % 100;
            packet[0x10] = subyear;
            packet[0x11] = now.getDay();
            packet[0x12] = now.getDate();
            packet[0x13] = now.getMonth();
            packet[0x18] = parseInt(address[0]);
            packet[0x19] = parseInt(address[1]);
            packet[0x1a] = parseInt(address[2]);
            packet[0x1b] = parseInt(address[3]);
            packet[0x1c] = port & 0xff;
            packet[0x1d] = port >> 8;
            packet[0x26] = 6;
            var checksum = 0xbeaf;

            for (var i = 0; i < packet.length; i++) {
                checksum += packet[i];
            }
            checksum = checksum & 0xffff;
            packet[0x20] = checksum & 0xff;
            packet[0x21] = checksum >> 8;

            cs.sendto(packet, 0, packet.length, 80, '255.255.255.255');

        });

        cs.on("message", (msg, rinfo) => {
            var host = rinfo;
            var mac = msg.slice(0x3a, 0x40).reverse().toString('hex');
            var devName = msg.slice(0x40, -1).toString('utf8');
            var devCloud = msg.slice(-1).toString('hex') % 2 == 1;
            var fullmsg = msg;

            var devtype = msg[0x34] | msg[0x35] << 8;
            if (!this.devices) {
                this.devices = {};
            }

            if (!this.devices[mac]) {
                this.devices[mac] = { "type": devtype, "address": host.address, "name": devName, "cloud": devCloud, "fullmsg": fullmsg };
            }
        });

        cs.bind();

    }

    setup(ssid, password, security_mode) {
        //Security mode options are (0 - none, 1 = WEP, 2 = WPA1, 3 = WPA2, 4 = WPA1/2)

        var payload = Buffer.alloc(0x88, 0);
        payload[0x26] = 0x14  // This seems to always be set to 14
        // Add the SSID to the payload
        var ssid_start = 68;
        var ssid_length = 0;

        for (var letter in ssid) {
            payload[(ssid_start + ssid_length)] = letter.charCodeAt(0);
            ssid_length += 1;
        }
        // Add the WiFi password to the payload
        var pass_start = 100
        var pass_length = 0
        for (var letter in password) {
            payload[(pass_start + pass_length)] = letter.charCodeAt(0);
            pass_length += 1;
        }

        payload[0x84] = ssid_length;  // Character length of SSID
        payload[0x85] = pass_length; // Character length of password
        payload[0x86] = security_mode;  // Type of encryption (00 - none, 01 = WEP, 02 = WPA1, 03 = WPA2, 04 = WPA1 / 2)

        var checksum = 0xbeaf;
        for (var i in payload.length) {
            checksum += payload[i];
            checksum = checksum & 0xffff;
        }

        payload[0x20] = checksum & 0xff;// Checksum 1 position
        payload[0x21] = checksum >> 8;// Checksum 2 position

        var cs = dgram.createSocket({ type: 'udp4', reuseAddr: true });
        cs.on('listening', function () {
            cs.setBroadcast(true);
            cs.sendto(payload, 0, payload.length, 80, '255.255.255.255');
        });
        cs.bind();
    }
}
module.exports = Broadlink;
