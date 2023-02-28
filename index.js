const axios = require('axios');
const BluetoothSerialPort = require('bluetooth-serial-port');
const OBDReader = require('obd-parser');

const bluetoothSerialPort = new BluetoothSerialPort.BluetoothSerialPort();
const obdReader = new OBDReader();

// API endpoint to convert trouble codes to human-readable issues
const API_ENDPOINT = 'https://api.carsxe.com/diagnostic-trouble-codes';

bluetoothSerialPort.on('found', (address, name) => {
  console.log(`Found OBD2 device: ${name} (${address})`);
  bluetoothSerialPort.findSerialPortChannel(address, (channel) => {
    bluetoothSerialPort.connect(address, channel, () => {
      obdReader.on('dataReceived', (data) => {
        console.log('Data received:', data);
        if (data.pid === '03') { // Check if we received a trouble code response
          // Convert the trouble codes to human-readable issues
          const codes = data.value.split(',');
          convertCodesToIssues(codes);
        } else if (data.pid === '0131') { // Check if we received a mileage response
          const mileage = parseFloat(data.value);
          const unit = data.unit;
          console.log(`Current mileage: ${mileage} ${unit}`);
        } else if (data.pid === '05') { // Check if we received a fuel consumption response
          const litersPer100km = parseFloat(data.value);
          console.log(`Liters per 100km: ${litersPer100km}`);
        }
      });
      obdReader.connect(bluetoothSerialPort);

      obdReader.write('ATZ\r'); // Reset the OBD2 device
      obdReader.write('ATE0\r'); // Disable echo
      obdReader.write('ATSP0\r'); // Set protocol to auto
      obdReader.write('0100\r'); // Request supported PIDs
      obdReader.write('03\r'); // Scan for trouble codes
      obdReader.write('010C\r'); // Engine RPM
      obdReader.write('010D\r'); // Vehicle speed
      obdReader.write('0131\r'); // Get current mileage
      obdReader.write('05\r'); // Get fuel consumption

      setInterval(() => {
        obdReader.write('010C\r'); // Engine RPM
        obdReader.write('010D\r'); // Vehicle speed
        obdReader.write('05\r'); // Get fuel consumption
      }, 1000); // Scan for live data every second
    });
  });
});

bluetoothSerialPort.inquire();
