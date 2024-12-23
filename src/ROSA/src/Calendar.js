import React, { useState, useEffect, useRef
} from 'react';

import {
    getCurrentSplitDate, addToSplitDate, logCheck, filterByRange,
    checkSplitDateIsBefore, splitDateDifference, formatSplitDateToString, 
    formatSplitDateToJsDate, formatDateTimeToSplitDate, formatDateTimeToString, 
    convertUTCSplitDateToLocal, convertLocalSplitDateToUTC, 
    convertUTCDateTimeToLocal, convertLocalDateTimeToUTC, 
    formatSplitDateToDateTime, convertObjTimes, formatJsDateToSplitDate, 
    getCurrentDateTime,
    getWeekdayString
} from './oddsAndEnds';

import { 
    newDeleteEntry, newFetchDirsAndFiles, newFetchFilteredDirsAndFiles,
    newFetchObject, newFetchObjects, newSaveObject
} from './generalFetch';

import { positionMorePopup } from './dynamicDisplays';

/** Displays calendar and handles opening functions from calendar */
export const Calendar = ({ rookie, printLevel, selectFn, setCurrentObj, userID, fullDisplay = true, externalDetectDelete }) => {

    const time = getCurrentSplitDate(true);
    // Define range of calendar to display
    const [start, setStart] = useState(addToSplitDate({ month: time.month, day: time.day, year: time.year }, 'day', '-1'));
    const [end, setEnd] = useState({
        ...addToSplitDate({ month: time.month, day: time.day, year: time.year }, 'day', '2'),
        hour: '23',
        minute: '59'
    });
    // List of dates between start and end (inclusive)
    const [dates, setDates] = useState([]);
    // Contain directories from schedule and record
    const [allDirs, setAllDirs] = useState([]);
    // Contain all specific dates scheduled
    const [schedules, setSchedules] = useState([]);
    // Contain all records within range
    const [records, setRecords] = useState([]);
    // Contain all resolutions
    const [resolutions, setResolutions] = useState([]);
    // object to contain file information when selected
    const [selection, setSelection] = useState(null);
    // boolean to trigger reload upon deletion (if externally defined, calling component detects too)
    const [internalDetectDelete, setInternalDetectDelete] = useState(null);
    const detectDelete = externalDetectDelete ? externalDetectDelete[0] : internalDetectDelete;
    const setDetectDelete = externalDetectDelete ? externalDetectDelete[1] : setInternalDetectDelete;
    // Used to include or exclude selected dirs
    const [include, setInclude] = useState(true);
    // Used to contain dirs to include or exclude
    const [selectedDirs, setSelectedDirs] = useState([]);
    // Used to contain dir input to add to selected array
    const [selectedDir, setSelectedDir] = useState('');

    // position .more popups, Get calendar info and define allDirs on initial render
    useEffect(() => {
        positionMorePopup();
        spanRange();
        defineAllDirs();
    }, []);

    // trigger loading of event on change in dates array
    useEffect(() => {
        getScheduleInfo();
        getRecords();
        getResolutions();
    },[dates]);

    // Remove record or schedule upon deletion
    useEffect(() => {
        if (detectDelete) {
            if (detectDelete.type === 'schedule') {
                getScheduleInfo();
            } else if (detectDelete.type === 'resolve' || detectDelete.type === 'record') {
                getRecords();
                getResolutions();
            }
            setDetectDelete(null);
        }
    },[detectDelete])

    /** Get every directory */
    const defineAllDirs = async () => {
        try {
            const recordResponse = await newFetchDirsAndFiles('record', userID);
            const scheduleResponse = await newFetchDirsAndFiles('customUI', userID);
            if (recordResponse.truth && scheduleResponse.truth) {
                setAllDirs([...new Set([
                    ...recordResponse.files.map(r => r.dir),
                    ...scheduleResponse.files.map(s => s.dir)
                ])]);
            } else {
                if (!recordResponse.truth && !scheduleResponse.truth) {
                    throw new Error(`Error setting allDirs. 
                        schedule ${scheduleResponse.status} Error: ${scheduleResponse.msg}
                        record ${recordResponse.status} Error: ${recordResponse.msg}`);
                } else if (!scheduleResponse.truth) {
                    throw new Error(`Error setting allDirs. schedule ${scheduleResponse.status} Error: ${scheduleResponse.msg}`);
                } else if (!recordResponse.truth) {
                    throw new Error(`Error setting allDirs. record ${recordResponse.status} Error: ${recordResponse.msg}`);
                } else {
                    throw new Error('Not sure how this error could occurred.')
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    /** get everything but payload for each entry in 'customUI' */
    const getScheduleInfo = async () => {
        try {
            const response = await newFetchFilteredDirsAndFiles('customUI', userID, selectedDirs, include);
            if (response.truth) {
                const objectsResponse = await newFetchObjects('customUI', userID, response.files, ['options']);
                if (objectsResponse.truth) {
                    // Convert any schedules that are in UTC to local
                    const convertedObjs = objectsResponse.objects.map((obj) => {
                        return { ...convertObjTimes(obj, true, false, true, false)}
                    });
                    defineSchedules(convertedObjs);
                    if (logCheck(printLevel, ['s']) === 1) { console.log(`Successfully got schedules from 'customUI'`) }
                } else {
                    throw new Error(`${objectsResponse.status} Error getting 'customUI' schedules from given range: ${objectsResponse.msg}`);
                }
            } else {
                throw new Error(`${response.status} Error getting dirs and files from 'customUI': ${response.msg}`);
            }
        } catch (err) {
            setSchedules([]);
            console.error(err);
        }
    }

    /** Get dir, filename, dateTime of 'record' table */
    const getRecords = async () => {
        try {
            const response = await newFetchFilteredDirsAndFiles('record', userID, selectedDirs, include);
            if (response.truth) {
                setRecords(response.files);
                if (logCheck(printLevel, ['s']) === 1) { console.log(`Successfully got dirs and filenames from 'record'`) }
            } else {
                throw new Error(`${response.status} Error getting dirs and files from 'record': ${response.msg}`);
            }
        } catch (err) {
            setRecords([]);
            console.error(err);
        }
    }

    /** Get dir, filename, dateTime of 'resolve' table */
    const getResolutions = async () => {
        try {
            const response = await newFetchFilteredDirsAndFiles('resolve', userID, selectedDirs, include);
            if (response.truth) {
                setResolutions(response.files);
                if (logCheck(printLevel, ['s']) === 1) { console.log(`Successfully got dirs and filenames from 'resolve'`) }
            } else {
                throw new Error(`${response.status} Error getting dirs and files from 'resolve': ${response.msg}`);
            }
        } catch (err) {
            setResolutions([]);
            console.error(err);
        }
    }

    /** Use schedule info to define specific events within the range of the calendar (turn repeating into series of single events) */
    const defineSchedules = (schedInfo) => {
        let newScheduledEvents = [];
        schedInfo.forEach((info) => {
            let eventSkeleton = { dir: info.dir, filename: info.filename, dateTime: info.dateTime };
            info.options.schedule.forEach((s) => {

                // Move on if effective range doesn't overlap with calendar
                // If effective start date is after end of calendar, move to next schedule
                if (checkSplitDateIsBefore(end, s.effectiveStart)) {
                    return;
                } 
                // If effective end date is not filled with "NA" and is before start of calendar, move to next schedule
                if (!(s.effectiveEnd.month === "NA") && checkSplitDateIsBefore(s.effectiveEnd, start)) {
                    return;
                }
                
                try {
                    let cStart_eEndDiff, periodsToAdd, eventStart, eventEnd, initStart, initEnd;
                    switch (s.repeatType) {
                        case 'none':
                            // if calendar start is before event end or event start is before calendar end add the schedule
                            if (checkSplitDateIsBefore(start, s.end) || checkSplitDateIsBefore(s.start, end)) {
                                newScheduledEvents.push({ ...eventSkeleton, start: s.start, end: s.end });
                            } 
                            return;
                        case 'specRpt':
                            // get difference in days between calendar start and event end
                            cStart_eEndDiff = splitDateDifference(start, s.end, 'day');
                            // find the number of periods to add to reach calendar range (could be negative)
                            periodsToAdd = Math.ceil(cStart_eEndDiff/ parseInt(s.repeatInfo));
                            // add days to get first start and end within calendar range
                            eventStart = addToSplitDate(s.start, 'day', (periodsToAdd*s.repeatInfo).toString());
                            eventEnd = addToSplitDate(s.end, 'day', (periodsToAdd*s.repeatInfo).toString());
                            // add scheduled events until event start is after calendar end
                            while (checkSplitDateIsBefore(eventStart,end)) {
                                // Add start and end to schedule unless start-end is completely out of its effective range
                                if (checkSplitDateIsBefore(s.effectiveStart, eventEnd) && (s.effectiveEnd.month === "NA" || checkSplitDateIsBefore(eventStart, s.effectiveEnd))) {
                                    newScheduledEvents.push({ ...eventSkeleton, start: eventStart, end: eventEnd });
                                }
                                // Add one interval to start and end
                                eventStart = addToSplitDate(eventStart, 'day', s.repeatInfo);
                                eventEnd = addToSplitDate(eventEnd, 'day', s.repeatInfo);
                            }
                            return;
                        case 'daily':
                            // get difference in days between calendar start and event end
                            cStart_eEndDiff = splitDateDifference(start, s.end, 'day');
                            // find the number of weeks to add to reach calendar range (could be negative)
                            periodsToAdd = Math.ceil(cStart_eEndDiff / 7);
                            // add days to get first start and end within calendar range
                            eventStart = addToSplitDate(s.start, 'day', (periodsToAdd).toString());
                            eventEnd = addToSplitDate(s.end, 'day', (periodsToAdd).toString());
                            // add scheduled events until event start is after calendar end
                            while (checkSplitDateIsBefore(eventStart, end)) {
                                // Add start and end to schedule unless start-end is completely out of its effective range
                                if (checkSplitDateIsBefore(s.effectiveStart, eventEnd) && (s.effectiveEnd.month === "NA" || checkSplitDateIsBefore(eventStart, s.effectiveEnd))) {
                                    newScheduledEvents.push({ ...eventSkeleton, start: eventStart, end: eventEnd });
                                }
                                // Add one interval to start and end
                                eventStart = addToSplitDate(eventStart, 'day', '1');
                                eventEnd = addToSplitDate(eventEnd, 'day', '1');
                            }
                            return;
                        case 'weekly':
                            // get difference in days between calendar start and event end
                            cStart_eEndDiff = splitDateDifference(start, s.end, 'day');
                            // find the number of weeks to add to reach calendar range (could be negative)
                            periodsToAdd = Math.ceil(cStart_eEndDiff);
                            // add days to get first start and end within calendar range
                            eventStart = addToSplitDate(s.start, 'day', (periodsToAdd).toString());
                            eventEnd = addToSplitDate(s.end, 'day', (periodsToAdd).toString());
                            let iter = 0;
                            while (iter < 10 && formatSplitDateToJsDate(eventEnd).getDay() !== parseInt(s.repeatInfo)) {
                                eventStart = addToSplitDate(eventStart, 'day', '-1');
                                eventEnd = addToSplitDate(eventEnd, 'day', '-1');
                            }
                            // add scheduled events until event start is after calendar end
                            while (checkSplitDateIsBefore(eventStart, end)) {
                                // Add start and end to schedule unless start-end is completely out of its effective range
                                if (checkSplitDateIsBefore(s.effectiveStart, eventEnd) && (s.effectiveEnd.month === "NA" || checkSplitDateIsBefore(eventStart, s.effectiveEnd))) {
                                    newScheduledEvents.push({ ...eventSkeleton, start: eventStart, end: eventEnd });
                                }
                                // Add one interval to start and end
                                eventStart = addToSplitDate(eventStart, 'day', '7');
                                eventEnd = addToSplitDate(eventEnd, 'day', '7');
                            }
                            return;
                        case 'monthly':
                            // find difference in months between reference end and calendar start
                            periodsToAdd = splitDateDifference(start, s.end, 'month');
                            // create initial dates
                            initStart = {
                                ...s.start,
                                month: ((parseInt(s.start.month) + periodsToAdd - 1) % 12 + 1).toString(),
                                year: ((parseInt(s.start.year) + Math.floor((parseInt(s.start.month) + periodsToAdd - 1) / 12)))
                            };
                            initEnd = {
                                ...s.end,
                                month: ((parseInt(s.end.month) + periodsToAdd - 1) % 12 + 1).toString(),
                                year: ((parseInt(s.end.year) + Math.floor((parseInt(s.end.month) + periodsToAdd - 1) / 12)))
                            };
                            // start one early and end one late to catch literal edge cases
                            for (let i = -1; i < splitDateDifference(end, start, 'month') + 1; i++) {
                                eventStart = addToSplitDate(initStart, 'month', i.toString());
                                eventEnd = addToSplitDate(initEnd, 'month', i.toString());
                                if (checkSplitDateIsBefore(s.effectiveStart, eventEnd) && (s.effectiveEnd.month === "NA" || checkSplitDateIsBefore(eventStart, s.effectiveEnd))) {
                                    newScheduledEvents.push({
                                        ...eventSkeleton,
                                        start: eventStart,
                                        end: eventEnd
                                    });
                                }
                            }
                            return;
                        case 'annually':
                            // find difference in years between reference end and calendar start
                            periodsToAdd = splitDateDifference(start, s.end, 'year');
                            // create initial dates
                            initStart = {
                                ...s.start,
                                year: (parseInt(s.start.year) + periodsToAdd).toString()
                            };
                            initEnd = {
                                ...s.end,
                                year: (parseInt(s.end.year) + periodsToAdd).toString()
                            };
                            // start one early and end one late to catch literal edge cases
                            for (let i = -1; i < splitDateDifference(end, start, 'year') + 1; i++) {
                                eventStart = addToSplitDate(initStart, 'year', i.toString());
                                eventEnd = addToSplitDate(initEnd, 'year', i.toString());
                                if (checkSplitDateIsBefore(s.effectiveStart, eventEnd) && (s.effectiveEnd.month === "NA" || checkSplitDateIsBefore(eventStart, s.effectiveEnd))) {
                                    newScheduledEvents.push({
                                        ...eventSkeleton,
                                        start: eventStart,
                                        end: eventEnd
                                    });
                                }
                            }
                            return;
                        default:
                            return;
                    }
                } catch (err) {
                    console.error(err);
                }

            })
        })
        setSchedules(newScheduledEvents);
    }

    /** Add a date for every day in start-end range (inclusive) and order them 2d to organize into rows */
    const spanRange = () => {
        // 2d array containing dates within range
        let newDates = [];
        // element of newDates contianing the week to be added
        let row = [];
        let date = start;
        // If range is less than a week just use one row
        if (splitDateDifference(end, start, 'day') < 7) {
            while (checkSplitDateIsBefore(date, end)) {
                row.push(date);
                date = addToSplitDate(date, 'day', '1');
            }
            newDates = [row];
        } else {
            while (checkSplitDateIsBefore(date, end)) {
                // If Saturday and row not empty, push the row into newDates
                row.push(date);
                if (formatSplitDateToJsDate(date).getDay() === 6 && row.length > 0) {
                    // Fill not full first row with empty cells
                    while (row.length < 7) {
                        row = [{
                            month: 'NA',
                            day: 'NA',
                            year: 'NA',
                            hour: 'NA',
                            minute: 'NA'
                        }, ...row];
                    }
                    newDates.push(row);
                    row = [];
                }
                date = addToSplitDate(date, 'day', '1');
            }
            // Fill not full last row with empty cells
            while (row.length < 7) {
                row.push({
                    month: 'NA',
                    day: 'NA',
                    year: 'NA',
                    hour: 'NA',
                    minute: 'NA'
                });
            }
            newDates.push(row);
        }
        setDates(newDates);
        if (logCheck(printLevel, ['s']) === 1) { console.log('Calendar date span updated') }
        else if (logCheck(printLevel, ['s']) === 2) { console.log('Range:', start, ' to ', end, ' yielded: ', newDates) }
    }

    /** Add selected to selectedDirs and remove any subdirectories */
    const addSelectedDir = (selected) => {
        if (selected !== '') {
            const newDirs = [ 
                ...selectedDirs.filter(dir => (
                    dir.split('/').length <= selected.split('/').length ||
                    dir.split('/').slice(0, selected.split('/').length).join('/') !== selectedDir)
                ), 
                selected
            ];
            setSelectedDirs(newDirs);
            setSelectedDir(selected.split('/').slice(0, selected.split('/').length - 1).join('/'));
        }
    }

    /** Remove selected from selectedDirs */
    const removeSelectedDir = (selected) => {
        setSelectedDirs(prevState => prevState.filter(dir => dir !== selected));
    }

    return (
        <div className={ fullDisplay ? "mainContainer" : undefined }>
            { /** Customize Dates and include/exclude only available when fullDisplay is true */
                fullDisplay &&
                    <div>
                        {/** Input range of dates */}
                        <div className="flexDivRows">
                            <p>Dates: </p>
                            <DateInput date={start} setDate={setStart} />
                            <p>-</p>
                            <DateInput date={end} setDate={setEnd} />
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
                                        selectedDir.split('/').map((dir, i) => (
                                            <option key={i} value={selectedDir.split('/').slice(0,i+1).join('/')}>
                                                {selectedDir.split('/').slice(0,i+1).join('/')}
                                            </option>
                                        ))
                                }
                                {// Return subdirectories based on selectedDir
                                    allDirs.length > 0 &&
                                    [...new Set(
                                        allDirs.map((dir) => {
                                            // return all leading directories if selectedDir is empty
                                            if (selectedDir === '' && !selectedDirs.includes(dir.split('/')[0])) {
                                                return dir.split('/')[0];
                                            }
                                            // return all subdirectories of selectedDir
                                            else if (
                                                selectedDir !== '' &&
                                                dir.startsWith(selectedDir) && 
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
                            <div className="moreLink">
                                <button onClick={() => addSelectedDir(selectedDir)}>
                                    +
                                </button>
                                <p className={rookie ? "more" : "moreDisabled"} style={{ textAlign: 'left' }}>
                                    Add {selectedDir} to the list of directories to include or exclude.
                                </p>
                            </div>
                            <div className="moreLink">
                                <button onClick={() => setInclude(!include)}>
                                    {include ? 'Exclude Directories' : 'Include Directories'}
                                </button>
                                <div className="more">
                                    <p style={{ textAlign: 'left' }}>
                                        Currently { include ? 'including ' : 'excluding ' }
                                        { selectedDirs.length > 0 ? 'the following directories and their subdirectories. Click to remove from list.' : 'all directories.'}
                                    </p>
                                    <div className="bulletList">
                                        {/** map selectedDirs */
                                            selectedDirs.length > 0 && selectedDirs.map((dir, i) => (
                                                <div key={i} className="flexDivRows">
                                                    <p 
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => removeSelectedDir(dir)}>
                                                        {dir}
                                                    </p>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>                                                   
                        {/** .more display for Reload Calendar button */}
                        <div className="flexDivRows">
                            <div className="moreLink">
                                <button onClick={() => spanRange()}>Reload Calendar</button>
                                <div className="more">
                                    <p style={{ textAlign: 'left' }}>
                                        Load calendar information from&nbsp;
                                        {formatSplitDateToString(start, false)}&nbsp;
                                        to {formatSplitDateToString(end, false)}
                                        {
                                            selectedDirs[0] && (
                                                <>{include ? ' including ' : ' excluding '} {selectedDirs.join(', ')}</>
                                            )
                                        }
                                        .
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
            }
            { /** Logging buttons
            <button onClick={() => console.log(records)}>Log Records</button>
            <button onClick={() => console.log(schedules)}>Log Schedules</button>
            <button onClick={() => console.log(resolutions)}>Log Resolutions</button>
            <button onClick={() => console.log(allDirs)}>Log allDirs</button>
            <button onClick={() => console.log(selectedDirs)}>Log selectedDirs</button>
            <button onClick={() => console.log(dates)}>Log dates</button>
            <button onClick={() => console.log(selection)}>Log Selection</button>
            */ }
            {/** Display calendar */}
            <CalendarView
                printLevel={printLevel}
                userID={userID}
                setCurrentObj={setCurrentObj}
                selectFn={selectFn}
                dates={dates}
                records={records}
                schedules={schedules}
                resolutions={resolutions}
                selection={selection}
                setSelection={setSelection}
                setDetectDelete={setDetectDelete} />
        </div>
    );
}

/** For editing start and end date/time of schedule */
const DateInput = ({ rookie, date, setDate }) => {

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

/** Displays calendar */
const CalendarView = ({ rookie, printLevel, userID, setCurrentObj, selectFn, dates, records, schedules, resolutions, selection, setSelection, setDetectDelete }) => {

    const [selectedCell, setSelectedCell] = useState({ row: null, col: null });

    // Set selected cell to today in default range, else set to null
    useEffect(() => {
        if (dates.length > 0 && dates[0].length > 1 &&
            formatSplitDateToString(dates[0][1], false) === getCurrentDateTime(true).date) {
            setSelectedCell({ row: 0, col: 1 });
        } else {
            setSelectedCell({ row: null, col: null});
        }
    },[dates]);

    /** calculates the width of a given cell based on which cell was selected */
    const calcCellWidth = (i, j) => {
        if (selectedCell.row === i) {
            if (selectedCell.col === j) {
                return `50%`;
            } else {
                return `calc( 50% / ${dates[i].length - 1} )`;
            }
        } else {
            return `calc( 100% / ${dates[i].length} )`;
        }
    }

    return (
        <div style={{ border: '1px solid black', width: '100%' }}>
            {
                dates.length > 0 &&
                dates.map((row, i) => (
                    <div key={'row'+i} className="flexDivRows">
                        {
                            row.map((date, j) => {
                                // Only use records with end times equal to the cell's date
                                const filteredRecords = records.filter((record) => (
                                    convertUTCDateTimeToLocal(record.dateTime).date === formatSplitDateToString(date, false)
                                ));
                                // Only use schedules that overlap with cell's date
                                const filteredSchedules = schedules.filter((schedule) => (
                                    // Use schedule where end is equal to cell's date
                                    formatSplitDateToString(schedule.end, false) === formatSplitDateToString(date, false) 
                                    ||
                                    // Use schedules where start is equal to cell's date
                                    formatSplitDateToString(schedule.start, false) === formatSplitDateToString(date, false)
                                    ||
                                    // Use schedules where start is before date and end is after it
                                    (checkSplitDateIsBefore(schedule.start, date) && checkSplitDateIsBefore(date, schedule.end))
                                ));
                                const filteredResolutions = resolutions.filter((resolution) => (
                                    convertUTCDateTimeToLocal(resolution.dateTime).date === formatSplitDateToString(date, false)
                                ));
                                return (
                                    <Cell key={'cell'+i+'-'+j}
                                        rookie={rookie}
                                        printLevel={printLevel}
                                        userID={userID}
                                        date={date}
                                        setCurrentObj={setCurrentObj}
                                        selectFn={selectFn}
                                        records={filteredRecords}
                                        schedules={filteredSchedules}
                                        resolutions={filteredResolutions}
                                        selection={selection}
                                        setSelection={setSelection}
                                        setDetectDelete={setDetectDelete}
                                        cellWidth={calcCellWidth(i, j)}
                                        cellLoc={{ row: i, col: j }}
                                        setSelectedCell={setSelectedCell} />
                                );
                            })
                        }
                    </div>
                ))
            }
        </div>
    );
}

/** Displays each day in the calendar */
const Cell = ({ rookie, printLevel, userID, setCurrentObj, selectFn, date, records, schedules, resolutions, selection, setSelection, setDetectDelete, cellWidth, cellLoc, setSelectedCell }) => {

    // list records and schedules in chronological order
    const [chronologicalEvents, setChronologicalEvents] = useState([]);
    // When set, overlay appears with corresponding question and options
    const [overlay, setOverlay] = useState({ method: 'none' });

    // Call orderEvents on load of schedules and records
    useEffect(() => {
        orderEvents(schedules, records);
    }, [schedules, records]);

    /** Order schedules and records chronoologically */
    const orderEvents = (schedules, records) => {
        let newOrderedEvents = [ 
            ...records.map((r) => ({ type: 'record', ...r })),
            ...schedules.map((s) => ({ type: 'schedule', ...s }))
        ];

        newOrderedEvents.sort((a, b) => {
            const dateA = a.type === 'record' ? formatDateTimeToSplitDate(convertUTCDateTimeToLocal(a.dateTime)) : a.end;
            const dateB = b.type === 'record' ? formatDateTimeToSplitDate(convertUTCDateTimeToLocal(b.dateTime)) : b.end;
            if (checkSplitDateIsBefore(dateA, dateB)) {
                return -1;
            } else {
                return 1;
            }
        });

        setChronologicalEvents(newOrderedEvents);
    }

    /** gets object and setsCuurent object then calls function */
    const openFile = async (open) => {
        /** Get customUI 
         * In options: remove schedule and add schedule converted to UTC end as 'resolve' attribute
         * In payload: Set start and end times according to schedule
         * Open 'record' function with new object
        */
        if (open.method === 'resolve') {
            try {
                const obj = {
                    userID: userID,
                    table: 'customUI',
                    dir: open.dir,
                    filename: open.filename,
                    dateTime: open.dateTime
                };
                const response = await newFetchObject(obj);
                // Remove schedules and add resolution property with dateTime of schedule
                const { schedule, ...other } = response.options;
                const updatedOptions = { ...other, resolved: formatSplitDateToDateTime(convertLocalSplitDateToUTC(open.end)) };
                // Set start and end time to scheduled times
                const updatedPayload = response.payload.map((item) => {
                    if (item.type === 'start') {
                        return { ...item, ...open.start };
                    } else if (item.type === 'end') {
                        return { ...item, ...open.end };
                    } else {
                        return item;
                    }
                });
                if (response.truth) {
                    setCurrentObj({
                        ...obj,
                        dateTime: { date: '', time: '' },
                        options: updatedOptions,
                        payload: updatedPayload
                    });
                    selectFn('record', false);
                } else {
                    throw new Error(`${response.status} Error fetching ${obj.dir}/${obj.filename} version: ${formatDateTimeToString(obj.dateTime)} from 'customUI': ${response.msg}`)
                }
            } catch (err) {
                console.error(err);
            }
        }
        /** Get customUI or record 
         * convert options.schedule and payload elements with type 'start' and 'end' to local
         * (schedule will only apply to customUI and payload will only apply to record)
         */
        else if (open.method === 'edit') {
            try {
                let tableToUse;
                if (open.type === 'schedule') {
                    tableToUse = 'customUI';
                } else if (open.type === 'record') {
                    tableToUse = 'record';
                } else {
                    throw new Error(`Unexpected selection type: ${open.type}`);
                }
                // record dateTimes were converted upon load, but not schedules
                const obj = {
                    userID: userID,
                    table: tableToUse,
                    dir: open.dir,
                    filename: open.filename,
                    dateTime: open.dateTime
                };
                const response = await newFetchObject(obj);
                if (response.truth) {
                    // convert the start and end elements if loading a record (if schedule they should be void of a splitDate)
                    const loadedObj = {
                        ...obj,
                        options: response.options,
                        payload: response.payload
                    };
                    const convertedObj = convertObjTimes(loadedObj, true, false, true, true);
                    setCurrentObj(convertedObj);
                    selectFn(tableToUse, false);
                } else {
                    throw new Error(`${response.status} Error fetching ${obj.dir}/${obj.filename} version: ${formatDateTimeToString(obj.dateTime)} from 'customUI': ${response.msg}`)
                }
            } catch (err) {
                console.error(err);
            }
        }
        /** Delete according to contents of open */
        else if (open.method === 'delete') {
            try {
                let tableToUse;
                if (open.type === 'schedule') {
                    tableToUse = 'customUI';
                } else if (open.type === 'record') {
                    tableToUse = 'record';
                } else {
                    throw new Error(`Unexpected selection type: ${open.type}`);
                }
                const response = await newDeleteEntry(tableToUse, open.dateTime, userID, open.dir, open.filename);
                if (response.truth) {
                    if (logCheck(printLevel, ['d', 'b']) > 0) { console.log(`${open.dir}/${open.filename} version: (${formatDateTimeToString(open.dateTime)}) succesfully deleted`) }
                    setOverlay({ method: 'none' });
                    setDetectDelete({ type: open.type });
                } else {
                    throw new Error(`${response.status} Error deleting file: '${open.dir}/${open.filename}' version(${formatDateTimeToString(open.dateTime)}) in '${open.table}', err: ${response.message}`);
                }
            } catch (err) {
                console.error(err);
            }
        }
        /** Delete resolution according to contents of open where .end is converted to UTC */
        else if (open.method === 'unresolve') {
            try {
                const dateTimeToUse = formatSplitDateToDateTime(convertLocalSplitDateToUTC(open.end));
                const response = await newDeleteEntry('resolve', dateTimeToUse, userID, open.dir, open.filename);
                if (response.truth) {
                    if (logCheck(printLevel, ['d', 'b']) > 0) { console.log(`${open.dir}/${open.filename} version: (${formatDateTimeToString(dateTimeToUse)}) succesfully deleted with unresolve`) }
                    setOverlay({ method: 'none' });
                    setDetectDelete({ type: 'resolve' });
                } else {
                    throw new Error(`${response.status} Error deleting file with unresolve: '${open.dir}/${open.filename}' version(${formatDateTimeToString(dateTimeToUse)}) in 'resolve', err: ${response.message}`);
                }
            } catch (err) {
                console.error(err);
            }
        }
        /** Err */
        else {
            console.error(`Attempting unrecognized action on ${selection.dir}/${selection.file} version: (${formatDateTimeToString(selection.dateTime)}).`)
        }
    }

    /** Save resolution upon checkbox click or delete on overlay call */
    const quickResolve = async (schedule) => {
        const resolveResponse = await newSaveObject({
            userID: userID,
            table: 'resolve',
            dir: schedule.dir,
            filename: schedule.filename,
            dateTime: formatSplitDateToDateTime(convertLocalSplitDateToUTC(schedule.end)),
            options: null,
            payload: null
        });
        if (resolveResponse.truth) {
            if (logCheck(printLevel, ['d', 'b']) > 0) { console.log(`resolved ${schedule.dir}/${schedule.filename} version (${formatSplitDateToString(convertLocalSplitDateToUTC(schedule.end))})`) }
            setDetectDelete({ type: 'resolve' });
        } else {
            throw new Error(`failed to resolve ${schedule.dir}/${schedule.filename} version (${formatSplitDateToString(convertLocalSplitDateToUTC(schedule.end))})`)
        }
    }

    return (
        <div key={`cellDiv${cellLoc.row}-${cellLoc.row}`} className="flexDivColumns" style={{ cursor: 'pointer', height: '20vh', width: cellWidth, border: '1px solid black' }}>
            { /** Display cell */
                date.month !== "NA" &&
                <div onClick={() => setSelectedCell(cellLoc)} style={{ overflow: 'auto'}}>
                    <p>{getWeekdayString(formatSplitDateToJsDate(date).getDay())} {formatSplitDateToString(date, false)}</p>
                    {
                        chronologicalEvents.length > 0 &&
                        chronologicalEvents.map((event,i) => {
                            if (event.type === 'record') {
                                const isSelected = (
                                    selection?.type === 'record' &&
                                    selection?.dir === event.dir &&
                                    selection?.filename === event.filename &&
                                    formatDateTimeToString(selection?.dateTime) === formatDateTimeToString(event.dateTime)
                                );
                                let displayString = isSelected
                                    ? `${event.dir}/${event.filename} ${convertUTCDateTimeToLocal(event.dateTime).time}`
                                    : `${event.filename} ${convertUTCDateTimeToLocal(event.dateTime).time}`;
                                return (
                                    <div key={`cellDiv${cellLoc.row}-${cellLoc.row}-index${i}`} className="flexDivRows" style={{ flexWrap: 'nowrap'}}>
                                        <p  
                                            style={{ 
                                                fontSize: '60%', 
                                                color: 'blue',
                                                fontWeight: isSelected ? 'bold' : undefined
                                            }} 
                                            onClick={() => isSelected ? setSelection(null) : setSelection(event)}>
                                            {displayString}
                                        </p>
                                        {// Include buttons if selected
                                            isSelected &&
                                            <SelectionInterface
                                                printLevel={printLevel}
                                                selection={event}
                                                isResolved={false}
                                                setOverlay={setOverlay} />
                                        }
                                    </div>
                                );
                            } else if (event.type === 'schedule') {
                                const isSelected = (
                                    selection?.type === 'schedule' &&
                                    selection?.dir === event.dir &&
                                    selection?.filename === event.filename &&
                                    formatDateTimeToString(selection?.dateTime) === formatDateTimeToString(event.dateTime) &&
                                    formatSplitDateToString(selection?.end) === formatSplitDateToString(event.end) &&
                                    formatSplitDateToString(selection?.start) === formatSplitDateToString(event.start)
                                );
                                const isResolved = resolutions.some(resolution => 
                                    resolution.dir === event.dir &&
                                    resolution.filename === event.filename &&
                                    formatDateTimeToString(convertUTCDateTimeToLocal(resolution.dateTime)) === formatSplitDateToString(event.end)
                                );
                                let displayString = isSelected 
                                    ?   `${event.dir}/${event.filename} `
                                    :   `${event.filename} `;
                                if (formatSplitDateToString(event.start, false) === formatSplitDateToString(date, false)) {
                                    displayString += `${event.start.hour}:${event.start.minute} - `;
                                } else {
                                    displayString += `${formatSplitDateToString(event.start)} - `;
                                } if (formatSplitDateToString(event.end, false) === formatSplitDateToString(date, false)) {
                                    displayString += `${event.end.hour}:${event.end.minute}`;
                                } else {
                                    displayString += `${formatSplitDateToString(event.end)}`;
                                }
                                return (
                                    <div key={`cellDiv${cellLoc.row}-${cellLoc.row}-index${i}`} className="flexDivColumns">
                                        <div className="flexDivRows" style={{ flexWrap: 'nowrap' }}>
                                            <p 
                                                className={isResolved ? "checked" : "unchecked"}
                                                onClick={() => !isResolved ? quickResolve(event) : setOverlay({ method: 'unresolve', ...event })}>
                                                &#10003;
                                            </p>
                                            <p  key={'schedule'+i}
                                                style={{ 
                                                    fontSize: '60%', 
                                                    color: 'green',
                                                    textWrap: 'nowrap',
                                                    fontWeight: isSelected ? 'bold' : undefined
                                                }} 
                                                onClick={() => isSelected ? setSelection(null) : setSelection(event)}>
                                                {displayString}
                                            </p>
                                        </div>
                                        {// Include buttons if selected
                                            isSelected &&
                                            <SelectionInterface
                                                printLevel={printLevel}
                                                selection={event}
                                                isResolved={isResolved}
                                                setOverlay={setOverlay} />
                                        }
                                    </div>
                                );
                            } else {
                                return <p key={`cellDiv${cellLoc.row}-${cellLoc.row}-index${i}`}>You shouldn't see this...</p>;
                            }
                        })
                    }
                </div>
            } 
            {/** Overlay content with inquiry and options */
                overlay.method !== 'none' &&
                <div className="overlay">
                    <div className="flexDivColumns">
                        {
                            overlay.method === 'resolve' ?
                                <p>Continue to be redirected to resolve {overlay.dir}/{overlay.filename}?</p>
                            : overlay.method === 'edit' ?
                                <p>Continue to be redirected to edit {overlay.dir}/{overlay.filename}?</p>
                            : overlay.method === 'delete' ?
                                <p>Are you sure you want to delete {overlay.dir}/{overlay.filename}?</p>
                            : overlay.method === 'unresolve' ?
                                <p>Are you sure you want to unresolve {overlay.dir}/{overlay.filename}? If you resolved this with a record it will be deleted.</p>
                            :   <p>Not sure how you got here... press "No"</p>
                        }
                        <div>
                            <button onClick={() => openFile(overlay)}>
                                Yes
                            </button>
                            <button onClick={() => setOverlay({ method: 'none' })}>No</button>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
}

/** Displays UI to act on selection with */
const SelectionInterface = ({ rookie, printLevel, selection, isResolved, setOverlay }) => {

    if (selection.type === 'schedule') {
        return (
            <div className="flexDivRows" style={{ flexWrap: 'nowrap' }}>
                {// display resolve of unresolve depending on isResolved value
                    !isResolved && <button onClick={() => setOverlay({ method: 'resolve', ...selection })}>Record</button>
                }
                <button onClick={() => setOverlay({ method: 'edit', ...selection })}>Edit</button>
                <button onClick={() => setOverlay({ method: 'delete', ...selection })}>Delete</button>
            </div>
        );
    } else if (selection.type === 'record') {
        return (
            <div className="flexDivRows" style={{ flexWrap: 'nowrap' }}>
                <button onClick={() => setOverlay({ method: 'edit', ...selection })}>Edit</button>
                <button onClick={() => setOverlay({ method: 'delete', ...selection })}>Delete</button>
            </div>
        );
    } else {
        return <p>You shouldn't be here...</p>
    }
}
