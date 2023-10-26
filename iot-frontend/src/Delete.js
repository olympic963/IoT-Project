import React, { useEffect } from 'react';
import './Delete.css';
//import socket from './SocketConnection';
 import io from 'socket.io-client';
// const socket = io('https://wf550l3h-3000.asse.devtunnels.ms/');
const socket = io('http://localhost:3000/');
function Delete() {
  useEffect(() => {
    socket.on('deleteRes', (message) => {
        if (message === 'Delete sensor history complete') {
            alert(message);
        }
        if (message === 'Delete device history complete') {
            alert(message);
        } 
      });
      return () => {
        socket.off('deleteRes');
      };
    }, []);
  const deleteReq = (req) =>{
    if(req === 'deleteSensorHistory')
    socket.emit('deleteReq', 'deleteSensorHistory');
    if(req === 'deleteDeviceHistory')
    socket.emit('deleteReq','deleteDeviceHistory');
  };
  return (
        <div className='Delete option'> 
          <div className="deleteBlock" onClick={() => deleteReq('deleteSensorHistory')}>Delete sensor history</div>
          <div className="deleteBlock" onClick={() => deleteReq('deleteDeviceHistory')}>Delete device history</div>
        </div>
  );
}
export default Delete;
