import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StatisticsSensorData.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
//import socket from './SocketConnection';
import io from 'socket.io-client';
// const socket = io('https://wf550l3h-3000.asse.devtunnels.ms/');
const socket = io('http://localhost:3000/');
const RECORDS_PER_PAGE = 11;
const MAX_VISIBLE_PAGES = 16; 

function StatisticsSensorData() {
    const [option, setOption] = useState('search');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [attribute, setAttribute] = useState('all');
    const [value, setValue] = useState('');
    const [sortT, setSortT] = useState('all');
    const [sortH, setSortH] = useState('all');
    const [sortB, setSortB] = useState('all');
    const [sortG, setSortG] = useState('all');
    const [sortR, setSortR] = useState('all');
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [results, setResults] = useState(null);
    const [tempValue, setTempValue] = useState("");     
    useEffect(() => {
        const fetchSensorData = async () => { 
            const params = {
                option: option,
                startTime: startTime,
                endTime: endTime,
                attribute: attribute,
                value: value,
                sortT: sortT,
                sortH: sortH,
                sortB: sortB,
                sortG: sortG,
                sortR: sortR
            };
            try {
                //const response = await axios.get('https://wf550l3h-3000.asse.devtunnels.ms/sensor/statistics', { params });
                const response = await axios.get('http://localhost:3000/sensor/statistics', { params });
                setResults(response.data);
            } catch (err) {
                console.error('Error fetching device history:', err.message);
                setError('Error fetching device history. Please try again later.');
            }
        };
        fetchSensorData();
        socket.emit('setFiltersSensor', {
            option: option,
            startTime: startTime,
            endTime: endTime,
            attribute: attribute,
            value: value,
            sortT: sortT,
            sortH: sortH,
            sortB: sortB,
            sortG: sortG,
            sortR: sortR
        });   
        socket.on('statistics', (data) => {
            setResults(data);
        });
        return () => {
            socket.off('statistics'); 
        };
    }, [ option, startTime, endTime, attribute, value, sortT, sortH, sortB, sortG, sortR]);

    const handleSortT = () => {
        setSortT(prev => prev === 'all' ? 'asc' : (prev === 'asc' ? 'desc' : 'all'));
    }
    const handleSortH = () => {
        setSortH(prev => prev === 'all' ? 'asc' : (prev === 'asc' ? 'desc' : 'all'));
    }
    const handleSortB = () => {
        setSortB(prev => prev === 'all' ? 'asc' : (prev === 'asc' ? 'desc' : 'all'));
    }
    const handleSortG = () => {
        setSortG(prev => prev === 'all' ? 'asc' : (prev === 'asc' ? 'desc' : 'all'));
    }
    const handleSortR = () => {
        setSortR(prev => prev === 'all' ? 'asc' : (prev === 'asc' ? 'desc' : 'all'));
    }
    

    const total_pages = Math.ceil((results?.length || 0) / RECORDS_PER_PAGE);
    let start_page = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
    let end_page = start_page + MAX_VISIBLE_PAGES - 1;
    if (end_page > total_pages) {
        end_page = total_pages;
        start_page = end_page - MAX_VISIBLE_PAGES + 1;
        start_page = Math.max(1, start_page);
    }

    return (
        <div className="SearchAndStatistics">
            {error ? (
                <div className="error">{error}</div>
            ) : !results ? (
                <div className="loading">Loading...</div>
            ) : (
                <>
                    <div className="filters">
                        <h2>Sensor Statistics</h2>
                        <div className="filterOptions">
                            <label>Option:</label>
                            <select value={option} onChange={e => setOption(e.target.value)}>
                                <option value="search">Search</option>
                                <option value="stats">Statistical</option>
                            </select>
                            <label>Choose start time: </label>
                            <input
                                type="date"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                required
                            />
                            <label>Choose end time: </label>
                            <input
                                type="date"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                required
                            />
                            {option === 'search' && (
                                <>
                                    <label> Select attribute to search:</label>
                                    <select value={attribute} onChange={e => setAttribute(e.target.value)}>
                                        <option value="temperature">Temperature</option>
                                        <option value="humidity">Humidity</option>
                                        <option value="brightness">Brightness</option>
                                        <option value="gas">Gas</option>
                                    </select>
                                    <input 
                                    type="text" 
                                    value={tempValue} 
                                    onChange={e => setTempValue(e.target.value)}
                                    placeholder="Enter value..." 
                                    required
                                    />
                                    <button onClick={() => setValue(tempValue)}>Search</button>                                  
                                </>
                            )}
                        </div>
                    </div>
                    <div className="results">
                        {option === 'stats' && results.length > 0 && (
                            <table>
                                <thead>
                                    <tr>
                                        <th>Attribute</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Max temperature</td>
                                        <td>{results[0].max_temperature}</td>
                                    </tr>
                                    <tr>
                                        <td>Min temperature</td>
                                        <td>{results[0].min_temperature}</td>
                                    </tr>
                                    <tr>
                                        <td>Avg temperature</td>
                                        <td>{results[0].avg_temperature}</td>
                                    </tr>
                                    <tr>
                                        <td>Max humidity</td>
                                        <td>{results[0].max_humidity}</td>
                                    </tr>
                                    <tr>
                                        <td>Min humidity</td>
                                        <td>{results[0].min_humidity}</td>
                                    </tr>
                                    <tr>
                                        <td>Avg humidity</td>
                                        <td>{results[0].avg_humidity}</td>
                                    </tr>
                                    <tr>
                                        <td>Max brightness</td>
                                        <td>{results[0].max_brightness}</td>
                                    </tr>
                                    <tr>
                                        <td>Min brightness</td>
                                        <td>{results[0].min_brightness}</td>
                                    </tr>
                                    <tr>
                                        <td>Avg brightness</td>
                                        <td>{results[0].avg_brightness}</td>
                                    </tr>
                                    <tr>
                                        <td>Max gas</td>
                                        <td>{results[0].max_gas}</td>
                                    </tr>
                                    <tr>
                                        <td>Min gas</td>
                                        <td>{results[0].min_gas}</td>
                                    </tr>
                                    <tr>
                                        <td>Avg gas</td>
                                        <td>{results[0].avg_gas}</td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                        {option === 'search' && results.length > 0 &&(
                            <>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>STT</th>
                                            <th onClick={handleSortT}>
                                                Temperature 
                                                {sortT === 'asc' ? <i className="fas fa-arrow-down"></i> : (sortT === 'desc' ? <i className="fas fa-arrow-up"></i> : '')}
                                            </th>
                                            <th onClick={handleSortH}>
                                                Humidity 
                                                {sortH === 'asc' ? <i className="fas fa-arrow-down"></i> : (sortH === 'desc' ? <i className="fas fa-arrow-up"></i> : '')}
                                            </th>
                                            <th onClick={handleSortB}>
                                                Brightness 
                                                {sortB === 'asc' ? <i className="fas fa-arrow-down"></i> : (sortB === 'desc' ? <i className="fas fa-arrow-up"></i> : '')}
                                            </th>
                                            <th onClick={handleSortG}>
                                                Gas 
                                                {sortG === 'asc' ? <i className="fas fa-arrow-down"></i> : (sortG === 'desc' ? <i className="fas fa-arrow-up"></i> : '')}
                                            </th>
                                            <th onClick={handleSortR}>
                                                Received at 
                                                {sortR === 'asc' ? <i className="fas fa-arrow-down"></i> : (sortR === 'desc' ? <i className="fas fa-arrow-up"></i> : '')}
                                            </th>
                                        </tr>
                                    </thead>
                                    {results.length > 0 ? (
                                        <tbody>
                                            {results.slice((currentPage - 1) * RECORDS_PER_PAGE, currentPage * RECORDS_PER_PAGE)
                                                .map((record, index) => (
                                                    record && record.id ? (
                                                        <tr key={record.id}>
                                                            <td>{(currentPage - 1) * RECORDS_PER_PAGE + index + 1}</td>
                                                            <td>{record.temperature}</td>
                                                            <td>{record.humidity}</td>
                                                            <td>{record.brightness}</td>
                                                            <td>{record.gas}</td>
                                                            <td>{record.received_at}</td>
                                                        </tr>
                                                    ) : null
                                                ))
                                            }
                                        </tbody>
                                    ) : null}
                                </table>
                                <div className="pagination">
                                {currentPage > 1 && <button onClick={() => setCurrentPage(currentPage - 1)}>Previous</button>}
                                {Array.from({ length: end_page - start_page + 1 }).map((_, index) => (
                                    <button key={index} onClick={() => setCurrentPage(start_page + index)} className={currentPage === start_page + index ? 'active' : ''}>
                                        {start_page + index}
                                    </button>
                                ))}
                                {currentPage < total_pages && <button onClick={() => setCurrentPage(currentPage + 1)}>Next</button>}
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );    
}
export default StatisticsSensorData;
