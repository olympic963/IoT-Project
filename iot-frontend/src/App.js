import React, { useState } from 'react';
import './App.css';
import Home from './Home';
import StatisticsSensorData from './StatisticsSensorData';
import DeviceHistory from './DeviceHistory';
import UserInfo from './UserInfo';
function App() {
    const [activeComponent, setActiveComponent] = useState('Home'); 
    return (
        <div className="App">
            <div className='Header'>
                <div className='title' onClick={() => setActiveComponent('Home')}> 
                    IoT Dashboard 
                </div>
            </div>
            <div className="menu">
                <button className={activeComponent === 'Home' ? 'selected' : ''} onClick={() => setActiveComponent('Home')}> Home</button>
                <button className={activeComponent === 'Statistics' ? 'selected' : ''} onClick={() => setActiveComponent('Statistics')}>Sensor</button>
                <button className={activeComponent === 'DeviceHistory' ? 'selected' : ''}onClick={() => setActiveComponent('DeviceHistory')}>Device</button>
                <button className={activeComponent === 'UserInfo' ? 'selected' : ''} onClick={() => setActiveComponent('UserInfo')}>User</button>
            </div>
            <div className="display-component">
                {activeComponent === 'Home' && <Home />}
                {activeComponent === 'Statistics' && <StatisticsSensorData />}
                {activeComponent === 'DeviceHistory' && <DeviceHistory />}
                {activeComponent === 'UserInfo' && <UserInfo />}
            </div>
        </div>
    );
  }

export default App;