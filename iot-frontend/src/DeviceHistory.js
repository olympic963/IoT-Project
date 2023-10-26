import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DeviceHistory.css';
//import socket from './SocketConnection';
import io from 'socket.io-client';
// const socket = io('https://wf550l3h-3000.asse.devtunnels.ms/');
const socket = io('http://localhost:3000/');
const RECORDS_PER_PAGE = 9;
const MAX_VISIBLE_PAGES = 16; 

function DeviceHistory() {
    const [historyData, setHistoryData] = useState(null);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterDeviceId, setFilterDeviceId] = useState('all');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filterState, setFilterState] = useState('all');
    const [start, setStart] =useState('');
    const [end, setEnd] = useState('');
    
    useEffect(() => {
        const fetchDeviceHistory = async () => {
            const params = {
                deviceId: filterDeviceId,
                start: start,
                end: end,
                sortOrder: sortOrder,
                state: filterState 
            };
            try {
                //const response = await axios.get('https://wf550l3h-3000.asse.devtunnels.ms/device/history', { params });
                const response = await axios.get('http://localhost:3000/device/history', { params });
                setHistoryData(response.data);
            } catch (err) {
                console.error('Error fetching device history:', err.message);
                setError('Error fetching device history. Please try again later.');
            }
        }; 
        fetchDeviceHistory();
        socket.emit('setFiltersDevice', {
            deviceId: filterDeviceId,
            start: start,
            end: end,
            state: filterState,
            sortOrder: sortOrder
        });
        socket.on('deviceHistory', (data) => {
            setHistoryData(data);
        });
        return () => {
            socket.off('deviceHistory'); 
        };
    }, [filterDeviceId, start, end, filterState, sortOrder]);
    
    const total_pages = Math.ceil((historyData?.length || 0) / RECORDS_PER_PAGE);
    let start_page = Math.max(1, currentPage - Math.floor(MAX_VISIBLE_PAGES / 2));
    let end_page = start_page + MAX_VISIBLE_PAGES - 1;
    if (end_page > total_pages) {
        end_page = total_pages;
        start_page = end_page - MAX_VISIBLE_PAGES + 1;
        start_page = Math.max(1, start_page);
    }
    const handleFilterState = () => {
        setFilterState(prev => prev === 'all' ? 'ON' : (prev === 'ON' ? 'OFF' : 'all'));
    }
    return (
        <div className="DeviceHistory">
            {error ? (
                <div className="error">{error}</div>
            ) : !historyData ? (
                <div className="loading">Loading...</div>
            ) : (
                <>
                    <div className="filters">
                        <h2>Device History</h2>
                        <div className="filterOptions">
                            <label>Device ID:</label>
                            <select value={filterDeviceId} onChange={e => setFilterDeviceId(e.target.value)}>
                                <option value="all">All</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                            <label>Time: </label>
                            <input
                                type="date"
                                value={start}
                                onChange={e => setStart(e.target.value)}
                                required
                            />
                            <input
                                type="date"
                                value={end}
                                onChange={e => setEnd(e.target.value)}
                                required
                            />
                            {/* <label>State:</label>
                            <select value={filterState} onChange={e => setFilterState(e.target.value)}>
                                <option value="all">All</option>
                                <option value="ON">On</option>
                                <option value="OFF">Off</option>
                            </select> */}
                        </div>
                    </div>
                    <div className="results">
                        <table>
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Device_ID</th>
                                    <th  onClick={handleFilterState}>Status</th>
                                    <th onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                                        Changed at 
                                        {sortOrder === 'asc' ? <i className="fas fa-arrow-up"></i> : <i className="fas fa-arrow-down"></i>}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyData.slice((currentPage - 1) * RECORDS_PER_PAGE, currentPage * RECORDS_PER_PAGE)
                                    .map((record, index) => (
                                        <tr key={record.id}>
                                            <td>{(currentPage - 1) * RECORDS_PER_PAGE + index + 1}</td>
                                            <td>{record.device_id}</td>
                                            <td>{record.state}</td>
                                            <td>{record.changed_at}</td>
                                        </tr>
                                    ))
                                }
                            </tbody>
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
                    </div>
                </>
            )}
        </div>
    );    
}
export default DeviceHistory;
