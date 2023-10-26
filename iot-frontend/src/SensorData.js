import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SensorData.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
//import socket from './SocketConnection';
import io from 'socket.io-client';
// const socket = io('https://wf550l3h-3000.asse.devtunnels.ms/');
const socket = io('http://localhost:3000/');
function SensorData() {
    const [temperature, setTemperature] = useState(null);
    const [humidity, setHumidity] = useState(null);
    const [brightness, setBrightness] = useState(null);
    const [gas, setGas] = useState(null);

    useEffect(() => {
        const fetchLatestData = async () => {
            try {
                //const response = await axios.get('https://wf550l3h-3000.asse.devtunnels.ms/data/latest');
                const response = await axios.get('http://localhost:3000/data/latest');
                const data = response.data[0];
                setTemperature(data.temperature);
                setHumidity(data.humidity);
                setBrightness(data.brightness);
                setGas(data.gas);
            } catch (error) {
                console.error('Could not fetch latest data', error);
            }
        };
        fetchLatestData();
        socket.on('newData', (data) => {
            setTemperature(data.temperature);
            setHumidity(data.humidity);
            setBrightness(data.brightness);
            setGas(data.gas);
        });

        return () => {
            socket.off('newData'); 
        };
    }, []);
    
    const getTextColor = (backgroundColor) => {
        const r = parseInt(backgroundColor.slice(4, backgroundColor.indexOf(',')), 10);
        const g = parseInt(backgroundColor.slice(backgroundColor.indexOf(',') + 1, backgroundColor.lastIndexOf(',')), 10);
        const b = parseInt(backgroundColor.slice(backgroundColor.lastIndexOf(',') + 1, backgroundColor.indexOf(')')), 10);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000' : '#fff';
    }

    const getTemperatureColor = (value) => {
        const min = 10;
        const max = 40;
        const clampedValue = Math.min(Math.max(value, min), max); 
        const percentage = (clampedValue - min) / (max - min);
        
        let red, green, blue;
    
        if (percentage < 1/3) {
            blue = 255 - (percentage * 3 * 255);
            red = 0;
            green = 255;
        } else if (percentage < 2/3) {
            red = (percentage - 1/3) * 3 * 255;
            green = 255;
            blue = 0;
        } else {
            red = 255;
            green = 255 - ((percentage - 2/3) * 3 * 255);
            blue = 0;
        }
        return `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;
    }

    const getHumidityColor = (value) => {
        const percentage = value / 100;
        return `rgb(${255 * (1 - percentage)}, ${255 * (1 - percentage)}, 255)`;
    }

    const getBrightnessColor = (value) => {
        const max = 50000;
        const percentage = value / max;   
        // Calculate the RGB values based on the percentage
        const red = Math.round(61 + 194 * percentage);
        const green = Math.round(61 + 194 * percentage);
        const blue = 0;  // blue remains 0 as mentioned
        return `rgb(${red}, ${green}, ${blue})`;
    }    
    const getGasColor = (value) => {
        const percentage = value / 100;
        return `rgb(${255 *  percentage}, ${255 *  percentage},  ${255 *  percentage})`;
    }

    return (
        <div className='sensor_data'>
            <div className="sensor_block temperature_block" 
                 style={{backgroundColor: getTemperatureColor(temperature), color: getTextColor(getTemperatureColor(temperature))}}>
                <p className='t'>
                    <i className="fa-solid fa-temperature-three-quarters"></i>
                    Nhiệt độ: {temperature} °C
                </p>
            </div>
            <div className="sensor_block humidity_block" 
                 style={{backgroundColor: getHumidityColor(humidity), color: getTextColor(getHumidityColor(humidity))}}>
                <p className='h'>
                    <i className="fas fa-tint"></i>
                    Độ ẩm: {humidity} %
                </p>
            </div>
            <div className="sensor_block brightness_block" 
                 style={{backgroundColor: getBrightnessColor(brightness), color: getTextColor(getBrightnessColor(brightness))}}>
                <p className='b'>
                    <i className="fas fa-sun"></i>
                    Độ sáng: {brightness} lux
                </p>
            </div>
            <div className="sensor_block gas_block" 
                 style={{backgroundColor: getGasColor(gas), color: getTextColor(getGasColor(gas))}}>
                <p className='g'>
                    <i class="fa-solid fa-fire-extinguisher"></i>
                    Khí gas: {gas} %
                </p>
            </div>
        </div>
    ); 
}

export default SensorData;
