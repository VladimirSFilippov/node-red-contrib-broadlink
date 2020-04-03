
var Device = require("./Device.js");
class S1C extends Device {
    constructor(host, mac, devType = "272a",  timeout = 10) {
        super(host, mac, devType, timeout);

        this.on("payload", (err, payload) => {
            var param = payload[0];

            switch (param) {
                case 6: //get from get_sensors_status
                    var count = payload[4];
                    var j, k, sensors;
                    sensors = [];
                    for (j = 0; j < count; j++) {
                        var sensor = {};
                        var sensorType = payload[(j * 83) + 3 + 6];
                        switch (sensorType) {
                            case 33:
                                sensor.type = "Motion Sensor";
                                break;
                            case 49:
                                sensor.type = "Door Sensor";
                                break;
                            case 0x91:
                                sensor.type = "Key Fob";
                                break;
                        }
                        /*
                            1	is open (motion)
                            2	tamper is disassembled
                            3	is low battery?
                            4	is energy save?
                        */
                        var status = payload[(j * 83) + 6];
                        if (sensorType != 0x91) { // if not Key Fob

                            var states = {
                                33: { "false": "No Person", "true": "Person Detected" },
                                49: { "false": "Door closed", "true": "Door opened" }
                            }

                            const isOpen = 1 << 4;
                            const isDisassembled = 1 << 5;
                            const isLowBattery = 1 << 6;
                            const isEnergySave = 1 << 7;



                            sensor.status = {
                                state: states[sensorType][((status & isOpen) != 0).toString()],
                                isDisassembled: (status & isDisassembled) != 0,
                                isLowBattery: (status & isLowBattery) != 0,
                                isEnergySave: (status & isEnergySave) != 0,
                            }
                        }
                        else {
                            sensor.status = status;
                            switch (status) {
                                case 16:
                                    sensor.status = "Disarm";
                                    break;
                                case 32:
                                    sensor.status = "Arm when away";
                                    break;
                                case 64:
                                    sensor.status = "Arm at home";
                                    break;
                                case 128:
                                    sensor.status = "SOS";
                                    break;
                                default:
                                    sensor.status = status;
                                    break;
                            }
                        }






                        sensor.name = Buffer.alloc(22, 0);
                        for (var i = 4; i < 26; i++) {
                            sensor.name[i - 4] = payload[(j * 83) + i + 6]
                        }
                        sensor.name = sensor.name.toString('utf8').replace(/\0/g, '');

                        var sensorSerial = Buffer.alloc(4, 0);
                        for (var i = 26; i < 30; i++) {
                            sensorSerial[i - 26] = payload[(j * 83) + i + 6]
                        }
                        sensor.serial = unescape(encodeURIComponent(sensorSerial))
                            .split('').map(function (v) {
                                return v.charCodeAt(0).toString(16)
                            }).join('')

                        // console.log("sensor #" + (j+1) + " name: " + sensor.name)
                        // console.log("sensor #" + (j+1) + " type: " + sensor.type)
                        // console.log("sensor #" + (j+1) + " status: " + sensor.status);
                        // console.log("sensor #" + (j+1) + " serial: " + sensor.serial)



                        sensors.push(sensor);
                    }
                    var results = sensors;/*{
                        'count': count,
                        'sensors': sensors,
                        'raw': payload
                    }*/

                    this.emit("data", results);
                    break;
                //case 3:
                //    console.log('case 3');
                //    break;
                //case 4:
                //    console.log('case 4');
                //    break;



                case 0x12:
                    // for (i=0;i<payload.length;i++){
                    //     console.log("payload["+i+"]  "+payload[i]);
                    // }
                    var status;
                    switch (payload[4]) {
                        case 0:
                            status = "Disarm";
                            break;
                        case 1:
                            status = "Part-Arm";
                            break;
                        case 2:
                            status = "Full-Arm";
                            break;
                    }
                    this.emit("alarm_status", status);
                    break;
                case 0x10:
                    var triggered = false;
                    for (var i = 1; i <= 16; i++) {
                        if (payload[i * 2 + 4] == 1) {
                            triggered = true;
                        };
                        //console.log("sensor "+ (i) +" - " + payload[i*2+4])
                    }
                    this.emit("triggerd_status", triggered);
                    break;
                case 0x11:
                    break;
            }








        });
    }
    check_sensors() {
        var packet = Buffer.alloc(16, 0);
        packet[0] = 1;
        this.sendPacket(0x6a, packet);
    }

    get_sensors_status() {
        //"""Returns the sensors state of the s1c"""
        var packet = Buffer.alloc(16, 0);
        packet[0] = 0x06
        this.sendPacket(0x6a, packet);
    }

    get_alarm_status() {
        var packet = Buffer.alloc(16, 0);
        packet[0] = 0x12
        this.sendPacket(0x6a, packet);
    }

    get_trigger_status() {
        var packet = Buffer.alloc(16, 0);
        packet[0] = 0x10
        this.sendPacket(0x6a, packet);
    }

    set_alarm_status(state, notification_sound, alarm_sound) {
        var packet = Buffer.alloc(16, 0);
        packet[0] = 0x11;
        switch (state) {
            case "full_arm":
                packet[4] = 0x02;
                break;
            case "part_arm":
                packet[4] = 0x01;
                break;
            case "disarm":
                packet[4] = 0x00;
                break;
        }
        if (!notification_sound) {
            packet[13] = 0x02;
        }
        if (!alarm_sound) {
            packet[10] = 0x01;
        }

        this.sendPacket(0x6a, packet);
    }
}
module.exports = S1C;