document.addEventListener('deviceready', onDeviceReady, false);
var serviceUUID = "713D0000-503E-4C75-BA94-3148F18D941E";
var vibNum_charUUID = "713D0001-503E-4C75-BA94-3148F18D941E";
var maxFreq_charUUID = "713D0002-503E-4C75-BA94-3148F18D941E";
var toWrite_charUUID = "713D0003-503E-4C75-BA94-3148F18D941E";

var connectedDevice;
var vibNum;
var maxFreq;

var audioplayer;

var isBluetoothMode;

var backgroundcolor = '#575757';
var alertcolor = 'red';

function onDeviceReady() {
    isBluetoothMode = $("#flip-checkbox-3").prop("checked");
    if (!isBluetoothMode) {
        changeStatus("Smartphone Mode", backgroundcolor, "No Bluetooth");
        return;
    }

    var location = isLocationEnabled();
    if (location == "error") {
        setMode(false);
        return;
    }

    if (!location) {
        changeStatus("For this app you have to turn on your location tracking", backgroundcolor, "location disabled");
        setMode(false);
    } else {
        changeStatus("Status: Ready to scan!", 'green', "device ready");
        //$('#deviceList :not(:first-child)').empty();
        connectedDevice = undefined;
        vibNum = undefined;
        maxFreq = undefined;
        audioplayer = document.getElementById("audioplayer");
    }
}

$(document).on("change", "#flip-checkbox-3", function (event, ui) {
    onDeviceReady();
});

function setMode(bluetoothMode) {
    isBluetoothMode = bluetoothMode;
    $("#flip-checkbox-3").prop("checked", bluetoothMode).flipswitch("refresh");
}

function isLocationEnabled() {
    console.log("frag nach location");
    cordova.plugins.diagnostic.isLocationEnabled(function (enable) {
        console.log("Location setting is " + (enabled ? "enabled" : "disabled"));
        return enabled;
    }, function (error) {
        changeStatus("Geolocation problems: " + error, alertcolor, console.error("The following error occurred: " + error));
        return "error";
    });
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

//Change the Status Label for the user to read and send a console message
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
                function () { changeStatus("Scan stopped", backgroundcolor, "stopscan"); },
                function () { changeStatus("Scan could not be turned off", alertcolor, "Scan stop error"); })    //FAIL to stop scan
        },
        bleDisabled);
}

function bleDisabled() {
    changeStatus("Please turn on your Bluetooth", backgroundcolor, "BLE disable");
}

// BLE is enabled, start scan for 10 seconds.
function bleEnabled() {
    changeStatus("Start the scan...", backgroundcolor, "scan starts");
    ble.startScan([],
        list,
        function () { changeStatus("Scan failed", alertcolor, "fail scan"); }                                    //FAIL to scan
    );                                                                    
}

function list(device) {
    console.log(JSON.stringify(device));
    var lable = (!(device.name)) ? device.id : device.name;
    $('#deviceList').append('<li onclick="startConnect(this.id)" id="' + device.id + '">' + lable + '</li>');
    $('#deviceList').listview("refresh");
}

function startDisconnect() {
    if (!connectedDevice) {
        changeStatus("No connection!", backgroundcolor, "cannot disconnect, no device");
    } else {
        ble.disconnect(connectedDevice.id,
            succesDisconnet,
            function () { changeStatus("Disconnection failed", alertcolor, "fail to disconnect") }               //FAIL to disconnect
        ); 
    }
}

function succesDisconnet() {
    changeStatus("Disconnected", backgroundcolor, "disconnect succes");
    onDeviceReady();
}

function startConnect(id) {
    stopBLEscan();
    console.log(JSON.stringify("to connet with " + id));
    //$('#deviceList:not()').empty();
    ble.connect(id,
        connectSuccess,
        function () { changeStatus("Connection Fail!", alertcolor, "fail to connet with ble.connect") }          //FAIL to connect
    );                
}

function connectSuccess(device) {
    connectedDevice = device;
    setInfo(vibNum_charUUID, vibNum);
    setInfo(maxFreq_charUUID, maxFreq);
    changeStatus("Connected!", backgroundcolor, "connect: " + JSON.stringify(device));
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