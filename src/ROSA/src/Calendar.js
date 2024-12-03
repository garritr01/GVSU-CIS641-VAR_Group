import React, { useState, useEffect, useRef
} from 'react';

import {
    getCurrentSplitDate, addToSplitDate, logCheck, filterByRange,
    checkSplitDateIsBefore, splitDateDifference,
    formatSplitDateToString,
    formatSplitDateToJsDate,
    formatDateTimeToSplitDate,
    formatDateTimeToString,
    convertUTCSplitDateToLocal,
    convertLocalSplitDateToUTC,
    convertUTCDateTimeToLocal,
    convertLocalDateTimeToUTC,
    formatSplitDateToDateTime,
    convertObjTimes
} from './oddsAndEnds';

import { 
    newDeleteEntry,
    newFetchDirsAndFiles, newFetchObject, newFetchObjects
} from './generalFetch';

/** Displays calendar and handles opening functions from calendar */
export const Calendar = ({ printLevel, selectFn, setCurrentObj, userID, fullDisplay = true }) => {

    const time = getCurrentSplitDate(true);
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
    // Contain all resolutions
    const [resolutions, setResolutions] = useState([]);
    // object to contain file information when selected
    const [selection, setSelection] = useState(null);
    // boolean to trigger reload upon deletion
    const [detectDelete, setDetectDelete] = useState(null);
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
        getResolutions();
        spanRange();
    }, []);

    // Remove record or schedule upon deletion
    useEffect(() => {
        if (detectDelete) {
            console.log('triggered',detectDelete.type);
            if (detectDelete.type === 'schedule') {
                getScheduleInfo();
            } else {
                getRecords();
                getResolutions();
            }
            setDetectDelete(null);
        }
    },[detectDelete])

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
                const objectsResponse = await newFetchObjects('customUI', userID, response.files, ['options']);
                if (objectsResponse.truth) {
                    // Convert any schedules that are in UTC to local
                    const convertedObjs = objectsResponse.objects.map((obj) => {
                        const convertedSchedules = obj.options?.schedule.map((s) => {
                            if (!s.local) {
                                return {
                                    ...s,
                                    effectiveStart: convertUTCSplitDateToLocal(s.effectiveStart),
                                    effectiveEnd: convertUTCSplitDateToLocal(s.effectiveEnd),
                                    start: convertUTCSplitDateToLocal(s.start),
                                    end: convertUTCSplitDateToLocal(s.end),
                                };
                            } else {
                                return { ...s };
                            }
                        });
                        return {
                            ...obj,
                            options: {
                                ...obj.options,
                                schedule: convertedSchedules
                            }
                        }
                    });
                    setScheduleInfo(convertedObjs);
                    defineSchedules(convertedObjs);
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
                setRecords(response.files.map((file) => {
                    return {
                        ...file,
                        dateTime: convertUTCDateTimeToLocal(file.dateTime)
                    };
                }));
                if (logCheck(printLevel, ['s']) === 1) { console.log(`Successfully got dirs and filenames from 'record'`) }
            } else {
                throw new Error(`${response.status} Error getting dirs and files from 'record': ${response.msg}`);
            }
        } catch (err) {
            setRecords([]);
            console.error(err);
        }
    }

    const getResolutions = async () => {
        try {
            const response = await newFetchDirsAndFiles('resolve', userID);
            if (response.truth) {
                setResolutions(response.files.map((file) => {
                    return {
                        ...file,
                        dateTime: convertUTCDateTimeToLocal(file.dateTime)
                    };
                }));
                if (logCheck(printLevel, ['s']) === 1) { console.log(`Successfully got dirs and filenames from 'resolve'`) }
            } else {
                throw new Error(`${response.status} Error getting dirs and files from 'resolve': ${response.msg}`);
            }
        } catch (err) {
            setResolutions([]);
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
            <button onClick={() => console.log(resolutions)}>Log Resolutions</button>
            <button onClick={() => console.log(allDirs)}>Log allDirs</button>
            <button onClick={() => console.log(selectedDirs)}>Log selectedDirs</button>
            <button onClick={() => console.log(dates)}>Log dates</button>
            <button onClick={() => console.log(selection)}>Log Selection</button>
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

/** Displays calendar */
const CalendarView = ({ printLevel, userID, setCurrentObj, selectFn, dates, records, schedules, resolutions, selection, setSelection, setDetectDelete }) => {

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
                    <div key={'row'+i} className="flexDivRows">
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
                                const filteredResolutions = resolutions.filter((resolution) => (
                                    resolution.dateTime.date === formatSplitDateToString(date, false)
                                ));
                                return (
                                    <Cell
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
const Cell = ({ printLevel, userID, setCurrentObj, selectFn, date, records, schedules, resolutions, selection, setSelection, setDetectDelete, cellWidth, cellLoc, setSelectedCell }) => {

    // list records and schedules in chronological order
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
                                return (
                                    <div className="flexDivRows">
                                        <p  key={'record'+i}
                                            style={{ 
                                                fontSize: '60%', 
                                                color: 'blue',
                                                fontWeight: isSelected ? 'bold' : undefined
                                            }} 
                                            onClick={() => setSelection(event)}>
                                            {event.dir}/{event.filename} {formatDateTimeToString(event.dateTime)}
                                        </p>
                                        {// Include buttons if selected
                                            isSelected &&
                                            <SelectionInterface
                                                printLevel={printLevel}
                                                userID={userID}
                                                selection={selection}
                                                isResolved={false}
                                                setDetectDelete={setDetectDelete}
                                                setCurrentObj={setCurrentObj}
                                                selectFn={selectFn} />
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
                                    formatDateTimeToString(resolution.dateTime) === formatSplitDateToString(event.end)
                                );
                                return (
                                    <div className="flexDivRows">
                                        <p  key={'schedule'+i}
                                            style={{ 
                                                fontSize: '60%', 
                                                color: 'green',
                                                textDecoration: isResolved ? 'line-through' : undefined,
                                                fontWeight: isSelected ? 'bold' : undefined
                                            }} 
                                            onClick={() => setSelection(event)}>
                                            {event.dir}/{event.filename} {formatSplitDateToString(event.start)}-{formatSplitDateToString(event.end)}
                                        </p>
                                        {// Include buttons if selected
                                            isSelected &&
                                            <SelectionInterface
                                                printLevel={printLevel}
                                                userID={userID}
                                                selection={selection}
                                                isResolved={isResolved}
                                                setDetectDelete={setDetectDelete}
                                                setCurrentObj={setCurrentObj}
                                                selectFn={selectFn} />
                                        }
                                    </div>
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

/** Displays UI to act on selection with */
const SelectionInterface = ({ printLevel, userID, selection, isResolved, setDetectDelete, setCurrentObj, selectFn }) => {

    const [overlay, setOverlay] = useState('');

    /** gets object and setsCuurent object then calls function */
    const openFile = async (mode) => {
        /** Get customUI, remove options.schedule, 
         * set start and end to scheduled time, empty dateTime
         * then open 'record' function 
         * */
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
                // Remove schedules and add resolution property with dateTime of schedule
                const { schedule, ...other } = response.options;
                const updatedOptions = { ...other, resolved: selection };
                // Set start and end time to scheduled times
                const updatedPayload = response.payload.map((item) => {
                    if (item.type === 'start') {
                        return { ...item, ...selection.start };
                    } else if (item.type === 'end') {
                        return { ...item, ...selection.end };
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
        /** Get customUI or record and open respective function */
        else if (mode === 'edit') {
            try {
                let tableToUse;
                if (selection.type === 'schedule') {
                    tableToUse = 'customUI';
                } else if (selection.type === 'record') {
                    tableToUse = 'record';
                } else {
                    throw new Error(`Unexpected selection type: ${selection.type}`);
                }
                // record dateTimes were converted upon load, but not schedules
                const obj = {
                    userID: userID,
                    table: tableToUse,
                    dir: selection.dir,
                    filename: selection.filename,
                    dateTime: tableToUse === 'record'
                        ?   convertLocalDateTimeToUTC(selection.dateTime)
                        :   selection.dateTime
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
        /** Delete record or schedule (also delete resolution if 'unresolve') */
        else if (mode === 'delete') {
            try {
                let tableToUse;
                let dateTimeToUse;
                if (selection.type === 'schedule') {
                    tableToUse = 'customUI';
                    dateTimeToUse = selection.dateTime;
                } else if (selection.type === 'record') {
                    tableToUse = 'record';
                    dateTimeToUse = convertLocalDateTimeToUTC(selection.dateTime);
                } else {
                    throw new Error(`Unexpected selection type: ${selection.type}`);
                }
                const response = await newDeleteEntry(tableToUse, dateTimeToUse, userID, selection.dir, selection.filename);
                if (response.truth) {
                    if (logCheck(printLevel, ['d', 'b']) > 0) { console.log(`${selection.dir}/${selection.filename} version: (${formatDateTimeToString(dateTimeToUse)}) succesfully deleted`) }
                    setOverlay('');
                    setDetectDelete({ type: selection.type });
                } else {
                    throw new Error(`${response.status} Error deleting file: '${selection.dir}/${selection.filename}' version(${formatDateTimeToString(dateTimeToUse)}) in '${selection.table}', err: ${response.message}`);
                }
            } catch (err) {
                console.error(err);
            }
        }
        /** Delete resolve */
        else if (mode === 'unresolve') {
            try {
                const dateTimeToUse = formatSplitDateToDateTime(convertLocalSplitDateToUTC(selection.end));
                const response = await newDeleteEntry('resolve', dateTimeToUse, userID, selection.dir, selection.filename);
                if (response.truth) {
                    if (logCheck(printLevel, ['d', 'b']) > 0) { console.log(`${selection.dir}/${selection.filename} version: (${formatDateTimeToString(dateTimeToUse)}) succesfully deleted`) }
                    setOverlay('');
                    setDetectDelete({ type: 'resolve' });
                } else {
                    throw new Error(`${response.status} Error deleting file: '${selection.dir}/${selection.filename}' version(${formatDateTimeToString(dateTimeToUse)}) in 'resolve', err: ${response.message}`);
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

    return (
        <div>
            {/** Display actions related to selection */
                selection.type === 'schedule' ?
                    <div>
                        {// display resolve of unresolve depending on isResolved value
                            !isResolved
                            ?   <button onClick={() => setOverlay('resolve')}>Resolve</button>
                            :   <button onClick={() => setOverlay('unresolve')}>Unresolve</button>
                        }
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
                overlay &&
                <div className="overlay">
                    <div className="flexDivColumns">
                        {
                            overlay === 'resolve' ?
                            <p>Continue to be redirected to resolve {selection.dir}/{selection.filename}?</p>
                            : overlay === 'edit' ?
                            <p>Continue to be redirected to edit {selection.dir}/{selection.filename}?</p>
                            : overlay === 'delete' ?
                            <p>Are you sure you want to delete {selection.dir}/{selection.filename}?</p>
                            : overlay === 'unresolve' ?
                            <p>Are you sure you want to unresolve {selection.dir}/{selection.filename} and delete the corresponding record?</p>
                            : <p>Not sure how you got here... press "No"</p>
                        }
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
