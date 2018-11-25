module.exports = function (RED) {
    var Broadlink = require("./Broadlink.js");
    function NodeDevice(n) {
        RED.nodes.createNode(this, n);
        this.mac = n.mac.match(/[0-9A-Fa-f]{2}/g) != null ? new Buffer(n.mac.match(/[0-9A-Fa-f]{2}/g).map(function (num) { return parseInt(num, 16); })) : null;
        this.host = n.host;

        /*var node = this;
        var b = new Broadlink();
        b.discover();
        setTimeout(function () {
            if (b.devices[n.mac] !== undefined) node.host = b.devices[n.mac].address;
        }, 3000);*/
    }
    RED.nodes.registerType("a1device", NodeDevice);

    var A1 = require("./A1.js");
    function broadlinkNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function (msg) {
            var conf = RED.nodes.getNode(config.device);
            var _device;
            if (conf != null && conf != undefined && conf != "") {
                var _device = new A1({ address: conf.host, port: 80 }, conf.mac);
            }
            else {
                var _device = new A1({ address: msg.payload.host, port: 80 }, new Buffer(msg.payload.mac.replace(':', '').replace('-', '').match(/[0-9A-Fa-f]{2}/g).map(function (num) { return parseInt(num, 16); })));
            }
            // --- Fix for UDP ports not being closed
            setTimeout( function() {
                if (typeof (msg.payload) != "object") { msg.payload = {}; }
                _device.cs.close();
                _device = null;
            }, 3000); // 3 seconds wait for response from device
            // ---
            _device.auth();
            _device.on("data", (temp) => {
                if (typeof (msg.payload) != "object") { msg.payload = {}; }
                msg.payload.temperature = temp.temperature;
                msg.payload.humidity = temp.humidity;
                msg.payload.light = ['Dark', 'Low', 'Normal', 'High'][temp.light];
                msg.payload.air_quality = ['Perfect', 'Good', 'Normal','Bad'][temp.air_quality];
                msg.payload.noise = ['Silent', 'Normal', 'High', 'Extreme'][temp.noise];
                msg.raw = temp;
                node.send(msg);
            });
            _device.on("deviceReady", (devm) => {
                _device.check_sensors();
            });
        });
    }
    RED.nodes.registerType("A1", broadlinkNode);
}
