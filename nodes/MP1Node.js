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
    RED.nodes.registerType("mp1device", NodeDevice);


    var MP1 = require("./MP1.js");
    function broadlinkNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function (msg) {
            var conf = RED.nodes.getNode(config.device);
            var _device;
            if (conf != null && conf != undefined && conf != "") {
                var _device = new MP1({ address: conf.host, port: 80 }, conf.mac);
            }
            else {
                var _device = new MP1({ address: msg.payload.host, port: 80 }, new Buffer(msg.payload.mac.replace(':', '').replace('-', '').match(/[0-9A-Fa-f]{2}/g).map(function (num) { return parseInt(num, 16); })));
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
            _device.on("deviceReady", (devm) => {
                var _config = { action: config.action, state: config.state, s1: config.s1, s2: config.s2, s3: config.s3, s4: config.s4 };
                if (_config.action == "_msg_") { _config.action = msg.payload.action; _config.state = msg.payload.state; _config.s1 = msg.payload.s1; _config.s2 = msg.payload.s2; _config.s3 = msg.payload.s3; _config.s4 = msg.payload.s4; }

                switch (_config.action) {
                    case "getState":
                        try {
                            _device.check_power_raw();
                        }
                        catch(err) {
                            console.log(err);
                            node.status({fill:"red",shape:"ring",text:"Error - See Console Log"});
                        }
                        break;
                    case "setState":
                        try {
                            _device.set_power_mask(
                            parseInt(
                                [
                                    Number(typeof (_config.s4) != 'boolean' ? JSON.parse(_config.s4) : _config.s4),
                                    Number(typeof (_config.s3) != 'boolean' ? JSON.parse(_config.s3) : _config.s3),
                                    Number(typeof (_config.s2) != 'boolean' ? JSON.parse(_config.s2) : _config.s2),
                                    Number(typeof (_config.s1) != 'boolean' ? JSON.parse(_config.s1) : _config.s1)
                                ].join(''), 2),
                            typeof (_config.state) != 'boolean' ? JSON.parse(_config.state) : _config.state)
                            }
                        catch(err) {
                            console.log(err);
                            node.status({fill:"red",shape:"ring",text:"Error - See Console Log"});
                        }
                        if (typeof (msg.payload) != "object") { msg.payload = {}; }
                        msg.payload.state = _config.state;
                        msg.payload.status = "OK";
                        //node.send(msg);
                        break;
                }
            });
        });
    }
    RED.nodes.registerType("MP1", broadlinkNode);
}
