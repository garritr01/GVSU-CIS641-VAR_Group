import React, { useState, useEffect, useRef 
} from 'react';

import { getDateString, getTimeString, chooseMostRecent, logCheck, 
    convertUTCstringsToLocal, getCurrentDateStrings
} from './oddsAndEnds';

import { deleteEntry, fetchObject, fetchFiles, newSaveObject, newFetchDirsAndFiles, newFetchObject
} from './generalFetch';

import { ScheduleView 
} from './Calendar';

/** Renders the main menu and handles selection */
export const MainMenu = ({ printLevel, selectFn, obj, setCurrentObj }) => {

    // Holds the quantity for massProduce
    const [numSaves, setNumSaves] = useState(20);

    // Log the printLevel if 'bv' or 'pv' (basic verbose, parameter verbose)
    useEffect(() => {
        if (logCheck(printLevel, ['b', 'p']) === 2) { console.log('printLevel:', printLevel) }
    }, []);

    // Renders military time and all main menu functions
    return (
        <div className="mainContainer">
            <h1>ROSA</h1>
            <div className="flexDivRows">
                <p>{getDateString()}</p>
                <p>-{getTimeString()}</p>
            </div>
            <ClockOutOptions
                printLevel={printLevel}
                selectFn={selectFn}
                currentObj={obj}
                setCurrentObj={setCurrentObj} />
            {/* // Mass production inputs
                <div className="flexDivRows">
                    <button onClick={() => { massProduce('customUI', numSaves) }}>Save {numSaves} RNG CustomUIs</button>
                    <input value={numSaves} onChange={(e) => setNumSaves(e.target.value)} />
                </div>
            */}
            {/*
            <ClockOutOptions printLevel={printLevel} selectFn={selectFn} selectDirTitleAndVersion={selectDirTitleAndVersion} />
            <ScheduleView printLevel={printLevel} selectFn={selectFn} selectResolutionInfo={selectResolutionInfo} selectDirTitleAndVersion={selectDirTitleAndVersion} mode={'mainMenu'} />
            <QuickNotes printLevel={printLevel} selectFn={selectFn} selectDirTitleAndVersion={selectDirTitleAndVersion} />
            */}
        </div>
    );
}

/** Handles display and resolution of events clocked-into
export const ClockOutOptions = ({ printLevel, selectFn, selectDirTitleAndVersion }) => {

    // Array holding objects representing events on the clock
    const [clockedInEvents, setClockedInEvents] = useState([]);

    useEffect(() => {
        checkForClockIns();
    }, []);

    const checkForClockIns = async () => {
        try {
            const names = await fetchFiles('inProgress', 'Garrit');
            printLevel > 3 && console.log('clocked into ', names.map(element => element.directory + '/' + element.title).join(', '))
            setClockedInEvents(names);
        } catch (err) {
            console.error('Error fetching directories and files:', err);
        };
    }

    const handleClockOut = (event) => {
        selectDirTitleAndVersion(event.directory, event.title, event.dateTime);
        selectFn('customClockOut');
    }

    return (
        <div>
            {clockedInEvents.map((event, index) => (
                <button key={index} onClick={() => handleClockOut(event)}>Clock Out of {event.title}</button>
            ))}
        </div>
    );
}
*/

/** Handles display and resolution shortcut for quick notes feature
export const QuickNotes = ({ printLevel, selectFn, selectDirTitleAndVersion }) => {

    const [quickNotes, setQuickNotes] = useState([]);
    const [listUIs, setListUIs] = useState([]);
    const [listInfo, setListInfo] = useState([]);
    const [update, setUpdate] = useState(null);

    useEffect(() => {
        getNames();
        checkForNotes();
    }, [update]);

    const getNames = async () => {
        try {
            const files = await fetchFiles('customUI', 'Garrit');
            setListUIs(files);
        } catch (err) {
            console.log("Error getting UI names for quickNotes:", err);
        }
        try {
            const files = await fetchFiles('customInfo', 'Garrit');
            setListInfo(files);
        } catch (err) {
            console.error("Error getting info nmes for quickNotes:", err);
        }
    }

    const checkForNotes = async () => {
        const notes = [];
        let files = null;
        try {
            files = await fetchFiles('quickNote', 'Garrit');
            await Promise.all(
                files.map(async (note) => {
                    try {
                        const info = await fetchObject('quickNote', note.dateTime, 'Garrit', note.directory, note.title);
                        notes.push({ ...note, info: info });
                    } catch (err) {
                        console.log('Error fetching', note.directory, note.title, note.dateTime, ' object', err);
                    }
                }));
        } catch (err) {
            console.error('Error fetching quick notes:', err);
        };

        setQuickNotes(notes.sort((a, b) => (parseInt(b.info.urgency) - parseInt(a.info.urgency))));
    }

    const handleResolution = async (event, fnToOpen, list) => {
        try {
            try {
                const response = await deleteEntry('quickNote', event.dateTime, 'Garrit', event.directory, event.title);
                console.log(response);
                setUpdate(event);
            }
            catch (err) {
                console.error('Error removing entry:', err);
            }
            if (fnToOpen) {
                const mostRecentDateTime = chooseMostRecent(list, event.directory, event.title);
                selectDirTitleAndVersion(event.directory, event.title, mostRecentDateTime);
                selectFn(fnToOpen);
            }
        } catch (err) {
            console.log('QuickNotes failed to import files:', err);
        }
    }

    return (
        <div>
            {quickNotes && quickNotes.map((event, index) => (
                <div key={index}>
                    <div style={{ display: 'flex' }}>
                        <p>{event.info.event} due {event.info.dueDate} ({event.info.urgency})</p>
                        {(event.info.subtitle && event.info.subtitle !== 'NA' && chooseMostRecent(listInfo, event.directory, event.title) !== '')
                            ? <button onClick={() => handleResolution(event, 'customEdit', listInfo)}>Resolve and Update</button>
                            : chooseMostRecent(listUIs, event.directory, event.title) !== ''
                                ? <button onClick={() => handleResolution(event, 'customInfo', listUIs)}>Resolve and Input</button>
                                : <button onClick={() => handleResolution(event, null, null)}>Resolve</button>
                        }
                    </div>
                    <p style={{ fontSize: '10px', marginLeft: '10vw' }}>
                        {event.info.note}
                    </p>
                </div>
            ))}
        </div>
    );
}
*/

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
                dir: file.directory,
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
                    dir: file.directory,
                    filename: file.filename,
                    dateTime: file.dateTime,
                    options: response.options,
                    payload: response.payload.map((item) => {
                        if (item.type === 'end') {
                            return { ...item, ...getCurrentDateStrings(true) };
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
                            {file.directory}/{file.filename}&nbsp;
                            {convertUTCstringsToLocal(file.dateTime).date}-{convertUTCstringsToLocal(file.dateTime).time}
                    </button>
                ))
            }
        </div>
    )

}

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