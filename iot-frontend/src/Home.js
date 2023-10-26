import React from 'react';
import SensorData from './SensorData';
import SensorDataChart from './SensorDataChart';
import DeviceControlAndStatus from './DeviceControlAndStatus';
import "./Home.css"
function Home() {
  return (
    <div className="home">
      <div className="sensordata">     
        <SensorData />
      </div>
      <div className="chart-and-controls">
        <div className="chart">
          <SensorDataChart />
        </div>
        <div className="controls">
          <DeviceControlAndStatus />
        </div>
      </div>
    </div>
  );
}

export default Home;
