import React, { useState, useEffect, useRef
} from 'react';

import {
    getCurrentSplitDate, addToSplitDate, logCheck, filterByRange,
    checkSplitDateIsBefore, splitDateDifference,
    formatSplitDateToString,
    formatSplitDateToJsDate,
    formatDateTimeToJsDate,
    formatDateTimeToSplitDate,
    formatDateTimeToString
} from './oddsAndEnds';

import { 
    newFetchDirsAndFiles, newFetchObject, newFetchObjects
} from './generalFetch';

/** Displays calendar and handles opening functions from calendar */
export const Calendar = ({ printLevel, selectFn, setCurrentObj, userID, fullDisplay = true }) => {

    const time = getCurrentSplitDate(true);
    // object to contain file information when selected
    const [selection, setSelection] = useState(null);
    // Define range of calendar to display
    const [start, setStart] = useState(addToSplitDate({ month: time.month, day: time.day, year: time.year }, 'day', '-1'));
    const [end, setEnd] = useState(addToSplitDate({ month: time.month, day: time.day, year: time.year }, 'day', '2'));
    // List of dates between start and end (inclusive)
    const [dates, setDates] = useState([]);
    // Contain directories from schedule and record
    const [allDirs, setAllDirs] = useState([]);
    // Contain all customUI schedules
    const [scheduleInfo, setScheduleInfo] = useState([]);
    // Contain all specific dates scheduled
    const [schedules, setSchedules] = useState([]);
    // Contain all records within range
    const [records, setRecords] = useState([]);
    // Used to include or exclude selected dirs
    const [include, setInclude] = useState(true);
    // Used to contain dirs to include or exclude
    const [selectedDirs, setSelectedDirs] = useState([]);
    // Used to contain dir input to add to selected array
    const [selectedDir, setSelectedDir] = useState('');

    // Get Records and define scheduled events on start or end change
    useEffect(() => {
        getRecords();
        if (scheduleInfo.length > 0) {
            defineSchedules(scheduleInfo);
        }
    }, [start, end]);

    // Get ScheduleInfo on initial render
    useEffect(() => {
        getScheduleInfo();
        spanRange();
    }, []);

    // Reset allDirs and allFiles on records or schedules change
    useEffect(() => {
        // Include each unique directory
        setAllDirs([ ...new Set([
            ...scheduleInfo.map(sched => sched.dir), 
            ...records.map(rec => rec.dir)
        ])]);
    },[records, scheduleInfo]);

    const getScheduleInfo = async () => {
        try {
            const response = await newFetchDirsAndFiles('customUI', userID);
            if (response.truth) {
                const outFiles = filterByRange(response.files,
                    { date: [start.month, start.day, start.year].join('/'), time: '00:00' },
                    { date: [end.month, end.day, end.year].join('/'), time: '00:00' });
                const objectsResponse = await newFetchObjects('customUI', userID, outFiles, ['options']);
                if (objectsResponse.truth) {
                    setScheduleInfo(objectsResponse.objects);
                    defineSchedules(objectsResponse.objects);
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
                    switch (s.repeatType) {
                        case 'none':
                            // if calendar start is before event end or event start is before calendar end add the schedule
                            if (checkSplitDateIsBefore(start, s.end) || checkSplitDateIsBefore(s.start, end)) {
                                newScheduledEvents.push({ ...eventSkeleton, start: s.start, end: s.end });
                            } 
                            return;
                        case 'specRpt':
                            // get difference in days between calendar start and event end
                            const cStarteEndDiff = splitDateDifference(start, s.end, 'day');
                            // find the number of periods to add to reach calendar range (could be negative)
                            const periodsToAdd = Math.ceil(cStarteEndDiff/ parseInt(s.repeatInfo));
                            // add days to get first start and end within calendar range
                            let eventStart = addToSplitDate(s.start, 'day', (periodsToAdd*s.repeatInfo).toString());
                            let eventEnd = addToSplitDate(s.end, 'day', (periodsToAdd*s.repeatInfo).toString());
                            // add scheduled events until event start is after calendar end
                            while (checkSplitDateIsBefore(eventStart,end)) {
                                newScheduledEvents.push({ ...eventSkeleton, start: eventStart, end: eventEnd });
                                eventStart = addToSplitDate(eventStart, 'day', s.repeatInfo);
                                eventEnd = addToSplitDate(eventEnd, 'day', s.repeatInfo);
                            }
                            return;
                        case 'weekly':
                        case 'monthly':
                        case 'annually':
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
                // If Sunday and row not empty, push the row into newDates
                if (formatSplitDateToJsDate(date).getDay() === 0 && row.length > 0) {
                    row.push(date);
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
                } else {
                    row.push(date);
                }
                date = addToSplitDate(date, 'day', '1');
            }
        }
        setDates(newDates);
        if (logCheck(printLevel, ['s']) === 1) { console.log('Calendar date span updated') }
        else if (logCheck(printLevel, ['s']) === 2) { console.log('Range:', start, ' to ', end, ' yielded: ', newDates) }
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
                            <button onClick={() => spanRange()}>Apply Dates</button>
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
            <button onClick={() => console.log(records)}>Log Records</button>
            <button onClick={() => console.log(schedules)}>Log Schedules</button>
            <button onClick={() => console.log(scheduleInfo)}>Log ScheduleInfo</button>
            <button onClick={() => console.log(allDirs)}>Log allDirs</button>
            <button onClick={() => console.log(selectedDirs)}>Log selectedDirs</button>
            <button onClick={() => console.log(dates)}>Log dates</button>
            <button onClick={() => console.log(selection)}>Log selection</button>
            {/** Selection interface */}
            {
                selection && <SelectionInterface selection={selection} userID={userID} setCurrentObj={setCurrentObj} selectFn={selectFn} />
            }
            {/** Display calendar */}
            <CalendarView
                printLevel={printLevel}
                setSelection={setSelection}
                records={records}
                schedules={schedules}
                dates={dates} />
        </div>
    );
}

/** For editing start and end date/time of schedule */
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

const SelectionInterface = ({ selection, userID, setCurrentObj, selectFn }) => {

    const [overlay, setOverlay] = useState('');

    const openFile = async (mode) => {
        if (mode === 'resolve') {
            try {
                const obj = {
                    userID: userID,
                    table: 'customUI',
                    dir: selection.dir,
                    filename: selection.filename,
                    dateTime: selection.dateTime
                };
                const response = await newFetchObject(obj);
                if (response.truth) {
                    setCurrentObj({ ...obj,
                        options: response.options,
                        payload: response.payload
                    });
                    selectFn('record',false);
                } else {
                    throw new Error(`${response.status} Error fetching ${obj.dir}/${obj.filename} version: ${formatDateTimeToString(obj.dateTime)} from 'customUI': ${response.msg}`)
                }
            } catch (err) {
                console.error(err);
            }
        }
    }

    return (
        <div>
            {/** Display selection information */
                selection.type === 'schedule' ?
                <p>Selected {selection.dir}/{selection.filename} {formatSplitDateToString(selection.start)}-{formatSplitDateToString(selection.end)}</p>
                : selection.type === 'record' ?
                <p>Selected {selection.dir}/{selection.filename} {formatDateTimeToString(selection.dateTime)}</p>
                : null
            }
            {/** Display actions related to selection */
                selection.type === 'schedule' ?
                    <div>
                        <button onClick={() => setOverlay('resolve')}>Resolve</button>
                        <button onClick={() => setOverlay('edit')}>Edit</button>
                        <button onClick={() => setOverlay('delete')}>Delete</button>
                    </div>
                : selection.type === 'record' ?
                    <div>
                        <button onClick={() => setOverlay('edit')}>Edit</button>
                        <button onClick={() => setOverlay('delete')}>Delete</button>
                    </div>
                : null
            }

            {/** Overlay content with edit inquiry */
                overlay === 'resolve' &&
                    <div className="overlay">
                        <div className="flexDivColumns">
                            <p>Continue to be redirected to resolve {selection.dir}/{selection.filename}?</p>
                            <div>
                                <button onClick={() => openFile(overlay)}>
                                        Yes
                                </button>
                                <button onClick={() => setOverlay('')}>No</button>
                            </div>
                        </div>
                    </div>
            }
        </div>
    );
}


/** Displays calendar */
const CalendarView = ({ printLevel, setSelection, records, schedules, dates }) => {

    const [selectedCell, setSelectedCell] = useState({ row: null, col: null});

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
                    <div key={i} className="flexDivRows">
                        {
                            row.map((date, j) => {
                                // Only use records with end times equal to the cell's date
                                const filteredRecords = records.filter((record) => (
                                    record.dateTime.date === formatSplitDateToString(date, false)
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
                                return (
                                    <Cell
                                        printLevel={printLevel}
                                        setSelection={setSelection}
                                        date={date}
                                        records={filteredRecords}
                                        schedules={filteredSchedules}
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
const Cell = ({ printLevel, setSelection, date, records, schedules, cellWidth, cellLoc, setSelectedCell }) => {

    const [chronologicalEvents, setChronologicalEvents] = useState([]);
    
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
            const dateA = a.type === 'record' ? formatDateTimeToSplitDate(a.dateTime) : a.end;
            const dateB = b.type === 'record' ? formatDateTimeToSplitDate(b.dateTime) : b.end;
            if (checkSplitDateIsBefore(dateA, dateB)) {
                return -1;
            } else {
                return 1;
            }
        });

        setChronologicalEvents(newOrderedEvents);
    }

    return (
        <div key={`${cellLoc.row}-${cellLoc.row}`} className="flexDivColumns" style={{ height: '20vh', width: cellWidth, border: '1px solid black' }}>
            { /** Display cell */
                date.month !== "NA" &&
                <div onClick={() => setSelectedCell(cellLoc)} style={{ overflow: 'auto'}}>
                    <h3>{formatSplitDateToString(date, false)}</h3>
                    {/**
                    <button onClick={() => console.log(date)}>Cell Date</button>
                    <button onClick={() => console.log(records)}>Cell Records</button>
                    <button onClick={() => console.log(schedules)}>Cell Schedules</button>
                    <button onClick={() => console.log(chronologicalEvents)}>Cell Events</button>
                    */}
                    {
                        chronologicalEvents.length > 0 &&
                        chronologicalEvents.map((event,i) => {
                            if (event.type === 'record') {
                                return (
                                    <p  key={i}
                                        style={{ fontSize: '60%' }} 
                                        onClick={() => setSelection(event)}>
                                        Record: {event.dir}/{event.filename} {formatDateTimeToString(event.dateTime)}
                                    </p>
                                );
                            } else if (event.type === 'schedule') {
                                return (
                                    <p  key={i}
                                        style={{ fontSize: '60%' }} 
                                        onClick={() => setSelection(event)}>
                                        Schedule: {event.dir}/{event.filename} {formatSplitDateToString(event.start)}-{formatSplitDateToString(event.end)}
                                    </p>
                                );
                            } else {
                                return null;
                            }
                        })
                    }
                </div>
            }
        </div>
    );
}