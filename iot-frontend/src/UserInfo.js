import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserInfo.css';
import Delete from './Delete';
import SetInterval from './SetInterval';
function UserInfo({ setActiveComponent, showMore, setShowMore }) {
    const [account, setAccount] = useState(null);  
    const [name, setName] = useState(null);  
    const [dob, setDob] = useState(null);
    const [email, setEmail] = useState(null);
    const [phone, setPhone] = useState(null); 
    const [selectedOption, setSelectedOption] = useState(null); 
    useEffect(() => {
        const fetchUserInfo = async () => {
        try {
            //const response = await axios.get('https://wf550l3h-3000.asse.devtunnels.ms/user_info');
            const response = await axios.get('http://localhost:3000/user_info');
            const data = response.data[0];
            setAccount(data.account);
            setName(data.name);
            setDob(data.dob);
            setEmail(data.email);
            setPhone(data.phone_number);
        } catch (error) {
            console.error('Could not fetch latest data', error);
        }
        };
        fetchUserInfo();         
    }, []);
    return (
        <div className='UserInfo'>
            <div className='main-info'>
                <div className="icon-container">
                    <i className="fa-regular fa-user icon"></i>
                </div>
                <div className="content">
                    <p className='account'>Account: {account}</p>
                    <p className='name'>Name: {name}</p>
                    <p className='dob'>Date of birth: {dob}</p>
                    <p className='email'>Email: {email}</p>
                    <p className='phone'>Phone number: {phone}</p>
                </div>  
            </div>   
            <div className='moreOption'>
                <div className="set" onClick={() => setSelectedOption(selectedOption !== 'SetInterval' ? 'SetInterval' : null)}>Set Interval</div>
                <div className="delete" onClick={() => setSelectedOption(selectedOption !== 'Delete' ? 'Delete' : null)}>Delete</div>
                {selectedOption === 'SetInterval' && <SetInterval />}
                {selectedOption === 'Delete' && <Delete />}
            </div>                                               
        </div>
    );
}

export default UserInfo;