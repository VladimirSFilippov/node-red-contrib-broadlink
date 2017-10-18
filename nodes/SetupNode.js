module.exports = function (RED) {
    var Broadlink = require("./Broadlink.js");
    function broadlinkNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function (msg) {
            var b = new Broadlink();
            b.setup(config.ssid, node.credentials.password, config.security_mode);

            node.send(msg);
        });

    }
    RED.nodes.registerType("Setup", broadlinkNode, {
        credentials: {
            password: { type: "password" }
        }
    });
}