module.exports = function (RED) {
    var Broadlink = require("./Broadlink.js");
    function NodeDevice(n) {
        RED.nodes.createNode(this, n);
        this.mac = n.mac.match(/[0-9A-Fa-f]{2}/g) != null ? new Buffer(n.mac.match(/[0-9A-Fa-f]{2}/g).map(function (num) { return parseInt(num, 16); })) : null;
        this.host = n.host;
        this.folder = n.folder;
    }
    RED.nodes.registerType("rmdevice2", NodeDevice);


    try{
        var RM = require("./RM.js");
        function broadlinkReceiverNode(config) {
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
                var rmTimeout = setTimeout( function() {
                    if (typeof (msg.payload) != "object") { msg.payload = { "timeout": "true" }; }
                    clearInterval(innterval);
                    node.warn("Broadlink Timeout Received - Closing Device Connection");
                    node.status({fill:"grey",shape:"dot",text:"Connection Closed - Timeout"});
                    _device.cs.close();
                    _device = null;
                    node.send(msg);
                }, 30000); // 30 seconds wait for response from device
                // ---
                _device.auth();

                var innterval;
                var rmRecInterval;
    /*             _device.on("temperature", (temp) => {
                    if (typeof (msg.payload) != "object") { msg.payload = {}; }
                    msg.payload.temperature = temp;
                    node.send(msg);
                }); */
                _device.on("data", (temp) => {
                    if (typeof (msg.payload) != "object") { msg.payload = {}; }
                    msg.payload.data = temp;
                    node.status({fill:"green",shape:"dot",text:"Data Received"});
                    node.send(msg);
                    clearInterval(innterval);
                    node.log("Broadlink Data Received within timeout - Closing Device Connection");
                    node.status({fill:"green",shape:"dot",text:"Connection Closed - Data Received"});
                    _device.cs.close();
                    _device = null;
                    clearTimeout(rmTimeout);
                });
    /*             _device.on("rawRFData", (temp) => {
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
                }); */
                _device.on("deviceReady", (devm) => {

                    var _config = { action: config.action, remote: config.remote, button: config.button, fix: config.fix, poll: config.poll, RFSweep: config.RFSweep, data: undefined };//, repeat: config.repeat _config.repeat = msg.payload.repeat; 
                    //if (_config.action == "_msg_") { _config.action = msg.payload.action; _config.remote = msg.payload.remote; _config.button = msg.payload.button; _config.fix = msg.payload.fix; _config.poll = msg.payload.poll; _config.RFSweep = msg.payload.RFSweep; _config.data = (msg.payload.data != undefined && typeof (msg.payload.data) == "string") ? JSON.parse(msg.payload.data) : ((msg.payload.data != undefined && typeof (msg.payload.data) == "object") ? msg.payload.data : undefined); }
                    if (msg.payload == "stop") {
                        //clearInterval(rmRecInterval);
                        clearInterval(innterval);
                        node.warn("Stop Request Received - Closing Device Connection");
                        node.status({fill:"grey",shape:"dot",text:"Connection Closed - Stop Requested"});
                        _device.cs.close();
                        _device = null;
                        msg.payload = { "timeout": "stop" };
                        node.send(msg);
                    }
                    else {
                        if (_config.RFSweep.toString() == "false") {
                            _device.enterLearning();
                            //rmRecInterval = setInterval(function () { this.restart(); }, 30000); 
                            //NOTE: Broadlink learning mode times out after 30 seconds
                            node.status({fill:"blue",shape:"ring",text:"Entering Receiver Mode"});
                            node.warn("Please tap the remote button within 30 seconds.");
                            innterval = setInterval(function () { _device.checkData(); }, _config.poll);
                        }
                        else {
                            _device.enterRFSweep();
                            node.warn("Please keep long press on the remote button until scan finishes.");
                            innterval = setInterval(function () { _device.checkRFData(); }, 1000);
                        }

                    }
                });
            });

        }
    }
    catch(err){
        node.err(err);
    }
    RED.nodes.registerType("RMReceiver", broadlinkReceiverNode);

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