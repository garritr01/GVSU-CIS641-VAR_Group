import React, { useState, useEffect, useRef
} from 'react';

import {
    getCurrentSplitDate, addToSplitDate, logCheck, filterByRange
} from './oddsAndEnds';

import { 
    newFetchDirsAndFiles, newFetchObject, newFetchObjects
} from './generalFetch';

export const Calendar = ({ printLevel, selectFn, setCurrentObj, userID, fullDisplay = true }) => {

    const time = getCurrentSplitDate(true);
    // Define range of calendar to display
    const [start, setStart] = useState(addToSplitDate({ month: time.month, day: time.day, year: time.year }, 'day', -1));
    const [end, setEnd] = useState(addToSplitDate({ month: time.month, day: time.day, year: time.year }, 'day', 2));
    // Contain directories from schedule and record
    const [allDirs, setAllDirs] = useState([]);
    // Contain all customUI schedules
    const [scheduleInfo, setScheduleInfo] = useState([]);
    // Contain all records within range
    const [recordInfo, setRecordInfo] = useState([]);
    // Used to include or exclude selected dirs
    const [include, setInclude] = useState(true);
    // Used to contain dirs to include or exclude
    const [selectedDirs, setSelectedDirs] = useState([]);
    // Used to contain dir input to add to selected array
    const [selectedDir, setSelectedDir] = useState('');

    // Get Records on start or end change
    useEffect(() => {
        getRecords();
    }, [start, end]);

    // Get Schedules on initial render
    useEffect(() => {
        getSchedules();
    }, []);

    // Reset allDirs and allFiles on records or schedules change
    useEffect(() => {
        // Include each unique directory
        setAllDirs([ ...new Set([
            ...scheduleInfo.map(sched => sched.dir), 
            ...recordInfo.map(rec => rec.directory)
        ])]);
    },[recordInfo, scheduleInfo]);

    const getSchedules = async () => {
        try {
            const response = await newFetchDirsAndFiles('customUI', userID);
            if (response.truth) {
                const outFiles = filterByRange(response.files,
                    { date: [start.month, start.day, start.year].join('/'), time: '00:00' },
                    { date: [end.month, end.day, end.year].join('/'), time: '00:00' });
                const objectsResponse = await newFetchObjects('customUI', userID, outFiles, ['options']);
                if (objectsResponse.truth) {
                    setScheduleInfo(objectsResponse.objects);
                    if (logCheck(printLevel, ['s']) === 1) { console.log(`Successfully got schedules from 'customUI'`) }
                } else {
                    throw new Error(`${objectsResponse.status} Error getting 'customUI' schedules from given range: ${objectsResponse.msg}`);
                }
            } else {
                throw new Error(`${response.status} Error getting dirs and files from 'customUI': ${response.msg}`);
            }
        } catch (err) {
            setScheduleInfo([]);
            console.error(err);
        }
    }

    const getRecords = async () => {
        try {
            const response = await newFetchDirsAndFiles('record', userID);
            if (response.truth) {
                setRecordInfo(response.files);
                if (logCheck(printLevel, ['s']) === 1) { console.log(`Successfully got dirs and filenames from 'record'`) }
            } else {
                throw new Error(`${response.status} Error getting dirs and files from 'record': ${response.msg}`);
            }
        } catch (err) {
            setRecordInfo([]);
            console.error(err);
        }
    }

    return (
        <div className="mainContainer">
            { /** Customize Dates and include/exclude only available when fullDisplay is true */
                fullDisplay &&
                    <div>
                        {/** Input range of dates */}
                        <div className="flexDivRows">
                            <DateInput date={start} setDate={setStart} />
                            <p>-</p>
                            <DateInput date={end} setDate={setEnd} />
                            <button>Apply Dates</button>
                        </div>
                        {/** Input dirs to exclude */}
                        <div className="flexDivRows">
                            <p>Directory:</p>
                            <select
                                value={selectedDir}
                                onChange={(e) => setSelectedDir(e.target.value)}
                                >
                                <option key={'empty'} value={''}></option>
                                {// Return all tiers of selectedDir
                                    selectedDir !== '' &&
                                        selectedDir.split('/').map((dir, i) => {
                                            if (!selectedDirs.includes(selectedDir.split('/').slice(0, i+1).join('/'))) {
                                                return (
                                                    <option key={i} value={selectedDir.split('/').slice(0,i+1).join('/')}>
                                                        {selectedDir.split('/').slice(0,i+1).join('/')}
                                                    </option>
                                                );
                                            }
                                        })
                                }
                                {// Return subdirectories based on selectedDir
                                    allDirs.length > 0 &&
                                    [...new Set(
                                        allDirs.map((dir) => {
                                            // return all leading directories
                                            if (selectedDir === '' && !selectedDirs.includes(dir.split('/')[0])) {
                                                return dir.split('/')[0];
                                            }
                                            // return all subdirectories of obj.dir
                                            else if (dir.startsWith(selectedDir) && 
                                                dir.split('/').length > selectedDir.split('/').length &&
                                                !selectedDirs.includes(dir.split('/').slice(0, selectedDir.split('/').length + 1).join('/'))) {
                                                return dir.split('/').slice(0, selectedDir.split('/').length + 1).join('/');
                                            }
                                            // ignore other cases
                                            else {
                                                return null;
                                            }
                                        })
                                    )]
                                    .filter((dir) => dir !== null)
                                    .map((dir, index) => (
                                        <option key={index} value={dir}>{dir}</option>
                                    ))
                                }
                            </select>
                            <button onClick={() => {
                                setSelectedDirs(prevState => [ ...prevState, selectedDir]);
                                setSelectedDir('');
                                }}>
                                Add it!
                            </button>
                        </div>                                                   
                        <button 
                            onClick={() => setInclude(true)}
                            style={{ color: include ? 'gray' : undefined}}>
                            Include
                        </button>
                        <button 
                            onClick={() => setInclude(false)}
                            style={{ color: !include ? 'gray' : undefined}}>
                            Exclude
                        </button>
                    </div>
            }
            <button onClick={() => console.log(recordInfo)}>Log Records</button>
            <button onClick={() => console.log(scheduleInfo)}>Log Schedules</button>
            <button onClick={() => console.log(allDirs)}>Log allDirs</button>
            <button onClick={() => console.log(selectedDirs)}>Log selectedDirs</button>
            <button onClick={() => console.log(start)}>Log start</button>
            {/** Display calendar */}
            <CalendarView
                printLevel={printLevel}
                selectFn={selectFn}
                setCurrentObj={setCurrentObj}
                userID={userID}
                records={recordInfo}
                schedules={scheduleInfo}
                start={start}
                end={end} />
        </div>
    );
}

/** HTML element for editing start and end date/time of schedule */
const DateInput = ({ date, setDate }) => {

    /** Update date property with inputValue */
    const uponDateChange = (inputValue, prop) => {
        setDate(prevState => ({ ...prevState, [prop]: inputValue }));
    }

    return (
        <div className="flexDivRows">
            <input className="twoDigitInput"
                name='month1 box'
                value={date.month}
                onChange={(e) => uponDateChange(e.target.value, 'month')} />
            <p>/</p>
            <input className="twoDigitInput"
                name='day1 box'
                value={date.day}
                onChange={(e) => uponDateChange(e.target.value, 'day')} />
            <p>/</p>
            <input className="fourDigitInput"
                name='year1 box'
                value={date.year}
                onChange={(e) => uponDateChange(e.target.value, 'year')} />
        </div>
    );
}

const CalendarView = ({ printLevel, selectFn, setCurrentObj, userID, records, schedules, start, end }) => {
    
    return (
        <div style={{ border: '1px solid black'}}>
            {/*
            <Cell 
                printLevel={printLevel} 
                selectFn={selectFn} 
                setCurrentObj={setCurrentObj} 
                records={cellRecords} 
                schedules={cellSchedules}
                width={cellWidth} />
            */}
        </div>
    );
}

const Cell = ({ printLevel, selectFn, setCurrentObj, records, schedules, cellWidth }) => {

    return (
        <div>

        </div>
    );
}