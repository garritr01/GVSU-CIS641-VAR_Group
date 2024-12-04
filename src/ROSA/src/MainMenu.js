import React, { useState, useEffect, useRef 
} from 'react';

import { 
    getCurrentDateTime, logCheck, convertUTCDateTimeToLocal,
    formatSplitDateToDateTime,
    convertUTCSplitDateToLocal,
    formatDateTimeToString,
} from './oddsAndEnds';

// Specifically imported for testing schedule fitting to calendar
import {
    splitDateDifference, checkSplitDateIsBefore, addToSplitDate, getCurrentSplitDate
} from './oddsAndEnds'

import { newSaveObject, newFetchDirsAndFiles, newFetchObject
} from './generalFetch';

import { Calendar
} from './Calendar';

/** Renders the main menu and handles selection */
export const MainMenu = ({ printLevel, selectFn, obj, setCurrentObj }) => {

    const time = getCurrentSplitDate(true);

    // Holds the quantity for massProduce
    const [numSaves, setNumSaves] = useState(20);
    // Holds qty for specRpt test
    const [cStart, setCStart] = useState({ ...time, hour: '00', minute: '00' });
    const [cEnd, setCEnd] = useState({ ...time, hour: '00', minute: '00' });
    const [refStart, setRefStart] = useState(time);
    const [refEnd, setRefEnd] = useState(time);
    const [repeatSpace, setRepeatSpace] = useState('1');
    const [scheduledEvents, setScheduledEvents] = useState([]);
    

    // Log the printLevel if 'bv' or 'pv' (basic verbose, parameter verbose)
    useEffect(() => {
        if (logCheck(printLevel, ['b', 'p']) === 2) { console.log('printLevel:', printLevel) }
    }, []);

    // Renders military time and all main menu functions
    return (
        <div className="mainContainer">
            <h1>ROSA</h1>
            <div className="flexDivRows">
                <p>{getCurrentDateTime().date}</p>
                <p>-{getCurrentDateTime().time}</p>
            </div>
            <ClockOutOptions
                printLevel={printLevel}
                selectFn={selectFn}
                currentObj={obj}
                setCurrentObj={setCurrentObj} />
            {/** Test specRpt fitting into calendar */}
            {
            <div>
                <div className="flexDivRows">
                    <p>Calendar</p>
                    <DateInput date={cStart} setDate={setCStart} />
                    <p> - </p>
                    <DateInput date={cEnd} setDate={setCEnd} />
                </div>
                <div className="flexDivRows">
                    <p>Reference</p>
                    <DateInput date={refStart} setDate={setRefStart} />
                    <p> - </p>
                    <DateInput date={refEnd} setDate={setRefEnd} />
                </div>
                <input 
                    className="flexDivRows"
                    value={repeatSpace}
                    onChange={(e) => setRepeatSpace(e.target.value)}
                    />
                <button 
                    className="flexDivRows"
                    onClick={() => scheduleTest(setScheduledEvents, cStart, cEnd, refStart, refEnd, repeatSpace)}>
                    Test it!
                </button>
                <div>
                {
                    scheduledEvents.length > 0 &&
                        scheduledEvents.map((event, i) => (
                            <div className="flexDivRows" key={i}>
                                <p>{formatSplitDateToDateTime(event.start).date} at {formatSplitDateToDateTime(event.start).time}</p>
                                <p> - </p>
                                <p>{formatSplitDateToDateTime(event.end).date} at {formatSplitDateToDateTime(event.end).time}</p>
                            </div>
                        ))
                }
                </div>
            </div> 
            }
            {/* // Mass production inputs
                <div className="flexDivRows">
                    <button onClick={() => { massProduce('customUI', numSaves) }}>Save {numSaves} RNG CustomUIs</button>
                    <input value={numSaves} onChange={(e) => setNumSaves(e.target.value)} />
                </div>
            */}
        </div>
    );
}

const ClockOutOptions = ({ printLevel, selectFn, currentObj, setCurrentObj }) => {

    const [fileInfo, setFileInfo] = useState([]);

    /** Get all clocked in events */
    useEffect(() => {
        getDirsAndFiles();
    },[]);

    /** Gets dirs and files where directories is all unqiue directories and
    * files is an array of objects containing dateTime, directory, and filename
    */
    const getDirsAndFiles = async () => {
        try {
            const response = await newFetchDirsAndFiles('clockIn', currentObj.userID);
            if (response.truth) {
                setFileInfo(response.files);
                if (logCheck(printLevel, ['s']) === 1) { console.log('Successfully got dirs and files from clockIn') }
                else if (logCheck(printLevel, ['s']) === 2) { console.log('Successfully got files from clockIn\n', response.files) }
            } else {
                setFileInfo([]);
                throw new Error(`${response.status} Error getting dirs and files from clockIn: ${response.msg}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    /** Set object to clock out with and open record function */
    const clockOut = async (file) => {
        try {
            const response = await newFetchObject({ 
                userID: currentObj.userID, 
                table: 'clockIn',
                dir: file.dir,
                filename: file.filename,
                dateTime: file.dateTime
            });
            if (!response.truth) {
                throw new Error(`${response.status} Error getting ${currentObj.dir}/${currentObj.filename} (${currentObj.dateTime.date}-${currentObj.dateTime.time}):\n ${response.msg}`);
            } else {
                // Use current time for type 'end'
                const updatedObj = {
                    userID: currentObj.userID,
                    table: 'clockIn',
                    dir: file.dir,
                    filename: file.filename,
                    dateTime: file.dateTime,
                    options: response.options,
                    payload: response.payload.map((item) => {
                        if (item.type === 'start') {
                            return convertUTCSplitDateToLocal(item);
                        } else if (item.type === 'end') {
                            return { ...item, ...getCurrentSplitDate(true) };
                        } else {
                            return item;
                        }
                    })
                };
                setCurrentObj(updatedObj);
                selectFn('record', false);
                if (logCheck(printLevel, ['d', 'b']) > 1) { console.log(`Succesfully retrieved ${currentObj.dir}/${currentObj.filename} (${currentObj.dateTime.date}-${currentObj.dateTime.time})`) }
                if (logCheck(printLevel, ['o']) === 1) { console.log('obj updated by fetch') }
                else if (logCheck(printLevel, ['o']) === 2) { console.log('obj updated by fetch\n obj:', updatedObj) }
            }
        } catch (err) {
            console.error(`Error fetching object from ${currentObj.table}:`, err);
        }
    }

    return (
        fileInfo.length > 0 &&
        <div className="flexDivRows">
            <p>Clock out: </p>
            {
                fileInfo.map((file, i) => (
                    <button
                        key={i}
                        onClick={() => clockOut(file)}
                        >
                            {file.dir}/{file.filename}&nbsp;
                            {formatDateTimeToString(convertUTCDateTimeToLocal(file.dateTime))}
                    </button>
                ))
            }
        </div>
    )

}

// Below are temp functions for testing
const massProduce = async (type, qty) => {

    const randString = ['alpha', 'beta', 'kappa']/*, 'omega', 'sigma', 'nu', 'mu',
        'garden', 'party', 'spain', 'grogu', 'mando', 'skipper', 'JaredGoff',
        'eclipse', 'massEffect3', 'Riften', 'Falkreath', 'Solitude', 'WHITERUN',
        'Riverwood', 'Alduin', 'thePale', 'Shadowmere', 'Lydia', 'Greybeard']; */

    if (type === 'customUI') {
        /** Save new UI or overwrite UI */

        const obj = {
            userID: 'garritr01',
            options: { startInfo: true },
            table: 'customUI',
            payload: [
                { type: 'input', label: 'Label?', value: ['inpVal'], choices: null, group: 0 },
                { type: 'text', label: 'Label?', value: 'textVal', choices: null, group: 0 },
                { type: 'choice', label: 'Label?', value: 'c1', choices: ['c1', 'c2'], group: 0 },
                { type: 'toggle', label: 'Label?', value: true, choices: null, group: 1 },
            ]
        };

        for (let i = 0; i < qty; i++) {

            const randDirLength = Math.floor(Math.random() * 5) + 1;
            const randDir = [...randString].sort(() => 0.5 - Math.random()).slice(0, randDirLength).join('/');
            const randFilename = [...randString].sort(() => 0.5 - Math.random()).slice(0, 2).join('-');
            const randDate = {
                date:
                    `${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}/${String(Math.floor(Math.random() * 51) + 2000)}`,
                time:
                    `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
            }

            try {
                const response = await newSaveObject({
                    ...obj,
                    dir: randDir, filename: randFilename, dateTime: randDate
                });
                if (response.truth) {
                    if (response.status === 201) {
                        console.log(`Saved random object.`);
                    } else {
                        throw new Error(`${response.status} Unexpected Success: ${response.msg}`);
                    }
                } else {
                    throw new Error(`${response.status} Error: ${response.msg}`);
                }
            } catch (err) {
                console.error(err);
            }
        }
    } else {
        console.error(`Cannot mass produce '${type}'`);
    }
}


const scheduleTest = (setScheduledEvents, cStart, cEnd, refStart, refEnd, repeatSpace) => {
    const scheduledEvents = [];
    // specRpt/weekly method
    /*
    // get difference in days between calendar start and event end
    const cStarteEndDiff = splitDateDifference(cStart, refEnd, 'day');
    // find the number of periods to add to reach calendar range (could be negative) 
    const periodsToAdd = Math.ceil(cStarteEndDiff / parseInt(repeatSpace));
    // add days to get first start and end within calendar range
    let eventStart = addToSplitDate(refStart, 'day', (periodsToAdd * repeatSpace).toString());
    let eventEnd = addToSplitDate(refEnd, 'day', (periodsToAdd * repeatSpace).toString());
    // add scheduled events until event start is after calendar end
    while (checkSplitDateIsBefore(eventStart, cEnd)) {
        scheduledEvents.push({ start: eventStart, end: eventEnd });
        eventStart = addToSplitDate(eventStart, 'day', repeatSpace);
        eventEnd = addToSplitDate(eventEnd, 'day', repeatSpace);
    }*/

    // monthly/yearly method
    // get difference in days between calendar start and event end
    const periodsToAdd = splitDateDifference(cStart, refEnd, 'month');
    const initStart = { ...refStart, 
        month: ((parseInt(refStart.month) + periodsToAdd - 1) % 12 + 1).toString(),
        year: ((parseInt(refStart.year) + Math.floor((parseInt(refStart.month) + periodsToAdd - 1) / 12)))
    };
    const initEnd = { ...refEnd,
        month: ((parseInt(refEnd.month) + periodsToAdd - 1) % 12 + 1).toString(),
        year: ((parseInt(refEnd.year) + Math.floor((parseInt(refEnd.month) + periodsToAdd - 1) / 12)))
    };
    console.log('given', refStart, refEnd);
    console.log('periods to find start',periodsToAdd);
    console.log('inits',initStart, initEnd);

    for (let i = -1; i < splitDateDifference(cEnd, cStart, 'month') + 1; i++) {
        scheduledEvents.push({ 
            start: addToSplitDate(initStart, 'month', i.toString()), 
            end: addToSplitDate(initEnd, 'month', i.toString()) 
        });
    }


    setScheduledEvents(scheduledEvents);
}

/** HTML element for editing start and end date/time of schedule */
const DateInput = ({ date, setDate }) => {

    /** Update date property with inputValue */
    const uponDateChange = (inputValue, prop) => {
        setDate(prevState => ({ ...prevState, [prop]: inputValue }));
    }

    return (
        <div className="flexDivRows">
            <input className="twoDigitInput flexDivColumns"
                name='month1 box'
                value={date.month}
                onChange={(e) => uponDateChange(e.target.value, 'month')} />
            <p className="flexDivColumns">/</p>
            <input className="twoDigitInput"
                name='day1 box'
                value={date.day}
                onChange={(e) => uponDateChange(e.target.value, 'day')} />
            <p className="flexDivColumns">/</p>
            <input className="fourDigitInput flexDivColumns"
                name='year1 box'
                value={date.year}
                onChange={(e) => uponDateChange(e.target.value, 'year')} />
            <p className="flexDivColumns">at</p>
            <input className="twoDigitInput flexDivColumns"
                name='hour1 box'
                value={date.hour}
                onChange={(e) => uponDateChange(e.target.value, 'hour')} />
            <p className="flexDivColumns">:</p>
            <input className="twoDigitInput flexDivColumns"
                name='minute1 box'
                value={date.minute}
                onChange={(e) => uponDateChange(e.target.value, 'minute')} />
        </div>
    );
}