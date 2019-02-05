module.exports = function (RED) {
    var Broadlink = require("./Broadlink.js");
    function NodeDevice(n) {
        RED.nodes.createNode(this, n);
        this.mac = n.mac.match(/[0-9A-Fa-f]{2}/g) != null ? new Buffer(n.mac.match(/[0-9A-Fa-f]{2}/g).map(function (num) { return parseInt(num, 16); })) : null;
        this.host = n.host;
        this.folder = n.folder;

        //var node = this;
        //var b = new Broadlink();
        //b.discover();
        //setTimeout(function () {
        //    if (b.devices[n.mac] !== undefined) node.host = b.devices[n.mac].address;
        //}, 3000);
    }
    RED.nodes.registerType("rmdevice", NodeDevice);

    var RM = require("./RM.js");
    function broadlinkNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function (msg) {
            var conf = RED.nodes.getNode(config.device);
            var _device;
            if (conf != null && conf != undefined && conf != "") {
                var _device = new RM({ address: conf.host, port: 80 }, conf.mac);
            }
            else {
                var _device = new RM({ address: msg.payload.host, port: 80 }, new Buffer(msg.payload.mac.replace(':', '').replace('-', '').match(/[0-9A-Fa-f]{2}/g).map(function (num) { return parseInt(num, 16); })));
            }
            // --- Fix for UDP ports not being closed
            setTimeout( function() {
                if (typeof (msg.payload) != "object") { msg.payload = {}; }
                _device.cs.close();
                _device = null;
            }, 30000); // 30 seconds wait for response from device
            // ---
            _device.auth();

            var innterval;
            _device.on("temperature", (temp) => {
                if (typeof (msg.payload) != "object") { msg.payload = {}; }
                msg.payload.temperature = temp;
                node.send(msg);
            });
            _device.on("data", (temp) => {
                if (typeof (msg.payload) != "object") { msg.payload = {}; }
                msg.payload.data = temp;
                node.send(msg);
                clearInterval(innterval);
            });
            _device.on("rawRFData", (temp) => {
                if (typeof (msg.payload) != "object") { msg.payload = {}; }
                msg.payload.data = temp;
                clearInterval(innterval);

                node.warn("Please tap the remote button.");
                innterval = setInterval(function () { _device.checkRFData2(); }, 1000);
            });
            _device.on("rawRFData2", (temp) => {
                if (typeof (msg.payload) != "object") { msg.payload = {}; }
                msg.payload.data = temp;
                clearInterval(innterval);
                innterval = setInterval(function () { _device.checkData(); }, 1000);
            });
            _device.on("deviceReady", (devm) => {

                var _config = { action: config.action, remote: config.remote, button: config.button, fix: config.fix, RFSweep: config.RFSweep, data: undefined };//, repeat: config.repeat _config.repeat = msg.payload.repeat; 
                if (_config.action == "_msg_") { _config.action = msg.payload.action; _config.remote = msg.payload.remote; _config.button = msg.payload.button; _config.fix = msg.payload.fix; _config.RFSweep = msg.payload.RFSweep; _config.data = (msg.payload.data != undefined && typeof (msg.payload.data) == "string") ? JSON.parse(msg.payload.data) : ((msg.payload.data != undefined && typeof (msg.payload.data) == "object") ? msg.payload.data : undefined); }

                switch (_config.action) {
                    case "learn":
                        if (_config.RFSweep.toString() == "false") {
                            _device.enterLearning();
                            node.warn("Please tap the remote button within 30 seconds.");
                            innterval = setInterval(function () { _device.checkData(); }, 1000);
                        }
                        else {
                            _device.enterRFSweep();
                            node.warn("Please keep long press on the remote button until scan finishes.");
                            innterval = setInterval(function () { _device.checkRFData(); }, 1000);
                        }
                        break;
                    case "send":
                        if (_config.data === undefined) {
                            var options = {};
                            options['encoding'] = "utf8";
                            fs.readFile(conf.folder + "/jsonIrCode", options, function (err, data) {
                                if (err) {
                                } else {
                                }
                                var code = JSON.parse(data).filter(function (obj) { if (obj.buttonId == _config.button) { return true; } })[0].code;
                                if (_config.repeat != undefined) code[1] = _config.repeat;
                                var _code = [];
                                if (_config.fix == undefined) _config.fix = 1;
                                for (var i = 0; i < _config.fix; i++) {
                                    _code = _code.concat(code);
                                }


                                _device.sendData(new Buffer(_code));

                                if (typeof (msg.payload) != "object") { msg.payload = {}; }
                                msg.payload.remote = _config.remote;
                                msg.payload.button = _config.button;
                                msg.payload.status = "OK";
                                msg.payload.code = code;
                                msg.payload._code = _code;
                                msg.payload.f = _config.fix;
                                node.send(msg);
                            });
                        }
                        else {
                            var code = new Buffer(_config.data);
                            //if (_config.repeat != undefined && code[1] == 0) code[1] = _config.repeat;
                            _device.sendData(code);


                            if (typeof (msg.payload) != "object") { msg.payload = {}; }
                            msg.payload.data = _config.data;
                            msg.payload.status = "OK";
                            node.send(msg);
                        }
                        break;
                    case "temperature":
                        _device.checkTemperature();
                        break;
                }
            });
        });

    }
    RED.nodes.registerType("RM", broadlinkNode);

    RED.httpAdmin.get('/broadlink/scan', RED.auth.needsPermission('broadlink.read'), function (req, res) {
        var b = new Broadlink();
        b.discover();
        setTimeout(function () {
            res.send(b);
        }, 3000);
    });

    let fs = require("fs");
    RED.httpAdmin.get('/broadlink/:id/device', RED.auth.needsPermission('broadlink.read'), function (req, res) {
        var config = RED.nodes.getNode(req.params.id);
        if (config !== null) {
            var options = {};
            options['encoding'] = "utf8";

            fs.readFile(config.folder + "/jsonDevice", options, function (err, data) {
                if (err) {
                } else {
                }
                res.send(data);
            });
        }
    });
    RED.httpAdmin.get('/broadlink/:id/remote', RED.auth.needsPermission('broadlink.read'), function (req, res) {
        var config = RED.nodes.getNode(req.params.id);
        if (config !== null) {
            var options = {};
            options['encoding'] = "utf8";

            fs.readFile(config.folder + "/jsonSubIr", options, function (err, data) {
                if (err) {
                } else {
                }
                res.send(data);
            });
        }
    });
    RED.httpAdmin.get('/broadlink/:id/button', RED.auth.needsPermission('broadlink.read'), function (req, res) {
        var config = RED.nodes.getNode(req.params.id);
        if (config !== null) {
            var options = {};
            options['encoding'] = "utf8";

            fs.readFile(config.folder + "/jsonButton", options, function (err, data) {
                if (err) {
                } else {
                }
                res.send(data);
            });
        }
    });
}