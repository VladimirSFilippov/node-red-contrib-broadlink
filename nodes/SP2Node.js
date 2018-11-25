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
    RED.nodes.registerType("sp2device", NodeDevice);


    var SP2 = require("./SP2.js");
    function broadlinkNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function (msg) {
            var conf = RED.nodes.getNode(config.device);
            var _device;
            if (conf != null && conf != undefined && conf != "") {
                var _device = new SP2({ address: conf.host, port: 80 }, conf.mac);
            }
            else {
                var _device = new SP2({ address: msg.payload.host, port: 80 }, new Buffer(msg.payload.mac.replace(':', '').replace('-', '').match(/[0-9A-Fa-f]{2}/g).map(function (num) { return parseInt(num, 16); })));
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
                msg.payload.state = temp;
                node.send(msg);
            });
            _device.on("energy", (temp) => {
                if (typeof (msg.payload) != "object") { msg.payload = {}; }
                msg.payload = temp;
                node.send(msg);
            });
            _device.on("deviceReady", (devm) => {
                var _config = { action: config.action, state: config.state };
                if (_config.action == "_msg_") { _config.action = msg.payload.action; _config.state = msg.payload.state;}

                switch (_config.action) {
                    case "getState":
                        _device.check_power();
                        break;
                    case "setState":
                        if (typeof (_config.state) != "boolean") {
                            _device.set_power(JSON.parse(_config.state));
                        }
                        else {
                            _device.set_power(_config.state);
                        }
                        if (typeof (msg.payload) != "object") { msg.payload = {}; }
                        msg.payload.state = _config.state;
                        msg.payload.status = "OK";
                        node.send(msg);
                        break;
                    case "getEnergy":
                        _device.get_energy();
                        break;
                }
            });
        });
    }
    RED.nodes.registerType("SP2", broadlinkNode);
}
