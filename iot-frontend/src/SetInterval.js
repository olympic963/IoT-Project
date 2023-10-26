import React, { useState, useEffect } from 'react';
import './SetInterval.css';
import axios from 'axios';
//import socket from './SocketConnection';
import io from 'socket.io-client';
// const socket = io('https://wf550l3h-3000.asse.devtunnels.ms/');
const socket = io('http://localhost:3000/');
function SetInterval() {
  const [interval, setInterval] = useState('');
  const [currentInterval, setCurrentInterval] = useState(null); 
  const [previousInterval, setPreviousInterval] = useState(null);
  useEffect(() => {
    const fetchSetInterval = async () => {
      try {
          //const response = await axios.get('https://wf550l3h-3000.asse.devtunnels.ms/interval/recently');
          const response = await axios.get('http://localhost:3000/interval/recently');
          const data = response.data[0];
          setCurrentInterval(data.interval_value);
      } catch (error) {
          console.error('Could not fetch interval value', error);
      }
    };
    fetchSetInterval();
    socket.on('currentInterval', (data) => {
      if(data !== previousInterval ){
        setCurrentInterval(data);
        setPreviousInterval(data);
        alert("Set interval complete");
      }
    });
    return () => {
      socket.off('currentInterval');
    };
  }, [previousInterval]);
  const handleSubmit = (e) => {
    e.preventDefault();
    socket.emit('setInterval', interval);
  };

  return (
    <div className='itv'>
      <h2>Set ESP32 Response Interval</h2>
      <p>Current Interval: {currentInterval}</p> 
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          placeholder="Enter interval in seconds"
        />
        <button className='set_interval' type="submit">Set Interval</button>
      </form>
    </div>
  );
}

export default SetInterval;
