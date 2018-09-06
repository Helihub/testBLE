document.addEventListener('deviceready', onDeviceReady, false);
var serviceUUID         = "713D0000-503E-4C75-BA94-3148F18D941E";
var vibNum_charUUID     = "713D0001-503E-4C75-BA94-3148F18D941E";
var maxFreq_charUUID    = "713D0002-503E-4C75-BA94-3148F18D941E";
var toWrite_charUUID    = "713D0003-503E-4C75-BA94-3148F18D941E";

var connectedDevice;
var vibNum;
var maxFreq;

var audioplayer;


function onDeviceReady() {
    //TODO check navigation on
    changeStatus("Status: Ready to scan!", 'green', "device ready");
    $('#deviceList :not(:first-child)').empty();
    connectedDevice = undefined;
    vibNum = undefined;
    maxFreq = undefined;
    audioplayer = document.getElementById("audioplayer");
}

// ASCII only
function stringToBytes(string) {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}

// ASCII only
function bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}



//Chnage the for the user to read and send a console message
function changeStatus(message, color, consoleMessage) {
    console.log(JSON.stringify(consoleMessage));
    $("#status").html(message);
    $("#status").css("background-color", color);
}

function startBLEscan() {
    $('#deviceList :not(:first-child)').empty();
    ble.isEnabled(bleEnabled, bleDisabled);
}

function stopBLEscan() { //TODO timer?
    ble.isEnabled(
        function () {
            ble.stopScan(
                function () { changeStatus("Scan stopped", '#000', "stopscan"); },
                function () { changeStatus("Scan could not be turned off", 'red', "Scan stop error"); })    //FAIL to stop scan
        },
        bleDisabled);
}

function bleDisabled() {
    changeStatus("Please turn on your Bluetooth", '#000', "BLE disable");
}

// BLE is enabled, start scan for 10 seconds.
function bleEnabled() {
    changeStatus("Start the scan...",'#000', "scan starts");
    ble.startScan([],
        list,
        function () { changeStatus("Scan failed", 'red', "fail scan"); }                                    //FAIL to scan
    );                                                                    
}

function list(device) {
    console.log(JSON.stringify(device));
    var lable = (!(device.name)) ? device.id : device.name;
    $('#deviceList').append('<li onclick="startConnect(this.id)" id="' + device.id + '">' + lable + '</li>');
}

function startDisconnect() {
    if (!connectedDevice) {
        changeStatus("No connection!", '#000', "cannot disconnect, no device");
    } else {
        ble.disconnect(connectedDevice.id,
            succesDisconnet,
            function () { changeStatus("Disconnection failed", 'red', "fail to disconnect") }               //FAIL to disconnect
        ); 
    }
}

function succesDisconnet() {
    changeStatus("Disconnected", '#000', "disconnect succes");
    onDeviceReady();
}

function startConnect(id) {
    stopBLEscan();
    console.log(JSON.stringify("to connet with " + id));
    //$('#deviceList:not()').empty();
    ble.connect(id,
        connectSuccess,
        function () { changeStatus("Connection Fail!", 'red', "fail to connet with ble.connect") }          //FAIL to connect
    );                
}

function connectSuccess(device) {
    connectedDevice = device;
    setInfo(vibNum_charUUID, vibNum);
    setInfo(maxFreq_charUUID, maxFreq);
    changeStatus("Connected!", '#000', "connect: " + JSON.stringify(device));
    //eig muss doThings hier hin
}

function setInfo(charUUID, info) {
    console.log("start read " + connectedDevice.id);
    ble.read(connectedDevice.id, serviceUUID, charUUID,
        function (rawData) {
            info = parseInt(bytesToString(rawData).charCodeAt(0));
            console.log(Number.isInteger(info) + ", info: " + info);
            doThings();
        },
        function () { console.log("fail to read"); });                                                      //FAIL to read
}

function doThings() {
    if (!Number.isInteger(vibNum)) {
        console.log("gleich returne");
        return;
    }
    var data = new Uint8Array(vibNum);
    for (i = 0; i < vibNum; i++) {
        data[i] = 0x66;
    }
    console.log("start write");
    //ble.write(connectedDevice.id, serviceUUID, toWrite_charUUID, data.buffer, succ, writefail);
    ble.writeWithoutResponse(connectedDevice.id, serviceUUID, toWrite_charUUID, data.buffer, succ, writefail);
}

function writefail() {
    console.log("fail to write");
}

function succ() {
    console.log("suss write, now here...");
}

function playMusic() {
    audioplayer.play();
}

function stopMusic() {
    audioplayer.load(); 
}