import React, { useState, useEffect, useRef 
} from 'react';

import {
    getCurrentDateTime, getCurrentSplitDate,
    getWeekdayString, convertLocalSplitDateToUTC, convertUTCSplitDateToLocal, logCheck,
    convertObjTimes,
    checkSplitDateIsBefore,
    formatJsDateToSplitDate,
    formatSplitDateToJsDate,
    formatSplitDateToString
} from './oddsAndEnds';

import { 
    newSaveObject, newFetchObject
} from './generalFetch';

import { FileAccess } from './Components';

/** Interface for creating UIs to use in CustomInput */
export const CustomUI = ({ rookie, printLevel, preselectedObj }) => {
    
    // Get object with local month, day, year, hour, minute
    const time = getCurrentSplitDate(true);

    // Use object
    const [obj, setObj] = useState(preselectedObj);
    // Contain loaded dir, filename, and version
    const [loadedInfo, setLoadedInfo] = useState({ dir: preselectedObj.dir, filename: preselectedObj.filename, dateTime: preselectedObj.dateTime });
    // Contain saved dir, filename and version along with status and message like 'Save' or 'Failed to save'
    const [savedInfo, setSavedInfo] = useState(null);
    // elementInfo contains the text to show describing the input
    const [elementInfo, setElementInfo] = useState({ type: '', label: '', choices: null, group: 0 });
    // include start time?
    const [includeStart, setIncludeStart] = useState(false);
    // ScheduleInfo contains info to add to obj.options.schedule
    const [scheduleInfo, setScheduleInfo] = useState({
        repeatType: '', repeatInfo: '1', local: true,
        start: time, end: time,
        effectiveStart: time, effectiveEnd: time
    });
    // Schedule validity holds boolean for each element of scheduleInfo a user can input
    const [scheduleValidity, setScheduleValidity] = useState({
        start: { month: true, day: true, year: true, hour: true, minute: true },
        end: { month: true, day: true, year: true, hour: true, minute: true },
        effectiveStart: { month: true, day: true, year: true, hour: true, minute: true },
        effectiveEnd: { month: true, day: true, year: true, hour: true, minute: true },
        repeatInfo: true
    });

    /** Get payload and options given relevant arguments */
    const getCustomUI = async () => {
        try {
            const response = await newFetchObject(obj);
            
            if (!response.truth) {
                throw new Error(`${response.status} Error getting ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time}):\n ${response.msg}`);
            } else {
                // Remove 'start' but remember it was there
                if (response.payload.find(item => item.type === 'start')) {setIncludeStart(true)}
                // Load options and payload (without start and end times)
                const startEndFilteredObj = {
                    ...obj,
                    options: response.options,
                    payload: response.payload.filter(item => item.type !== 'start' && item.type !== 'end')
                };
                // Convert the schedule
                const updatedObj = convertObjTimes(startEndFilteredObj, true, false, true, false);
                if (logCheck(printLevel, ['d', 'b']) > 0) { console.log(`Succesfully retrieved ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time})`) }
                if (logCheck(printLevel, ['o']) === 1) { console.log('obj updated by fetch') }
                else if (logCheck(printLevel, ['o']) === 2) { console.log('obj updated by fetch\n obj:', updatedObj) }
                setObj(updatedObj);
                setLoadedInfo({ dir: updatedObj.dir, filename: updatedObj.filename, dateTime: updatedObj.dateTime });
            }
        } catch (err) {
            console.error('Error getting customUI:', err);
        }
    }

    /** Save customUI */
    const saveCustomUI = async (overwrite) => {

        try {
            // Convert any schedules to UTC where local is false
            const convertedObj = convertObjTimes(obj, false, false, true, false);
            // empty date
            const emptyTime = { month: "NA", day: "NA", year: "NA", hour: "NA", minute: "NA"}
            // Add start if desired, add end always, '(...payload || [])' accounts for empty payload
            const outObj = { ...convertedObj, 
                payload: includeStart 
                    ? [ ...(convertedObj.payload || []), { type: "start", ...emptyTime }, { type: "end", ...emptyTime }]
                    : [ ...(convertedObj.payload || []), { type: "end", ...emptyTime }]}

            if (overwrite) {
                const response = await newSaveObject(outObj);
                if (response.truth) {
                    if (response.status === 200) {
                        if (logCheck(printLevel, ['d', 'b']) > 0) { console.log(`Overwrote file '${obj.dir}/${obj.filename}' version: (${obj.dateTime.date}-${obj.dateTime.time}) in '${obj.table}' with new entry`) }
                        setSavedInfo({ table: obj.table, dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime, message: 'Overwrote', truth: true });
                    } else {
                        setSavedInfo({ table: obj.table, dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime, message: 'Unexpected overwrite method. Investigate', truth: false });
                        throw new Error(`${response.status} Unexpected success attempting to overwrite file '${obj.dir}/${obj.filename}' version: (${obj.dateTime.date}-${obj.dateTime.time}) in '${obj.table}' with new entry:\n ${response.msg}`)       
                    }
                } else {
                    setSavedInfo({ table: obj.table, dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime, message: 'Failed to overwrite', truth: false });
                    throw new Error(`${response.status} Error attempting to overwrite file '${obj.dir}/${obj.filename}' version: (${obj.dateTime.date}-${obj.dateTime.time}) in '${obj.table}' with new entry:\n ${response.msg}`);
                }
            } else {
                const objToSave = { ...outObj, dateTime: getCurrentDateTime(false) };
                const response = await newSaveObject(objToSave);
                if (response.truth) {
                    if (response.status === 201) {
                        if (logCheck(printLevel, ['d', 'b'])) { console.log(`Successfully created '${objToSave.dir}/${objToSave.filename}' version: (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in '${objToSave.table}':\n ${response.msg}`) }
                        setSavedInfo({ table: objToSave.table, dir: objToSave.dir, filename: objToSave.filename, dateTime: objToSave.dateTime, message: 'Saved', truth: true });
                    } else {
                        setSavedInfo({ table: objToSave.table, dir: objToSave.dir, filename: objToSave.filename, dateTime: objToSave.dateTime, message: 'Unexpected save method. Investigate', truth: false });
                        throw new Error(`${response.status} Unexpected success attempting to save '${objToSave.dir}/${objToSave.filename}' version: (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in '${objToSave.table}':\n ${response.msg}`);
                    }
                } else {
                    setSavedInfo({ table: objToSave.table, dir: objToSave.dir, filename: objToSave.filename, dateTime: objToSave.dateTime, message: 'Failed to save', truth: false });
                    throw new Error(`${response.status} Error attempting to save '${objToSave.dir}/${objToSave.filename}' version: (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in '${objToSave.table}':\n ${response.msg}`);
                }
            }

        } catch (err) {
            console.error('Error saving customUI:', err);
        }
    }

    /** Determines whether all inputs are in proper form and blocks schedule addition if not */
    const checkScheduleInputs = () => {
        const dates = ['start','end','effectiveStart', 'effectiveEnd'];
        const parts = ['month', 'day', 'year', 'hour', 'minute'];

        let updatedValidity = { ...scheduleValidity };
        let scheduleIsValid = true;

        dates.forEach((date) => {
            parts.forEach((part) => {
                let isValid = false;
                const value =  scheduleInfo?.[date]?.[part];

                // Check for existing value
                if (value !== undefined && value !== null) {
                    // Allow 'NA' exception for effectiveEnd if every one is 'NA'
                    if (date === 'effectiveEnd' && Object.values(scheduleInfo.effectiveEnd).every(value => value === 'NA')) {
                        isValid = true;
                    }
                    // Check for 4-digit input
                    else if (part === 'year') {
                        isValid = /^\d{4}$/.test(value);
                        if (!isValid && logCheck(printLevel,['s','e']) === 2) {console.log(`${date} ${part} is not four digits: ${value}`)}
                    } 
                    // Check for 2-digit input
                    else {
                        isValid = /^\d{2}$/.test(value);
                        if (!isValid && logCheck(printLevel,['s','e']) === 2) {console.log(`${date} ${part} is not two digits: ${value}`)}
                        
                        // convert value to number (+value will return false if cannot convert)
                        // confirm months [1,12], days [1,31], hours [0,23] and minuntes [0,59]
                        if (isValid && part === 'month' && (!(+value >= 1) || !(+value <= 12))) {
                            isValid = false;
                            if (!isValid && logCheck(printLevel,['s','e']) === 2) {console.log(`${date} ${part} is not in range [1,12]: ${value}`)}
                        } else if (isValid && part === 'day' && (!(+value >= 1) || !(+value <= 31))) {
                            isValid = false;
                            if (!isValid && logCheck(printLevel,['s','e']) === 2) {console.log(`${date} ${part} is not in range [1,31]: ${value}`)}
                        } else if (isValid && part === 'hour' && (!(+value >= 0) || !(+value <= 23))) {
                            isValid = false;
                            if (!isValid && logCheck(printLevel,['s','e']) === 2) {console.log(`${date} ${part} is not in range [0,23]: ${value}`)}
                        } else if (isValid && part === 'minute' && (!(+value >= 0) || !(+value <= 59))) {
                            isValid = false;
                            if (!isValid && logCheck(printLevel,['s','e']) === 2) {console.log(`${date} ${part} is not in range [0,59]: ${value}`)}
                        }
                    }
                } else {
                    isValid = false;
                    if (!isValid && logCheck(printLevel,['s','e']) === 2) {console.log(`${date} ${part} is not an accepted value: ${value}`)}
                }

                // set return value to false if anything fails
                if (!isValid) {
                    scheduleIsValid = false;
                }

                updatedValidity = {
                    ...updatedValidity,
                    [date]: {
                        ...updatedValidity[date],
                        [part]: isValid
                    }
                }
            })
            // Make sure date is a real date (convert 4/31 to 5/1 and revert find !==)
            if (scheduleIsValid && scheduleInfo?.[date].month !== "NA" && 
                formatSplitDateToString(formatJsDateToSplitDate(formatSplitDateToJsDate(scheduleInfo?.[date]))) 
                !== formatSplitDateToString(scheduleInfo?.[date])
            ) {
                scheduleIsValid = false;
                updatedValidity = {
                    ...updatedValidity,
                    [date]: { month: false, day: false, year: false, hour: false, minute: false }
                };
                if (logCheck(printLevel, ['s', 'e']) > 0) { console.log(`Did not pass schedule validity check... ${date}: ${formatSplitDateToString(scheduleInfo?.[date])} does not exist.`) }
            }
        });

        // check that specRpt integer greater than 0
        if (scheduleInfo.repeatType === 'specRpt' && (!/^\d+$/.test(scheduleInfo.repeatInfo) || !(+scheduleInfo.repeatInfo > 0))) {
            scheduleIsValid = false;
            updatedValidity = { ...updatedValidity, repeatInfo: false };
            if (logCheck(printLevel, ['s', 'e']) > 0) {console.log(`Did not pass schedule validity check. repeatInfo is not a positive integer: ${scheduleInfo.repeatInfo}`)}
        } else {
            updatedValidity = { ...updatedValidity, repeatInfo: true };
        }

        // check that start is before end and effectiveStart is before effectiveEnd
        if (scheduleIsValid && !checkSplitDateIsBefore(scheduleInfo.start, scheduleInfo.end)) {
            scheduleIsValid = false;
            updatedValidity = {
                ...updatedValidity,
                start: { month: false, day: false, year: false, hour: false, minute: false },
                end: { month: false, day: false, year: false, hour: false, minute: false }
            };
            if (logCheck(printLevel, ['s', 'e']) > 0) { console.log(`Did not pass schedule validity check. start is not before end.`) }
        }
        if (scheduleIsValid && scheduleInfo.effectiveEnd.month !== "NA" && 
            !checkSplitDateIsBefore(scheduleInfo.effectiveStart, scheduleInfo.effectiveEnd)) {
            scheduleIsValid = false;
            updatedValidity = {
                ...updatedValidity,
                effectiveStart: { month: false, day: false, year: false, hour: false, minute: false },
                effectiveEnd: { month: false, day: false, year: false, hour: false, minute: false }
            };
            if (logCheck(printLevel, ['s', 'e']) > 0) { console.log(`Did not pass schedule validity check. effectiveStart is not before effectiveEnd.`) };
        }

        // update schedule validity and return true or false
        if (scheduleIsValid) {
            setScheduleValidity(updatedValidity);
            return true;
        } else {
            setScheduleValidity(updatedValidity);
            if (logCheck(printLevel, ['s','e']) === 1) {console.log('schedule invalid.')}
            else if (logCheck(printLevel, ['s','e']) === 2) {console.log('schedule invalid.\n', scheduleValidity)}
            return false;
        }
    }

    /** Add StartEndInput content to obj.options.schedule */
    const scheduleIt = () => {

        const scheduleValid = checkScheduleInputs();

        if (scheduleValid) {
            if (logCheck(printLevel, ['o']) === 1) { console.log('New schedule added.') }
            else if (logCheck(printLevel, ['o']) === 2) { console.log('New schedule added:\n', scheduleInfo) }
            setObj(prevState => ({
                ...prevState,
                options: {
                    ...prevState.options,
                    schedule: prevState.options && prevState.options.schedule
                        ? [...prevState.options.schedule, scheduleInfo]
                        : [scheduleInfo]
                }
            }));
        }
    }

    /** Add element to payload with elementInfo */
    const addElement = () => {
        setObj(prevState => ({
            ...prevState,
            payload: prevState.payload
                ? [...prevState.payload, elementInfo]
                : [elementInfo]
        }));
    }

    return (
        <div className="mainContainer">
            <FileAccess 
                rookie={rookie}
                printLevel={printLevel}
                defaultPayload={null}
                obj={obj}
                setObj={setObj}
                loadedInfo={loadedInfo}
                savedInfo={savedInfo}
                getFile={getCustomUI}
                saveFile={saveCustomUI} />
            {/** Schedule repeat options */
                <div className="flexDivRows">
                    <p>Schedule Type:</p>
                    <button className="moreButton" 
                        style={{ color: scheduleInfo.repeatType === 'none' ? 'gray' : undefined }}
                        onClick={() => scheduleInfo.repeatType === 'none' 
                            ?   setScheduleInfo(prevState => ({ ...prevState, repeatType: '' }))
                            :   setScheduleInfo(prevState => ({ ...prevState, repeatType: 'none' }))}>
                        Specific
                        <span className="more bulletList">
                            <h3>Specific Behavior</h3>
                            <p>Start and end define one event</p>
                        </span>
                    </button>
                    <button className="moreButton"
                        style={{ color: scheduleInfo.repeatType === 'specRpt' ? 'gray' : undefined }}
                        onClick={() => scheduleInfo.repeatType === 'specRpt'
                            ? setScheduleInfo(prevState => ({ ...prevState, repeatType: '', repeatInfo: '' }))
                            : setScheduleInfo(prevState => ({ ...prevState, repeatType: 'specRpt', repeatInfo: '1' }))}>
                        Specific Repeat
                        <span className="more bulletList">
                            <h3>Specific Repeat Behavior</h3>
                            <p>Start and end serve as initial date</p>
                            <p>Events will repeat the specified number of days apart</p>
                            <p>Events will repeat in the past and future within the inclusive bounds of effective start and end</p>
                        </span>
                    </button>
                    <button className="moreButton"
                        style={{ color: scheduleInfo.repeatType === 'daily' ? 'gray' : undefined }}
                        onClick={() => scheduleInfo.repeatType === 'daily'
                            ? setScheduleInfo(prevState => ({ ...prevState, repeatType: '' }))
                            : setScheduleInfo(prevState => ({ ...prevState, repeatType: 'daily' }))}>
                        Daily
                        <span className="more bulletList">
                            <h3>Daily Repeat Behavior</h3>
                            <p>Start and end are only relevant for the starting time and time span</p>
                            <p>If the start and end dates are different events will span multiple days</p>
                            <p>Events will repeat each day in the past and future within the inclusive bounds of effective start and end</p>
                        </span>
                    </button>
                    <button className="moreButton"
                        style={{ color: scheduleInfo.repeatType === 'weekly' ? 'gray' : undefined }}
                        onClick={() => scheduleInfo.repeatType === 'weekly'
                            ? setScheduleInfo(prevState => ({ ...prevState, repeatType: '', repeatInfo: '' }))
                            : setScheduleInfo(prevState => ({ ...prevState, repeatType: 'weekly', repeatInfo: '1' }))}>
                        Weekly
                        <span className="more bulletList">
                            <h3>Weekly Repeat Behavior</h3>
                            <p>Start and end are only relevant for the starting time and time span</p>
                            <p>If the start and end date are different each event will span multiple days and the start date will use the given day of the week</p>
                            <p>Events will repeat each week in the past and future within the inclusive bounds of effective start and end</p>
                        </span>
                    </button>
                    <button className="moreButton"
                        style={{ color: scheduleInfo.repeatType === 'monthly' ? 'gray' : undefined }}
                        onClick={() => scheduleInfo.repeatType === 'monthly'
                            ? setScheduleInfo(prevState => ({ ...prevState, repeatType: '' }))
                            : setScheduleInfo(prevState => ({ ...prevState, repeatType: 'monthly' }))}>
                        Monthly
                        <span className="more bulletList">
                            <h3>Monthly Repeat Behavior</h3>
                            <p>Start and end are only relevant for the day, and time</p>
                            <p>If the start and end date are different each event will span multiple days</p>
                            <p>If day used is not in a certain month the last day of the month will be used</p>
                            <p>Events will repeat each month in the past and future within the bounds of effective start and end</p>
                        </span>
                    </button>
                    <button className="moreButton"
                        style={{ color: scheduleInfo.repeatType === 'annually' ? 'gray' : undefined }}
                        onClick={() => scheduleInfo.repeatType === 'annually'
                            ? setScheduleInfo(prevState => ({ ...prevState, repeatType: '' }))
                            : setScheduleInfo(prevState => ({ ...prevState, repeatType: 'annually' }))}>
                        Annually
                        <span className="more bulletList">
                            <h3>Annually Repeat Behavior</h3>
                            <p>Start and end are only relevant for the month, day, and time</p>
                            <p>If the start and end date are different each event will span multiple days</p>
                            <p>If month/day set to 2/29, 2/28 will be used on non-leap years</p>
                            <p>Events will repeat each year in the past and future within the bounds of effective start and end</p>
                        </span>
                    </button>
                </div>
            }
            {/** Display relevant inputs for repeatType */
                scheduleInfo.repeatType && (
                    scheduleInfo.repeatType === 'none' ? (
                        <div>
                            <p className="flexDivRows">Scheduled Time</p>
                            <StartEndInput rookie={rookie} info={scheduleInfo} setInfo={setScheduleInfo} validity={scheduleValidity} />
                            <button onClick={() => scheduleIt()}>Schedule it!</button>
                        </div>
                    ) : scheduleInfo.repeatType === 'specRpt' ? (
                        <div>
                            <p className="flexDivRows">Scheduled Time</p>
                            <StartEndInput rookie={rookie} info={scheduleInfo} setInfo={setScheduleInfo} validity={scheduleValidity} />
                            <div className="flexDivRows">
                                <p>Repeat every&nbsp;</p>
                                <input
                                    className="fourDigitInput"
                                    name='specific repeat box'
                                        style={{ border: !scheduleValidity.repeatInfo ? '1px solid red' : undefined }}
                                    value={scheduleInfo.repeatInfo}
                                    onChange={(e) => setScheduleInfo(prevState => ({ ...prevState, repeatInfo: e.target.value }))}
                                />
                                <p>&nbsp;days</p>
                            </div>
                            <EffectiveTimeRange rookie={rookie} info={scheduleInfo} setInfo={setScheduleInfo} validity={scheduleValidity} />
                            <button onClick={() => scheduleIt()}>Schedule it!</button>
                        </div>
                    ) : scheduleInfo.repeatType === 'weekly' ? (
                        <div>
                            <p className="flexDivRows">Scheduled Time</p>
                            <StartEndInput rookie={rookie} info={scheduleInfo} setInfo={setScheduleInfo} validity={scheduleValidity} />
                            <div className="flexDivRows">
                                <p>Repeat every&nbsp;</p>
                                <select
                                    name='weekly repeat box'
                                    value={scheduleInfo.repeatInfo}
                                    onChange={(e) => setScheduleInfo(prevState => ({ ...prevState, repeatInfo: e.target.value }))}>
                                        <option key={'0'} value={'0'}>Sunday</option>
                                        <option key={'1'} value={'1'}>Monday</option>
                                        <option key={'2'} value={'2'}>Tuesday</option>
                                        <option key={'3'} value={'3'}>Wednesday</option>
                                        <option key={'4'} value={'4'}>Thursday</option>
                                        <option key={'5'} value={'5'}>Friday</option>
                                        <option key={'6'} value={'6'}>Saturday</option>
                                </select>
                            </div>
                            <EffectiveTimeRange rookie={rookie} info={scheduleInfo} setInfo={setScheduleInfo} validity={scheduleValidity} />
                            <button onClick={() => scheduleIt()}>Schedule it!</button>
                        </div>
                    ) : ['daily','monthly','annually'].includes(scheduleInfo.repeatType) ? (
                        <div>
                            <p className="flexDivRows">Scheduled Time</p>
                            <StartEndInput rookie={rookie} info={scheduleInfo} setInfo={setScheduleInfo} validity={scheduleValidity} />
                            <EffectiveTimeRange rookie={rookie} info={scheduleInfo} setInfo={setScheduleInfo} validity={scheduleValidity} />
                            <button onClick={() => scheduleIt()}>Schedule it!</button>
                        </div>
                    ) : (null)
                )
            }
            {/** Only show Scheduled Dates if there are any and schedule is toggled*/
                obj.options && obj.options.schedule && obj.options.schedule.length > 0 &&
                    <ScheduleDisplay 
                        rookie={rookie}
                        obj={obj} setObj={setObj} 
                        setInfo={setScheduleInfo}/>
            }
            {/** Options to create elements */}
            <div className="flexDivRows">
                <p>Element Type:</p>
                <button
                    style={{ color: includeStart ? 'gray' : 'black'}}
                    onClick={() => setIncludeStart(!includeStart)}>
                    Add Start Time
                </button>
                <button 
                    onClick={() => elementInfo.type === 'toggle'
                        ?   setElementInfo({ type: '', label: '', choices: null, group: 0 })
                        :   setElementInfo(({ type: 'toggle', label: '', value: false, choices: null, group: 0 }))}
                    style={{ color: elementInfo.type === 'toggle' ? 'gray' : undefined }}>
                            Add Button
                </button>
                <button 
                    onClick={() => elementInfo.type === 'choice'
                        ?   setElementInfo({ type: '', label: '', choices: null, group: 0 })
                        :   setElementInfo(({ type: 'choice', label: '', value: '', choices: [''], group: 0 }))}
                    style={{ color: elementInfo.type === 'choice' ? 'gray' : undefined }}>
                            Add Multiple Choice
                </button>
                <button 
                    onClick={() => elementInfo.type === 'input'
                        ?   setElementInfo({ type: '', label: '', choices: null, group: 0 })
                        :   setElementInfo(({ type: 'input', label: '', value: [''], choices: null, group: 0 }))}
                    style={{ color: elementInfo.type === 'input' ? 'gray' : undefined }}>
                            Add Input Box
                </button>
                <button 
                    onClick={() => elementInfo.type === 'text'
                        ?   setElementInfo({ type: '', label: '', choices: null, group: 0 })
                        :   setElementInfo(({ type: 'text', label: '', value: '', choices: null, group: 0 }))}
                    style={{ color: elementInfo.type === 'text' ? 'gray' : undefined }}>
                            Add Text Box
                </button>
            </div>
            {/** Element creation UI */
                elementInfo.type === 'toggle' ? (
                    <div className="flexDivRows">
                        <p>Button Label:</p>
                        <input
                            name='toggle label box'
                            value={elementInfo.label}
                            onChange={(e) => setElementInfo(prevState => ({ ...prevState, label: e.target.value }))}
                        />
                        <button onClick={() => addElement()}>Add it!</button>
                    </div>
                ) : elementInfo.type === 'choice' ? (
                    <div>
                        <div className="flexDivRows">
                            <p>Multiple Choice Question:</p>
                            <input
                                name='choice label box'
                                value={elementInfo.label}
                                onChange={(e) => setElementInfo(prevState => ({ ...prevState, label: e.target.value }))}
                            />
                        </div>
                        <div className="flexDivRows">
                            <p>Choices:</p>
                            <button onClick={() => setElementInfo(prevState => ({ ...prevState, choices: prevState.choices.slice(0, prevState.choices.length - 1) }))}>-</button>
                            <button onClick={() => setElementInfo(prevState => ({ ...prevState, choices: [...prevState.choices, ''] }))}>+</button>
                            {/** Shows input for each existing choice and edits them based on their index */
                                elementInfo.choices.map((choice, index) => (
                                    <input
                                        key={'multChoice'+index}
                                        name={`choice box${index}`}
                                        value={choice}
                                        onChange={(e) => 
                                            setElementInfo(prevState => 
                                                ({ ...prevState, 
                                                    choices: prevState.choices.map((c, i) =>
                                                        i === index ? e.target.value : c
                                                    )
                                                })
                                            )}
                                    />
                                ))
                            }
                        </div>
                        <button onClick={() => addElement()}>Add it!</button>
                    </div>
                ) : elementInfo.type === 'input' ? (
                    <div className="flexDivRows">
                        <p>Input Label:</p>
                        <input
                            name='input label box'
                            value={elementInfo.label}
                            onChange={(e) => setElementInfo(prevState => ({ ...prevState, label: e.target.value }))}
                        />
                        <button onClick={() => addElement()}>Add it!</button>
                    </div>
                ) : elementInfo.type === 'text' ? (
                    <div className="flexDivRows">
                        <p>Text Box Label:</p>
                        <input
                            name='text label box'
                            value={elementInfo.label}
                            onChange={(e) => setElementInfo(prevState => ({ ...prevState, label: e.target.value }))}
                        />
                        <button onClick={() => addElement()}>Add it!</button>
                    </div>
                ) : (null)
            }
            {/** UI editing display */}
            <div className="flexDivRows" style={{ marginTop: '2%' }}>
                <div className="moreLink">
                    <p>User Interface</p>
                    <div className={ rookie ? "more" : "moreDisabled"}>
                        <h3>Start Time</h3>
                        <p>This is an option. Press it if you'd like the UI to include a start time. End time is automatically included.</p>
                        <h3>Button</h3>
                        <p>Displays as a button with a label on it that can be clicked or unclicked for true and false output.</p>
                        <h3>Multiple Choice</h3>
                        <p>Displays as a label followed by buttons with choices. One or no options can be selected.</p>
                        <h3>Input</h3>
                        <p>Displays as a label followed by short input boxes for small text entries. Entries can be added or removed with '+' and '-' buttons when recording. Grouped items remove or add inputs when inputs of the same group have inputs removed or added.</p>
                        <h3>Text Box</h3>
                        <p>Displays as a label with a text box for long responses.</p>
                    </div>
                </div>
            </div>
            <div style={{ border: '1px solid black' }}>
                {/** Display UI similar to how it will be in CustomRecord */
                    <EditUI rookie={rookie} obj={obj} setObj={setObj}/>
                }
                {/** Display end and maybe start times */}
            <div className="flexDivTable">
            {/** Display start if decided to include */
                includeStart &&
                    <div className="flexDivRows">
                        <p className="flexDivColumns">Event Start:</p>
                        <input readOnly
                            className="twoDigitInput"
                            name='startInfo month box'
                            value={time.month} />
                        <p className="flexDivColumns">/</p>
                        <input readOnly
                            className="twoDigitInput"
                            name='startInfo day box'
                            value={time.day} />
                        <p className="flexDivColumns">/</p>
                        <input readOnly
                            className="fourDigitInput"
                            name='startInfo year box'
                            value={time.year} />
                        <p className="flexDivColumns">at</p>
                        <input readOnly
                            className="twoDigitInput"
                            name='startInfo hour box'
                            value={time.hour} />
                        <p className="flexDivColumns">:</p>
                        <input readOnly
                            className="twoDigitInput"
                            name='startInfo minute box'
                            value={time.minute} />
                    </div>
            } 
            {/** Display end always */
                <div className="flexDivRows">
                    <p className="flexDivColumns">Event End:</p>
                    <input readOnly
                        className="twoDigitInput"
                        name='startInfo month box'
                        value={time.month} />
                    <p className="flexDivColumns">/</p>
                    <input readOnly
                        className="twoDigitInput"
                        name='startInfo day box'
                        value={time.day} />
                    <p className="flexDivColumns">/</p>
                    <input readOnly
                        className="fourDigitInput"
                        name='startInfo year box'
                        value={time.year}/>
                    <p className="flexDivColumns">at</p>
                    <input readOnly
                        className="twoDigitInput"
                        name='startInfo hour box'
                        value={time.hour}/>
                    <p className="flexDivColumns">:</p>
                    <input readOnly
                        className="twoDigitInput"
                        name='startInfo minute box'
                        value={time.minute}/>
                </div>
            }
            </div>
            </div>
        </div>
    );
}

/** HTML element for editing start and end date/time of schedule */
const StartEndInput = ({ rookie, info, setInfo, validity }) => {

    /** Update date 1 property with inputValue */
    const uponStartChange = (inputValue, prop) => {
        setInfo(prevState => ({
            ...prevState,
            start: {
                ...prevState.start,
                [prop]: inputValue
            }
        }));
    }

    /** Update date 2 property with inputValue */
    const uponEndChange = (inputValue, prop) => {
        setInfo(prevState => ({ 
            ...prevState, 
            end: { 
                ...prevState.end,
                [prop]: inputValue 
            }
        }));
    }

    return (
        <div className="flexDivTable">
            {/** Start dateTime row */}
            <div className="flexDivRows">
                <p className="flexDivColumns">Start:</p>
                <input
                    className="twoDigitInput"
                    name='month1 box'
                    style={{ border: !validity.start.month ? '1px solid red' : undefined }}
                    value={info.start.month}
                    onChange={(e) => uponStartChange(e.target.value, 'month')}
                />
                <p className="flexDivColumns">/</p>
                <input
                    className="twoDigitInput"
                    name='day1 box'
                    style={{ border: !validity.start.day ? '1px solid red' : undefined }}
                    value={info.start.day}
                    onChange={(e) => uponStartChange(e.target.value, 'day')}
                />
                <p className="flexDivColumns">/</p>
                <input
                    className="fourDigitInput"
                    name='year1 box'
                    style={{ border: !validity.start.year ? '1px solid red' : undefined }}
                    value={info.start.year}
                    onChange={(e) => uponStartChange(e.target.value, 'year')}
                />
                <p className="flexDivColumns">at</p>
                <input
                    className="twoDigitInput"
                    name='hour1 box'
                    style={{ border: !validity.start.hour ? '1px solid red' : undefined }}
                    value={info.start.hour}
                    onChange={(e) => uponStartChange(e.target.value, 'hour')}
                />
                <p className="flexDivColumns">:</p>
                <input
                    className="twoDigitInput"
                    name='minute1 box'
                    style={{ border: !validity.start.minute ? '1px solid red' : undefined }}
                    value={info.start.minute}
                    onChange={(e) => uponStartChange(e.target.value, 'minute')}
                />
            </div>
            {/** End dateTime row */}
            <div className="flexDivRows">
                <p className="flexDivColumns">End:</p>
                <input
                    className="twoDigitInput"
                    name='month2 box'
                    style={{ border: !validity.end.month ? '1px solid red' : undefined }}
                    value={info.end.month}
                    onChange={(e) => uponEndChange(e.target.value, 'month')}
                />
                <p className="flexDivColumns">/</p>
                <input
                    className="twoDigitInput"
                    name='day2 box'
                    style={{ border: !validity.end.day ? '1px solid red' : undefined }}
                    value={info.end.day}
                    onChange={(e) => uponEndChange(e.target.value, 'day')}
                />
                <p className="flexDivColumns">/</p>
                <input
                    className="fourDigitInput"
                    name='year2 box'
                    style={{ border: !validity.end.year ? '1px solid red' : undefined }}
                    value={info.end.year}
                    onChange={(e) => uponEndChange(e.target.value, 'year')}
                />
                <p className="flexDivColumns">at</p>
                <input
                    className="twoDigitInput"
                    name='hour2 box'
                    style={{ border: !validity.end.hour ? '1px solid red' : undefined }}
                    value={info.end.hour}
                    onChange={(e) => uponEndChange(e.target.value, 'hour')}
                />
                <p className="flexDivColumns">:</p>
                <input
                    className="twoDigitInput"
                    name='minute2 box'
                    style={{ border: !validity.end.minute ? '1px solid red' : undefined }}
                    value={info.end.minute}
                    onChange={(e) => uponEndChange(e.target.value, 'minute')}
                />
            </div>
            {/** Determine time zone dependency */
                info.local ?
                    <div>
                        <button
                            className="moreButton"
                            style={{ color: 'gray' }}>
                            Local
                            <span style={{ color: 'black' }} className="more">Selected: Given date and time are absolute and will never be converted.</span>
                        </button>
                        <button
                            className="moreButton"
                            onClick={() => setInfo(prevState => ({ ...prevState, local: false }))}>
                            UTC
                            <span className="more">Given date and time will be stored in universal standard time and converted to the local time for use.</span>
                        </button>
                    </div>
                    :
                    <div>
                        <button
                            className="moreButton"
                            onClick={() => setInfo(prevState => ({ ...prevState, local: true }))}>
                            Local
                            <span className="more">Given date and time are absolute and will never be converted.</span>
                        </button>
                        <button
                            className="moreButton"
                            style={{ color: 'gray' }}>
                            UTC
                            <span style={{ color: 'black' }} className="more">Selected: Given date and time will be stored in universal standard time and converted to the local time for use.</span>
                        </button>
                    </div>
            }
        </div>
    );
}

/** HTML element for editing effective start and end date of schedule */
const EffectiveTimeRange = ({ rookie, info, setInfo, validity }) => {

    // Update effective start date property with inputValue
    const uponEffectiveStartChange = (inputValue, prop) => {
        setInfo(prevState => ({
            ...prevState,
            effectiveStart: {
                ...prevState.effectiveStart,
                [prop]: inputValue
            }
        }));
    };

    // Update effective end date property with inputValue
    const uponEffectiveEndChange = (inputValue, prop) => {
        setInfo(prevState => ({
            ...prevState,
            effectiveEnd: {
                ...prevState.effectiveEnd,
                [prop]: inputValue
            }
        }));
    };

    return (
        <div>
            { /** Render unless 'Always' chosen */
                <div>
                    {/** Option to set effective range to extend infinitely into future */}
                    <div className="flexDivRows">
                        <p>Effective Time Range</p>
                        {
                            info.effectiveEnd.month !== 'NA' 
                            ?   <button onClick={() => {setInfo(prevState => ({ 
                                    ...prevState, 
                                    effectiveStart: prevState.start,
                                    effectiveEnd: { month: 'NA', day: 'NA', year: 'NA', hour: 'NA', minute: 'NA' }
                                    }))}}>
                                        Always
                                </button>
                            :   <button onClick={() => setInfo(prevState => ({
                                    ...prevState,
                                    effectiveStart: prevState.start,
                                    effectiveEnd: prevState.end
                                    }))}>
                                        Reset
                                </button>
                        }
                    </div>
                    { /** Inputs for effective time range */}
                    <div className="flexDivTable">
                        {/** Effective start inputs */}
                        <div className="flexDivRows">
                            <p className="flexDivColumns">Start:</p>
                            <input
                                className="twoDigitInput"
                                name='start month box'
                                style={{ border: !validity.effectiveStart.month ? '1px solid red' : undefined }}
                                value={info.effectiveStart.month}
                                onChange={(e) => uponEffectiveStartChange(e.target.value, 'month')}
                            />
                            <p className="flexDivColumns">/</p>
                            <input
                                className="twoDigitInput"
                                name='start day box'
                                style={{ border: !validity.effectiveStart.day ? '1px solid red' : undefined }}
                                value={info.effectiveStart.day}
                                onChange={(e) => uponEffectiveStartChange(e.target.value, 'day')}
                            />
                            <p className="flexDivColumns">/</p>
                            <input
                                className="fourDigitInput"
                                name='start year box'
                                style={{ border: !validity.effectiveStart.year ? '1px solid red' : undefined }}
                                value={info.effectiveStart.year}
                                onChange={(e) => uponEffectiveStartChange(e.target.value, 'year')}
                            />
                            <p className="flexDivColumns">at</p>
                            <input
                                className="twoDigitInput"
                                name='start hour box'
                                style={{ border: !validity.effectiveStart.hour ? '1px solid red' : undefined }}
                                value={info.effectiveStart.hour}
                                onChange={(e) => uponEffectiveStartChange(e.target.value, 'hour')}
                            />
                            <p className="flexDivColumns">:</p>
                            <input
                                className="twoDigitInput"
                                name='start minute box'
                                style={{ border: !validity.effectiveStart.minute ? '1px solid red' : undefined }}
                                value={info.effectiveStart.minute}
                                onChange={(e) => uponEffectiveStartChange(e.target.value, 'minute')}
                            />
                        </div>
                        {/** Effective end inputs */}
                        <div className="flexDivRows">
                            <p className="flexDivColumns">End:</p>
                            <input
                                className="twoDigitInput"
                                name='end month box'
                                style={{ border: !validity.effectiveEnd.month ? '1px solid red' : undefined }}
                                value={info.effectiveEnd.month}
                                onChange={(e) => uponEffectiveEndChange(e.target.value, 'month')}
                            />
                            <p className="flexDivColumns">/</p>
                            <input
                                className="twoDigitInput"
                                name='end day box'
                                style={{ border: !validity.effectiveEnd.day ? '1px solid red' : undefined }}
                                value={info.effectiveEnd.day}
                                onChange={(e) => uponEffectiveEndChange(e.target.value, 'day')}
                            />
                            <p className="flexDivColumns">/</p>
                            <input
                                className="fourDigitInput"
                                name='end year box'
                                style={{ border: !validity.effectiveEnd.year ? '1px solid red' : undefined }}
                                value={info.effectiveEnd.year}
                                onChange={(e) => uponEffectiveEndChange(e.target.value, 'year')}
                            />
                            <p className="flexDivColumns">at</p>
                            <input
                                className="twoDigitInput"
                                name='end hour box'
                                style={{ border: !validity.effectiveEnd.hour ? '1px solid red' : undefined }}
                                value={info.effectiveEnd.hour}
                                onChange={(e) => uponEffectiveEndChange(e.target.value, 'hour')}
                            />
                            <p className="flexDivColumns">:</p>
                            <input
                                className="twoDigitInput"
                                name='end minute box'
                                style={{ border: !validity.effectiveEnd.minute ? '1px solid red' : undefined }}
                                value={info.effectiveEnd.minute}
                                onChange={(e) => uponEffectiveEndChange(e.target.value, 'minute')}
                            />
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}

/** HTML element for displaying schedules that will be saved with UI */
const ScheduleDisplay = ({ rookie, obj, setObj, setInfo }) => {

    /** Remove content from obj.options.schedule */
    const removeSchedule = (index) => {
        // Make copy
        const updatedSchedule = [...obj.options.schedule];
        // Remove content at index
        updatedSchedule.splice(index, 1);
        setObj(prevState => ({ ...prevState, options: { ...prevState.options, schedule: updatedSchedule } }));
    }

    return (
        <div style={{ marginTop: '2%' }}>
            <p className="flexDivRows">Schedules</p>
            <div style={{ border: '1px solid black' }}>
                {
                    obj.options && obj.options.schedule && obj.options.schedule.length > 0 &&
                    obj.options.schedule.map((schedule, index) => (
                        <div key={'fullSchedule' + index}>
                            {/** Edit and remove buttons */}
                            <div className="flexDivRows" key={"schedule" + index}>
                                    <button style={{ display: 'inline-block' }}
                                        onClick={() => { removeSchedule(index) }}>Remove</button>
                                    <button style={{ display: 'inline-block' }}
                                        onClick={() => {
                                            setInfo(obj.options.schedule[index]); // Set scheduling interface equal to values from selected schedule to edit
                                            removeSchedule(index); // Remove the schedule being edited to prevent duplicates
                                        }}>
                                        Edit
                                    </button>
                                    <div className="moreLink">
                                    <p style={{ display: 'inline-block' }}>
                                        Schedule {index+1}
                                        {/** Displays repeat */
                                            schedule.repeatType === 'specRpt' ? (
                                                <span> repeats every {schedule.repeatInfo} days</span>
                                            ) : schedule.repeatType === 'daily' ? (
                                                <span> repeats daily</span>
                                            ) : schedule.repeatType === 'weekly' ? (
                                                <span> repeats every {getWeekdayString(parseInt(schedule.repeatInfo))}</span>
                                            ) : schedule.repeatType === 'monthly' ? (
                                                <span> repeats monthly</span>
                                            ) : schedule.repeatType === 'annually' ? (
                                                <span> repeats annually</span>
                                            ) : (null)
                                        }
                                    </p>
                                    <div className="more">
                                        { /** Display effective time range */
                                            schedule.repeatType !== 'none' &&
                                            <div className="flexDivRows" key={'effectiveSchedule' + index}>
                                                <p>
                                                    {schedule.effectiveEnd.month !== 'NA' 
                                                    ?   (<>Effective from {formatSplitDateToString(schedule.effectiveStart)} through {formatSplitDateToString(schedule.effectiveEnd)}</>) 
                                                    :   (<>Effective indefinitely after {formatSplitDateToString(schedule.effectiveStart)}</>)
                                                    }
                                                </p>
                                            </div>
                                        }
                                        { /** Display reference dates */}
                                        <div className="flexDivRows" key={'referenceSchedule' + index}>
                                            <p>Reference Dates: {formatSplitDateToString(schedule.start)} - {formatSplitDateToString(schedule.end)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    );
}

/** payload element display including remove, move, and group buttons */
const EditUI = ({ rookie, obj, setObj }) => {

    // hold index of object to be moved
    const [moveIndex, setMoveIndex] = useState(null);
    // hold current group number and if it is actively being grouped
    const [groupNum, setGroupNum] = useState(1);
    const [grouping, setGrouping] = useState(false);

    /** remove element from payload by index */
    const removeElement = (index) => {
        const updatedArray = [...obj.payload];
        updatedArray.splice(index, 1);
        setObj(prevState => ({ ...prevState, payload: updatedArray }));
    };

    /** move Element from moveIndex to index just selected */
    const moveElement = (index) => {
        const updatedArray = [...obj.payload];
        const [movedElement] = updatedArray.splice(moveIndex, 1);
        // Insert element at index above element at moveIndex
        if (index < moveIndex) {
            updatedArray.splice(index, 0, movedElement);
        } else if (index > moveIndex) {
            updatedArray.splice(index - 1, 0, movedElement);
        } else {
            return;
        }
        setObj(prevState => ({ ...prevState, payload: updatedArray }));
    };

    /** set the group number for the selected element */
    const groupElement = (index) => {
        setObj(prevState => ({
            ...prevState,
            payload: prevState.payload.map((item, i) =>
                i === index ? { ...item, group: groupNum } : item
            )
        }));
    };

    return (
        obj.payload &&
        obj.payload.map((element, index) => (
            <div key={'editUI' + index}>
                <div key={'editUIA' + index} className="flexDivRows">
                    {
                        element.type === 'toggle' ? (
                            <button>{element.label}</button>
                        ) : element.type === 'choice' ? (
                            <p>{element.label}</p>
                        ) : element.type === 'input' ? (
                            <p>{element.label}</p>
                        ) : element.type === 'text' ? (
                            <p>{element.label}</p>
                        ) : (null)
                    }
                    <button onClick={() => removeElement(index)}>Remove</button>
                    {/** Either show move or move to button */
                        moveIndex !== null
                            ? <button onClick={() => {
                                moveElement(index);
                                setMoveIndex(null);
                            }}>
                                Place Above
                            </button>
                            : <button onClick={() => setMoveIndex(index)}>Move</button>
                    }
                    {/** Show group button and commit button if currently grouping */
                        element.type === 'input' ?
                            grouping ? (
                                <div className="flexDivRows">
                                    <button onClick={() => groupElement(index)}>
                                        Group
                                    </button>
                                    <button
                                        onClick={() => {
                                            setGrouping(false);
                                            setGroupNum(groupNum + 1);
                                        }}>
                                        Commit
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => {
                                    setGrouping(true);
                                    groupElement(index);
                                }}>
                                    Group
                                </button>
                            )
                        : null
                    }
                    {/** Only show input groups */
                        element.type === 'input' &&
                            <p className="flexDivRows">Group {element.group?.toString()}</p>
                    }
                </div>
                <div key={'editUIB' + index}>
                    {
                        element.type === 'input' ? (
                            <input />
                        ) : element.type === 'choice' ? (
                            element.choices.map((choice, i) => (
                                <button key={'choiceButton' + i}>{choice}</button>
                            ))
                        ) : element.type === 'text' ? (
                            <textarea />
                        ) : (null)
                    }
                </div>
            </div>
        ))
    );
}
