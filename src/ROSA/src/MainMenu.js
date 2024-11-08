import React, { useState, useEffect, useRef 
} from 'react';

import { getDateString, getTimeString, chooseMostRecent 
} from './oddsAndEnds';

import { deleteEntry, fetchObject, fetchFiles 
} from './generalFetch';

import { ScheduleView 
} from './Calendar';

//ClockOutOptions and QuickNotes still need updating

/** Renders the main menu and handles selection */
export const MainMenu = ({ printLevel, selectFn, selectResolutionInfo, selectDirTitleAndVersion }) => {

    // Renders military time and all main menu functions
    return (
        <div>
            <Functions printLevel={printLevel} selectFn={selectFn} />
            <div className="mainContainer">
                <h1>ROSA</h1>
                <div className="flexDivRows">
                    <p>{getDateString()}</p>
                    <p>-{getTimeString()}</p>
                </div>
                <ClockOutOptions printLevel={printLevel} selectFn={selectFn} selectDirTitleAndVersion={selectDirTitleAndVersion} />
                <ScheduleView printLevel={printLevel} selectFn={selectFn} selectResolutionInfo={selectResolutionInfo} selectDirTitleAndVersion={selectDirTitleAndVersion} mode={'mainMenu'} />
                <QuickNotes printLevel={printLevel} selectFn={selectFn} selectDirTitleAndVersion={selectDirTitleAndVersion} />
            </div>
        </div>
    );
}

/** Renders the buttons for choosing functions on the main menu */
export const Functions = ({ printLevel, selectFn }) => {

    //select a function based on funcName
    const anyPress = (funcName) => {
        printLevel > 0 && console.log('selected function: ', funcName);
        selectFn(funcName);
    };

    //renders the buttons for selecting different functions on the main menu
    return (
        <div className="stickyHeader">
            <div style={({ width: '90%' })}>
                <button onClick={() => anyPress("main")}>Main Menu</button>
                <button onClick={() => anyPress("file manager")}>File Manager</button>
                <button onClick={() => anyPress("journals")}>Journal</button>
                <button onClick={() => anyPress("new journal")}>New Journal</button>
                <button onClick={() => anyPress("customInfo")}>Custom Record</button>
                <button onClick={() => anyPress("customClockIn")}>Clock In</button>
                <button onClick={() => anyPress("scheduledEvents")}>Schedule Event</button>
                <button onClick={() => anyPress("quick note")}>Quick Note</button>
                <button onClick={() => anyPress("schedule view")}>Calendar</button>
                {/* The below buttons can be rendered for infrequently used functions. Code found in manualEdit.js*/}
                {/*<button onClick={() => alterMatches("CustomUI", null, null,"Earning ($)","Earning ($)", "earning")}>Alter UI</button>*/}
                {/*<button onClick={() => createCustomUIDropdown()}>CustomUI Dropdown</button>*/}
                {/*<button onClick={() => createCustomInfoDropdowns()}>CustomInfo Dropdowns</button>*/}
                {/*<button onClick={() => convertSchedules()}>Convert Schedules</button>*/}
                {/*<button onClick={() => moveTables()}>Move Tables</button>*/}
            </div>
            <div style={({ width: '10%' })}>
                <button
                    onClick={() => selectFn("login")}
                    >
                    Log Out
                </button>
            </div>
        </div>
    );
}

/** Handles display and resolution of events clocked-into */
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

/** Handles display and resolution shortcut for quick notes feature */
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