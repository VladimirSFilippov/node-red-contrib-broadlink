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
    RED.nodes.registerType("s1cdevice", NodeDevice);

    var S1C = require("./S1C.js");
    function broadlinkNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function (msg) {
            var conf = RED.nodes.getNode(config.device);
            var _device;
            if (conf != null && conf != undefined && conf != "") {
                var _device = new S1C({ address: conf.host, port: 80 }, conf.mac);
            }
            else {
                var _device = new S1C({ address: msg.payload.host, port: 80 }, new Buffer(msg.payload.mac.replace(':', '').replace('-', '').match(/[0-9A-Fa-f]{2}/g).map(function (num) { return parseInt(num, 16); })));
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
                msg.payload = temp;
                node.send(msg);
            });
            _device.on("alarm_status", (temp) => {
                if (typeof (msg.payload) != "object") { msg.payload = {}; }
                msg.payload = temp;
                node.send(msg);
            });
            _device.on("triggerd_status", (temp) => {
                if (typeof (msg.payload) != "object") { msg.payload = {}; }
                msg.payload = temp;
                node.send(msg);
            });
            _device.on("deviceReady", (devm) => {
                //_device.check_sensors();
                //_device.get_sensors_status();
                var _config = { action: config.action, state: config.state, notification: config.notification, alarm: config.alarm };
                if (_config.action == "_msg_") { _config.action = msg.payload.action; _config.state = msg.payload.state; _config.notification = msg.payload.notification; _config.alarm = msg.payload.alarm; }

                switch (_config.action) {
                    case "get_sensors_status":
                        _device.get_sensors_status();
                        break;
                    case "get_alarm_status":
                        _device.get_alarm_status();
                        break;
                    case "get_trigger_status":
                        _device.get_trigger_status();
                        break;
                    case "set_alarm_status":
                        _device.set_alarm_status(_config.state, _config.notification, _config.alarm);
                        node.send(msg);
                        break;
                    //case "setState":
                    //    if (typeof (_config.state) != "boolean") {
                    //        _device.set_power(JSON.parse(_config.state));
                    //    }
                    //    else {
                    //        _device.set_power(_config.state);
                    //    }
                    //    if (typeof (msg.payload) != "object") { msg.payload = {}; }
                    //    msg.payload.state = _config.state;
                    //    msg.payload.status = "OK";
                    //    node.send(msg);
                    //    break;
                }
            });
        });
    }
    RED.nodes.registerType("S1C", broadlinkNode);
}
