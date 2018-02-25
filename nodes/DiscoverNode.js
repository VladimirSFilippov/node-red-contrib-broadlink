module.exports = function (RED) {
    var Broadlink = require("./Broadlink.js");
    function broadlinkNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.on('input', function (msg) {
            node.status({fill:"blue",shape:"ring",text:"Discovering Devices"});
            var b = new Broadlink();
            b.discover();
            setTimeout(function () {
                var dev = [];

                function getType(devtype) {
                    if (devtype == 0) return 'SP1';
                    else if (devtype == 0x2711) return 'SP2';
                    else if (devtype == 0x2719 || devtype == 0x7919 || devtype == 0x271a || devtype == 0x791a) return 'Honeywell SP2';
                    else if (devtype == 0x2720) return 'SPMini';
                    else if (devtype == 0x753e) return 'SP3';
                    else if (devtype == 0x2728) return 'SPMini2';
                    else if (devtype == 0x2733 || devtype == 0x273e) return 'OEM branded SPMini';
                    else if (devtype >= 0x7530 && devtype <= 0x7918) return 'OEM branded SPMini2';
                    else if (devtype == 0x2736) return 'SPMiniPlus';
                    else if (devtype == 0x2712) return 'RM2';
                    else if (devtype == 0x2737) return 'RM Mini';
                    else if (devtype == 0x273d) return 'RM Pro Phicomm';
                    else if (devtype == 0x2783) return 'RM2 Home Plus';
                    else if (devtype == 0x277c) return 'RM2 Home Plus GDT';
                    else if (devtype == 0x272a) return 'RM2 Pro Plus';
                    else if (devtype == 0x2787) return 'RM2 Pro Plus2';
                    else if (devtype == 0x278b) return 'RM2 Pro Plus BL';
                    else if (devtype == 0x278f) return 'RM Mini Shate';
                    else if (devtype == 0x2714) return 'A1';
                    else if (devtype == 0x4EB5) return 'MP1';
                    else if (devtype == 0x2722) return 'S1(SmartOne Alarm Kit)';
                }

                node.status({fill:"red",shape:"ring",text:"Found x Devices"});
                for (var device in b.devices) {
                    dev.push(
                        {
                            mac: device,
                            ip: b.devices[device].address,
                            type: getType(b.devices[device].type)
                        });
                }
                msg.payload = dev;
                node.send(msg);
            }, 3000);//timeout
        });

    }
    RED.nodes.registerType("Discover", broadlinkNode);
}
