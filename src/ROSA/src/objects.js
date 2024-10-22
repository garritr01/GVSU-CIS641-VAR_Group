import React, { useState, useEffect } from 'react';
import { 
    getCurrentTime,
    addInputs,
    } from './helperFuncs.js';

export const Functions = ({ selectFn }) => {

    const func = useState('');

    const anyPress = (funcName) => {
        console.log('selected function: ',funcName);
        if( func === funcName ) {
            selectFn('');
        } else {
            selectFn(funcName);
        }
    };
    
    return (
        <div>
            <h2>Functions</h2>
            <button onClick={() => anyPress("journals")}>Journal</button>
            <button onClick={() => anyPress("file manager")}>File Manager</button>
        </div>
    );
};

/*
export const PunchClock = ({ onLogData }) => {

    const [event, setEvent] = useState('');
    const [lastTime, setLastTime] = useState('');
    const [currentTime, setCurrentTime] = useState(getCurrentTime());
    const [text, setText] = useState('');
    const [logData, setLogData] = useState(null); // New state variable to hold log data

    const uponInputChange = (e) => {
        const inputValue = e.target.value;
        setEvent(inputValue);
    };

    const clockingIn = () => {
        const nowTime = getCurrentTime();
        setLastTime(nowTime);
        setCurrentTime(nowTime);
    };

    const clockingOut = () => {
        const nowTime = getCurrentTime();
        setCurrentTime(nowTime);
    };

    useEffect(() => {
        const updatedLogData = {
            event,
            startTime: lastTime,
            endTime: currentTime
        }
        setText(`Clocked into ${event} from ${lastTime} to ${currentTime}`);
        console.log('Clocked in:', lastTime, 'Clocked out:', currentTime);
        
        // Set log data when clocking out
        setLogData(updatedLogData);
        onLogData(updatedLogData);
    }, [event,lastTime,currentTime]);

    // Use the logData state in your component or pass it to other components
    // ...

    return (
        <div>
            <h2>Main Menu</h2>
            <button onClick={clockingIn}>Clock In</button>
            <button onClick={clockingOut}>Clock Out</button>
            <input name="event" value={event} onChange={uponInputChange} />
            <p>{text}</p>
        </div>
    );
};


*/