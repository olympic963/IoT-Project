import React, { useState, useEffect, useRef} from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
import axios from 'axios';
import './SensorDataChart.css';
//import socket from './SocketConnection';
import io from 'socket.io-client';
// const socket = io('https://wf550l3h-3000.asse.devtunnels.ms/');
const socket = io('http://localhost:3000/');
function SensorDataChart() {
  const [data, setData] = useState([]);
  const containerRef = useRef(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const adjustHeight = 40; 

    if (containerRef.current) {
      setChartDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight - adjustHeight
      });
    }

    const handleResize = () => {
      if (containerRef.current) {
        setChartDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight - adjustHeight
        });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  useEffect(() => {
    // Lấy dữ liệu ban đầu
    // axios.get('https://wf550l3h-3000.asse.devtunnels.ms/data').then(response => {
    axios.get('http://localhost:3000/data').then(response => {
        setData(response.data);
    }).catch(error => {
        console.error("Error fetching initial data:", error);
    });

    const handleNewData = (newData) => {
      setData(prevData => [...prevData, newData]);
      if (data.length > 20) {
          setData(prevData => prevData.slice(1));
      }      
    };
    socket.on('newData', handleNewData);
    return () => {
      socket.off('newData', handleNewData);
      socket.disconnect();
    };
  }, [data]); 
  function generateTicks(start, end, step) {
    const length = Math.ceil((end - start) / step) + 1;
    return Array.from({ length }, (_, i) => start + (i * step));
  }
  return (
      <div className="line-chart-container" ref={containerRef}> 
        <div className='individual-chart'>
          <LineChart 
            width={chartDimensions.width / 2} 
            height={chartDimensions.height} 
            data={data.slice().reverse()} 
            margin={{ top: 35, right: -5, bottom: -15, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="received_at" tickMargin={10} interval={Math.floor(data.length / 6)} />
            <YAxis yAxisId="left" domain={[0, 100]} ticks={generateTicks(0, 100, 10)} interval={0} tickMargin={10} />
            <YAxis yAxisId="right" orientation="right"  />
            <Tooltip />
            <ReferenceLine yAxisId="left" y={0} stroke="black" strokeWidth={2} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#8884d8" strokeWidth={3} activeDot={{ r: 8 }} name="Nhiệt độ (°C)" />
            <Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#82ca9d" strokeWidth={3} name="Độ ẩm (%)" />
            <Line yAxisId="right" type="monotone" dataKey="brightness" stroke="#ffa500" strokeWidth={3} name="Độ sáng (lux)" />
          </LineChart>
        </div>
        <div className='individual-chart'>
          <LineChart 
            width={chartDimensions.width / 2} 
            height={chartDimensions.height} 
            data={data.slice().reverse()} 
            margin={{ top: 35, right: 35, bottom: -15, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="received_at" tickMargin={10} interval={Math.floor(data.length / 6)} />
            <YAxis yAxisId="left" domain={[0, 100]} ticks={generateTicks(0, 100, 10)} interval={0} tickMargin={10} />
            <Tooltip />
            <ReferenceLine yAxisId="left" y={0} stroke="black" strokeWidth={2} />
            <Legend align="center" verticalAlign="bottom" wrapperStyle={{ marginLeft: "30px" }}/>
            <Line yAxisId="left" type="monotone" dataKey="gas" stroke="#FF0000" strokeWidth={3} activeDot={{ r: 8 }} name="Khí gas" />
          </LineChart>
        </div>
      </div>
  );
  
};
export default SensorDataChart;


