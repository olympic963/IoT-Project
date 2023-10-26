import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DeviceControlAndStatus.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
//import socket from './SocketConnection';
 import io from 'socket.io-client';
// const socket = io('https://wf550l3h-3000.asse.devtunnels.ms/');
const socket = io('http://localhost:3000/');
function DeviceControlAndStatus() {
  const [device1Status, setDevice1Status] = useState(null);
  const [device2Status, setDevice2Status] = useState(null);
  const [device3Status, setDevice3Status] = useState(null);
  const [warning , setWarning] = useState(false);
  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
          //const response = await axios.get('https://wf550l3h-3000.asse.devtunnels.ms/device/recently');
          const response = await axios.get('http://localhost:3000/device/recently');
          const data = response.data[0];
          setDevice1Status(data.device1St);
          setDevice2Status(data.device2St);
          setDevice3Status(data.device3St);
      } catch (error) {
          console.error('Could not fetch device data', error);
      }
    };
    fetchDeviceData();
    socket.on('deviceStatus', (data) => {
        const deviceId = Number(data.device_id);
        if (deviceId === 1) {
          setDevice1Status(data.state);
        }
        if (deviceId === 2) {
          setDevice2Status(data.state);
        } 
        if (deviceId === 3) {
          setDevice3Status(data.state);
        } 
    });
    socket.on('newData', (data) => {
      if (data.gas > 70) {
        setWarning(true);
        setTimeout(() => setWarning(false), 10000);
      }
      // else{
      //   setWarning(false);
      // }      
    });
    return () => {
      socket.off('deviceStatus');
    };
  }, []);

  //const handleDeviceControl = (status, deviceId ) => {
  //   //axios.post('http://localhost:3000/device', { status, deviceId });
  //   axios.post('https://wf550l3h-3000.asse.devtunnels.ms/device', { status, deviceId });
  // };
  const handleDeviceControl = (status, deviceId) =>{
    socket.emit('deviceControl', {status, deviceId});
  };

  return (
    <div className='deviceControl'>
    <div className={`device1 ${warning ? 'warning' : ''}`}> 
      <div className="device-info">
        <i className={`fa ${device1Status === 'OFF' ? 'fa-solid' : 'fa-regular'} fa-lightbulb device-icon`}></i>
        <p>LED </p>
      </div>
      <div className="device-buttons">
        <button className={device1Status === 'ON' ? 'on1 active' : 'on1'} onClick={() => handleDeviceControl('on',1)}>
          ON
        </button>
        <button className={device1Status === 'OFF' ? 'off1 active' : 'off1'} onClick={() => handleDeviceControl('off',1)}>
          OFF
        </button>
      </div>  
    </div>

    <div className={`device2 ${warning ? 'warning' : ''}`}> 
      <div className="device-info">
        <i className={`fa ${device2Status === 'OFF' ? 'fa-solid' : 'fa-regular'} fa-lightbulb device-icon`}></i>
        <p>LED </p>
      </div>
      <div className="device-buttons">
        <button className={device2Status === 'ON' ? 'on2 active' : 'on2'} onClick={() => handleDeviceControl('on',2)}>
          ON
        </button>
        <button className={device2Status === 'OFF' ? 'off2 active' : 'off2'} onClick={() => handleDeviceControl('off',2)}>
          OFF
        </button>
      </div>
    </div>

    <div className={`device3 ${warning ? 'warning' : ''}`}>
      <div className="device-info">
        <i className={`fa-solid fa-fan device-icon ${device3Status === 'ON' ? 'rotating' : ''}`}></i>
        <p>FAN</p>
      </div>
      <div className="device-buttons">
        <button className={device3Status === 'ON' ? 'on3 active' : 'on3'} onClick={() => handleDeviceControl('on',3)}>
          ON
        </button>
        <button className={device3Status === 'OFF' ? 'off3 active' : 'off3'} onClick={() => handleDeviceControl('off',3)}>
          OFF
        </button>
      </div>  
    </div>
  </div>
  );
}
export default DeviceControlAndStatus;
