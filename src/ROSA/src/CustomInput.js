import React, { useState, useEffect, useRef 
} from 'react';

import {getDateString, getTimeString, chooseMostRecent, 
    convertUTCstringsToLocal, convertLocalStringsToUTC, parseDateObject,
    convertUTCObjToLocal, convertLocalObjToUTC, getCurrentDateStrings,
    logCheck, newChooseMostRecent
} from './oddsAndEnds';

import { fetchDateTime, deleteEntry, fetchObject, 
    fetchFiles, saveObject, recordDateTime, newFetchObject, newSaveObject,
    newFetchDirsAndFiles,
    newDeleteEntry
} from './generalFetch';

import { differenceInHours
} from 'date-fns';

export const CustomInput = ({ printLevel, preselectedObj }) => {

    // Get object with local month, day, year, hour, minute
    const time = getCurrentDateStrings(true);

    // Contain entire custom input object (use customUI if object with version not preselected)
    const [obj, setObj] = useState({ ...preselectedObj, table: preselectedObj.dateTime.date ? preselectedObj.table : 'customUI' });
    // Contain loaded dir, filename, and version 
    // (table is also used only in customInfo to draw from different tables
    // and alter conditional rendering to allow save new when everything but table
    // matches between loadedInfo and obj)
    const [loadedInfo, setLoadedInfo] = useState({ 
        dir: preselectedObj.dir || '', 
        filename: preselectedObj.filename || '', 
        dateTime: preselectedObj.dateTime || { date: '', time: '' } 
    });
    // Contain saved dir, filename and version along with status and message like 'Save' or 'Failed to save'
    const [savedInfo, setSavedInfo] = useState(null);
    // Contain validity of input dates
    const [dateValidity, setDateValidity] = useState({
        start: { month: true, day: true, year: true, hour: true, minute: true },
        end: { month: true, day: true, year: true, hour: true, minute: true }
    });

    /** Determines whether all inputs are in proper form and blocks save if not */
    const checkDateInputs = (date, type) => {

        const parts = ['month', 'day', 'year', 'hour', 'minute'];

        let scheduleIsValid = true;
        let updatedValidity = { ...dateValidity[type] };

        parts.forEach((part) => {
            let isValid = false;
            const value = date[part];
            // Check for existing value
            if (value !== undefined && value !== null) {
                // Check for 4-digit input
                if (part === 'year') {
                    isValid = /^\d{4}$/.test(value);
                    if (!isValid && logCheck(printLevel, ['s', 'e']) === 2) { console.log(`${type} ${part} is not four digits: ${value}`) }
                }
                // Check for 2-digit input
                else {
                    isValid = /^\d{2}$/.test(value);
                    if (!isValid && logCheck(printLevel, ['s', 'e']) === 2) { console.log(`${type} ${part} is not two digits: ${value}`) }
                    // convert value to number (+value will return false if cannot convert)
                    // confirm months [1,12], days [1,31], hours [0,23] and minuntes [0,59]
                    if (isValid && part === 'month' && (!(+value >= 1) || !(+value <= 12))) {
                        isValid = false;
                        if (!isValid && logCheck(printLevel, ['s', 'e']) === 2) { console.log(`${type} ${part} is not in range [1,12]: ${value}`) }
                    } else if (isValid && part === 'day' && (!(+value >= 1) || !(+value <= 31))) {
                        isValid = false;
                        if (!isValid && logCheck(printLevel, ['s', 'e']) === 2) { console.log(`${type} ${part} is not in range [1,31]: ${value}`) }
                    } else if (isValid && part === 'hour' && (!(+value >= 0) || !(+value <= 23))) {
                        isValid = false;
                        if (!isValid && logCheck(printLevel, ['s', 'e']) === 2) { console.log(`${type} ${part} is not in range [0,23]: ${value}`) }
                    } else if (isValid && part === 'minute' && (!(+value >= 0) || !(+value <= 59))) {
                        isValid = false;
                        if (!isValid && logCheck(printLevel, ['s', 'e']) === 2) { console.log(`${type} ${part} is not in range [0,59]: ${value}`) }
                    }
                }
            } else {
                isValid = false;
                if (!isValid && logCheck(printLevel, ['s', 'e']) === 2) { console.log(`${type} ${part} is not an accepted value: ${value}`) }
            }
            // set return value to false if anything fails
            if (!isValid) {
                scheduleIsValid = false;
            }
            updatedValidity = { ...updatedValidity, [part]: isValid };
        })
        
        setDateValidity(prevState => ({ ...prevState, [type]: updatedValidity }));
        return scheduleIsValid;
    }

    /** Get payload and options given relevant arguments */
    const getRecord = async () => {
        // Reset date validity upon import
        setDateValidity({
            start: { month: true, day: true, year: true, hour: true, minute: true },
            end: { month: true, day: true, year: true, hour: true, minute: true }
        });
        try {
            const response = await newFetchObject(obj);

            if (!response.truth) {
                throw new Error(`${response.status} Error getting ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time}):\n ${response.msg}`);
            } else {
                // Set options and payload (if time convert to local, if not set to current)
                const updatedObj = {
                    ...obj,
                    options: response.options,
                    payload: response.payload.map((item) => {
                        if (item.type === 'start') {
                            if (item?.month === "NA") {
                                return { ...item, ...getCurrentDateStrings(true) };
                            } else {
                                console.log(item, convertUTCObjToLocal(item));
                                return convertUTCObjToLocal(item);
                            }
                        } else if (item.type === 'end') {
                            if (item?.month === "NA") {
                                return { ...item, ...getCurrentDateStrings(true) };
                            } else {
                                return convertUTCObjToLocal(item);
                            }
                        } else {
                            return item;
                        }
                    })
                };
                if (logCheck(printLevel, ['d', 'b']) > 0) { console.log(`Succesfully retrieved ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time}) from ${obj.table}`) }
                if (logCheck(printLevel, ['o']) === 1) { console.log('obj updated by fetch') }
                else if (logCheck(printLevel, ['o']) === 2) { console.log('obj updated by fetch\n obj:', updatedObj) }
                // Only allow overwrite on records and only allow save new for anything else
                if (obj.table !== 'record') {
                    setObj({ ...updatedObj, dateTime: { date: '', time: '' } });
                } else {
                    setObj(updatedObj);
                }
                setLoadedInfo({ table: updatedObj.table, dir: updatedObj.dir, filename: updatedObj.filename, dateTime: updatedObj.dateTime });
            }
        } catch (err) {
            console.error('Error getting record:', err);
        }
    }

    /** Save record to 'record' or 'clockIn' */
    const saveRecord = async (overwrite, saveTable) => {

        try {
            // update types 'start' and 'end' with UTC times
            // also confirm type 'end' is present
            let endCheck = false;
            let validityCheck = true;
            let objToSave = { ...obj,
                payload: obj.payload.map((item) => {
                    if (item.type === 'start') {
                        const truth = checkDateInputs(item, 'start');
                        if (!truth) {
                            validityCheck = false;
                            return item;
                        } else {
                            return convertLocalObjToUTC(item);
                        }
                    } else if (item.type === 'end') {
                        const truth = checkDateInputs(item, 'end');
                        endCheck = true;
                        if (!truth) {
                            validityCheck = false;
                            return item;
                        } else {
                            return convertLocalObjToUTC(item);
                        }
                    } else {
                        return item;
                    }
                })
            };
            if (!validityCheck) {
                throw new Error('date inputs are invalid', dateValidity);
            }
            if (!endCheck) {
                throw new Error("No type 'end' in obj.payload:", obj.payload);
            }
            // Use end time for dateTime in saving and set table to given table
            const UTCend = objToSave.payload[objToSave.payload.length - 1];
            const saveDateTime = { date: `${UTCend.month}/${UTCend.day}/${UTCend.year}`, time: `${UTCend.hour}:${UTCend.minute}` };
            objToSave = { ...objToSave, dateTime: saveDateTime, table: saveTable };

            // Delete file in 'clockIn' and save to 'record'
            if (saveTable === 'clockOut') {
                // Delete clockIn entry
                const deleteResponse = await newDeleteEntry('clockIn', obj.dateTime, obj.userID, obj.dir, obj.filename);
                if (deleteResponse.truth) {
                    if (deleteResponse.status === 200) {
                        if (logCheck(printLevel, ['d', 'b']) > 0) { console.log(`Deleted file '${obj.dir}/${obj.filename}' version: (${obj.dateTime.date}-${obj.dateTime.time}) in 'clockIn' with new entry`) }
                    } else {
                        // Set save info with unexpected delete success message
                        setSavedInfo({ table: 'clockIn', dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime, message: 'Unexpected temp delete method. Investigate', truth: false });
                        throw new Error(`${deleteResponse.status} Unexpected success attempting to delete file '${obj.dir}/${obj.filename}' version: (${obj.dateTime.date}-${obj.dateTime.time}) in 'clockIn' with new entry:\n ${deleteResponse.msg}`)
                    }
                } else {
                    // Set save info with failure to delete message
                    setSavedInfo({ table: 'clockIn', dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime, message: 'Failed to delete temp', truth: false });
                    throw new Error(`${deleteResponse.status} Error attempting to delete file '${obj.dir}/${obj.filename}' version: (${obj.dateTime.date}-${obj.dateTime.time}) in 'clockIn' with new entry:\n ${deleteResponse.msg}`);
                }
                // Save clockOut to 'record' table
                objToSave = { ...objToSave, table: 'record'};
                const response = await newSaveObject(objToSave);
                // save record on clockOut
                if (response.truth) {
                    if (response.status === 201) {
                        if (logCheck(printLevel, ['d', 'b']) > 0) { console.log(`Successfully removed temp clockIn and created file '${obj.dir}/${obj.filename}' version: (${saveDateTime.date}-${saveDateTime.time}) in 'record' with new entry`) }
                        // Set save info with success message
                        setSavedInfo({ table: objToSave.table, dir: objToSave.dir, filename: objToSave.filename, dateTime: objToSave.dateTime, message: 'Saved', truth: true });
                    } else {
                        // Kill save method and set save info with unexpected success method
                        setSavedInfo({ table: objToSave.table, dir: objToSave.dir, filename: objToSave.filename, dateTime: objToSave.dateTime, message: 'Unexpected save method. Investigate', truth: false });
                        throw new Error(`${response.status} Unexpected success attempting to save file '${obj.dir}/${obj.filename}' version: (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in 'record' with new entry:\n ${response.msg}`)
                    }
                } else {
                    // Kill save method and set save info with failure message
                    setSavedInfo({ table: objToSave.table, dir: objToSave.dir, filename: objToSave.filename, dateTime: objToSave.dateTime, message: 'Failed to overwrite', truth: false });
                    throw new Error(`${response.status} Error attempting to save file '${objToSave.dir}/${objToSave.filename}' version: (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in 'record' with new entry:\n ${response.msg}`);
                }
            } 

            // Overwrite original 'record' or delete it and save under new dateTime
            else if (overwrite) {
                // Delete record if endTime !== previous version's dateTime
                if (saveDateTime.date !== obj.dateTime.date || saveDateTime.time !== obj.dateTime.time) {
                    const deleteResponse = await newDeleteEntry(obj.table, obj.dateTime, obj.userID, obj.dir, obj.filename);
                    if (deleteResponse.truth) {
                        if (deleteResponse.status === 200) {
                            if (logCheck(printLevel, ['d', 'b']) > 0) { console.log(`Deleted file '${obj.dir}/${obj.filename}' version: (${obj.dateTime.date}-${obj.dateTime.time}) in 'clockIn' with new entry`) }
                        } else {
                            // Set save info with unexpected delete success message
                            setSavedInfo({ table: obj.table, dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime, message: 'Unexpected temp delete method. Investigate', truth: false });
                            throw new Error(`${deleteResponse.status} Unexpected success attempting to delete file '${obj.dir}/${obj.filename}' version: (${obj.dateTime.date}-${obj.dateTime.time}) in '${obj.table}' with new entry:\n ${deleteResponse.msg}`)
                        }
                    } else {
                        // Set save info with failure to delete message
                        setSavedInfo({ table: obj.table, dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime, message: 'Failed to delete temp', truth: false });
                        throw new Error(`${deleteResponse.status} Error attempting to delete file '${obj.dir}/${obj.filename}' version: (${obj.dateTime.date}-${obj.dateTime.time}) in '${obj.table}' with new entry:\n ${deleteResponse.msg}`);
                    }
                }
                // Overwrite or save new record if delete was triggered
                const response = await newSaveObject(objToSave);
                if (response.truth) {
                    if (logCheck(printLevel, ['d', 'b']) > 0) { console.log(`Overwrote file '${objToSave.dir}/${obj.filename}' version: (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in '${objToSave.table}' with new entry`) }
                    setSavedInfo({ table: objToSave.table, dir: objToSave.dir, filename: objToSave.filename, dateTime: objToSave.dateTime, message: 'Overwrote', truth: true });
                } else {
                    setSavedInfo({ table: objToSave.table, dir: objToSave.dir, filename: objToSave.filename, dateTime: objToSave.dateTime, message: 'Failed to overwrite', truth: false });
                    throw new Error(`${response.status} Error attempting to overwrite file '${objToSave.dir}/${objToSave.filename}' version: (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in '${objToSave.table}' with new entry:\n ${response.msg}`);
                }
            } 

            // Save new file to 'record' or 'clockIn'
            else {
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
            console.error('Error saving record:', err);
        }
    }


    return (
        <div className="mainContainer">
            <button onClick={() => console.log(obj)}>Log Object</button>
            { /** Choose 'customUI' table (only save new or clock in) */
                (!obj.payload && !obj.options && obj.table !== 'customUI')
                ?   <button onClick={() => setObj(prevState => ({ ...prevState, table: 'customUI' }))} >
                    Use UIs
                </button>
                :   <button style={{ color: 'gray' }} >
                    Use UIs
                </button>
            } 
            { /** Choose 'record' table (only overwrite) */
                (!obj.payload && !obj.options && obj.table !== 'record')
                ?   <button onClick={() => setObj(prevState => ({ ...prevState, table: 'record' }))} >
                    Use Records
                </button>
                :   <button style={{ color: 'gray' }} >
                    Use Records
                </button>
            }
            <RecordFileAccess 
                printLevel={printLevel}
                defaultPayload={null}
                obj={obj}
                setObj={setObj}
                loadedInfo={loadedInfo}
                savedInfo={savedInfo}
                getFile={getRecord}
                saveFile={saveRecord}/>
            { /** Display customized info interface */
                obj.payload &&
                    <div>
                        <UI UI={obj.payload} setObj={setObj} />
                        { /** Display and allow edit of start time if desired */
                            obj.payload[obj.payload.length - 2]?.type === "start" &&
                                <DateInput date={obj.payload[obj.payload.length - 2]} setObj={setObj} dateValidity={dateValidity.start} />
                        }
                        { /** Display and allow edit of end time */
                            obj.payload[obj.payload.length - 1]?.type === "end" &&
                                <DateInput date={obj.payload[obj.payload.length - 1]} setObj={setObj} dateValidity={dateValidity.end} />
                        }
                    </div>
            } 
        </div>
    );
}

/** Handles everything about retrieving and saving a file so the calling function just
 * has to deal with functions and payload
 * 
 * No need to getDirsAndFiles.
 * No need to empty payload.
 * Just straight hands.
 * 
 * @param {Object} props - The properties passed to the component.
 * @param {string[]} props.printLevel - The array of strings defined in App.js to determine what to print
 * @param {any} props.defaultPayload - The default value to set for `obj.payload` when resetting.
 * @param {Object} props.obj - The state object containing information such as directory, filename, and dateTime.
 * @param {Function} props.setObj - A state setter function for updating the `obj` state.
 * @param {Object} props.loadedInfo - Information about the currently loaded file, including directory, filename, and dateTime.
 * @param {Object} props.savedInfo - Information about the most recently saved file, including status and messages.
 * @param {Function} props.getFile - A function to load the selected file's content.
 * @param {Function} props.saveFile - A function to save the current file, accepting a boolean indicating overwrite mode.
 *
 * @returns {JSX.Element} The rendered FileAccess component.
 */
const RecordFileAccess = ({ printLevel, defaultPayload, obj, setObj, loadedInfo, savedInfo, getFile, saveFile }) => {

    // Info for dropdown menus
    const [dirs, setDirs] = useState([]);
    const [fileInfo, setFileInfo] = useState([]);

    // Fetch dirs and files and empty object (except userID, dir, filename) when table changes
    useEffect(() => {
        getDirsAndFiles();
    },[obj.table]);

    // Fetch dirs and files on load and when savedInfo changes
    // Also empty payload and options on savedInfo changes if successful
    useEffect(() => {
        if (savedInfo?.truth) {
            setObj(prevState => ({ ...prevState, options: null, payload: defaultPayload }));
            if (logCheck(printLevel, ['o']) === 1) { console.log(`obj.options and obj.payload emptied`) }
            else if (logCheck(printLevel, ['o']) === 2) { console.log(`obj.options set to 'null'\n obj.payload set to '${defaultPayload}' ('null' is null, not a string)`) }
        }
        getDirsAndFiles();
    }, [savedInfo]);

    // Empties filename if dir is changed 
    // unless loadedInfo dir, filename, and dateTime are equal to those of obj (load from fileExplorer workaround)
    useEffect(() => {
        if (loadedInfo.dir !== obj.dir
            || loadedInfo.filename !== obj.filename
            || loadedInfo.dateTime.date !== obj.dateTime.date
            || loadedInfo.dateTime.time !== obj.dateTime.time) {
            if (logCheck(printLevel, ['o']) === 2) { console.log('obj.filename emptied') }
            setObj(prevObj => ({ ...prevObj, filename: '' }));
        }
    }, [obj.dir]);

    // Autofills or empties dateTime when dir or filename is changed
    // unless loadedInfo dir, filename, and dateTime are equal (load from FileExplorer workaround)
    useEffect(() => {
        if (loadedInfo.dir !== obj.dir
            || loadedInfo.filename !== obj.filename
            || loadedInfo.dateTime.date !== obj.dateTime.date
            || loadedInfo.dateTime.time !== obj.dateTime.time) {
            if (fileInfo.map(i => i.directory).includes(obj.dir) && fileInfo.map(i => i.filename).includes(obj.filename)) {
                const mostRecent = newChooseMostRecent(fileInfo, obj.dir, obj.filename);
                if (logCheck(printLevel, ['o']) === 2) { console.log(`obj.dateTime set to '${mostRecent.date}'-'${mostRecent.time}'`) }
                setObj(prevState => ({ ...prevState, dateTime: mostRecent }));
            } else {
                setObj(prevState => ({ ...prevState, dateTime: { date: '', time: '' } }));
                if (logCheck(printLevel, ['o']) === 2) { console.log(`obj.dateTime emptied`) }
            }
        }
    }, [obj.dir, obj.filename]);

    /** Gets dirs and files where directories is all unqiue directories and
    * files is an array of objects containing dateTime, directory, and filename
    */
    const getDirsAndFiles = async () => {
        try {
            const response = await newFetchDirsAndFiles(obj.table, obj.userID);
            if (response.truth) {
                setFileInfo(response.files);
                setDirs(response.dirs);
                if (logCheck(printLevel, ['s']) === 1) { console.log(`Successfully got dirs and files from ${obj.table}`) }
                else if (logCheck(printLevel, ['s']) === 2) { console.log(`Successfully got dirs and files from ${obj.table}.\n dirs`, dirs, '\nfiles:', response.files) }
            } else {
                setFileInfo([]);
                setDirs([]);
                throw new Error(`${response.status} Error getting dirs and files from ${obj.table}: ${response.msg}`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    /** Update object property with inputValue */
    const uponInputChange = (inputValue, prop) => {
        setObj(prevState => ({ ...prevState, [prop]: inputValue }));
    };

    /** Update object property (which is also an object) with inputValue */
    const uponObjectInputChange = (inputValue, prop) => {
        // Attempt to parse and notify upon uncaught failure
        try {
            const parsedObj = JSON.parse(inputValue);
            setObj(prevState => ({ ...prevState, [prop]: parsedObj }));
            if (logCheck(printLevel, ['o']) === 2) { console.log(`obj.dateTime set to: ${JSON.stringify(parsedObj)}`) }
        } catch (err) {
            if (prop === 'dateTime') {
                const emptyDateTime = { date: '', time: '' };
                setObj(prevState => ({ ...prevState, dateTime: emptyDateTime }));
                if (logCheck(printLevel, ['o']) === 2) { console.log(`obj.dateTime set to: ''-''`) }
            } else {
                console.error(`No catch for unparseable object attempting to alter obj.${prop}`, inputValue, '\n Error', err);
            }
        }
    };

    return (
        <div>
            <div className="flexDivTable">
                {/** Directory row */}
                <div className="flexDivRows">
                    <p className="flexDivColumns">Directory:</p>
                    <select
                        value={obj.dir}
                        onChange={(e) => uponInputChange(e.target.value, 'dir')}
                        disabled={obj.payload || obj.options}
                        >
                        <option key={'empty'} value={''}></option>
                        {// Return all tiers of obj.dir
                            obj.dir !== '' &&
                                obj.dir.split('/').map((dir, i) => (
                                    <option key={i} value={obj.dir.split('/').slice(0,i+1).join('/')}>
                                        {obj.dir.split('/').slice(0,i+1).join('/')}
                                    </option>
                                ))
                        }
                        {// Return subdirectories based on obj.dir
                            dirs.length > 0 &&
                            [...new Set(
                                dirs.map((dir) => {
                                    // return all leading directories
                                    if (obj.dir === '') {
                                        return dir.split('/')[0];
                                    }
                                    // return all subdirectories of obj.dir
                                    else if (dir.startsWith(obj.dir) && dir.split('/').length > obj.dir.split('/').length) {
                                        return dir.split('/').slice(0, obj.dir.split('/').length + 1).join('/');
                                    }
                                    // ignore other cases
                                    else {
                                        return null;
                                    }
                                })
                            )].filter((dir) => dir !== null)
                            .map((dir, index) => (
                                <option key={index} value={dir}>{dir}</option>
                            ))
                        }
                    </select>
                </div>
                {/** Filename row */}
                <div className="flexDivRows">
                    <p className="flexDivColumns">Filename:</p>
                    <select
                        value={obj.filename}
                        onChange={(e) => uponInputChange(e.target.value, 'filename')}
                        disabled={obj.payload || obj.options}
                        >
                        <option key={'empty'} value={''}></option>
                        { // Return all suggested filenames, set removes duplicates
                            fileInfo.length > 0 &&
                            [...new Set(fileInfo
                                .filter((file) => file.directory === obj.dir) // Filter out files that don't match dir input
                                .map((file) => file.filename) // Extract the filename
                            )].map((filename, index) => (
                                <option key={index} value={filename}>{filename}</option>
                            ))
                        }
                    </select>
                </div>
                {/** Version row */}
                <div className="flexDivRows">
                    <p className="flexDivColumns">Version:</p>
                    <select
                        value={JSON.stringify(obj.dateTime)}
                        onChange={(e) => uponObjectInputChange(e.target.value, 'dateTime')}
                        disabled={obj.payload || obj.options}
                        >
                        <option key={'new'} value={'new'}>New</option>
                        { // Create option for each version and order in reverse of database import
                            fileInfo.length > 0 && fileInfo.slice().reverse().map((file, index) => {
                                if (file.filename === obj.filename && file.directory === obj.dir) {
                                    return (
                                        <option key={index} value={JSON.stringify(file.dateTime)}>
                                            {convertUTCstringsToLocal(file.dateTime).date + '-' + convertUTCstringsToLocal(file.dateTime).time}
                                        </option>
                                    );
                                }
                            })
                        }
                    </select>
                </div>
            </div>
            {/** Button row (saving, loading, notifying) */}
            <div className="flexDivRows">
                { // Render load content button if all necessary fields are filled and payload is empty
                    obj.dir && obj.filename && obj.dateTime.date && !obj.payload
                        ? <div>
                            <button onClick={() => getFile()}>Load Content</button>
                        </div>
                        : <div>
                            <button style={({ color: 'gray' })}>Load Content</button>
                        </div>
                } 
                { // Render empty content button if all necessary fields are filled and not clocking out
                    ((obj.payload || obj.options) && obj.table !== 'clockIn')
                        ? <div>
                            <button onClick={() => setObj(prevState => ({ ...prevState, options: null, payload: null}))}>Empty Content</button>
                        </div>
                        : <div>
                            <button style={({ color: 'gray' })}>Empty Content</button>
                        </div>
                } 
                { // Display Save New, Clock In, and Overwrite conditionally
                    // If version defined and table is 'clockIn' gray out all but Clock Out
                    obj.dateTime.date && obj.table === 'clockIn' ? 
                        <div>
                            <button style={({ color: 'gray' })}>Save New</button>
                            <button onClick={() => saveFile(true, 'clockOut')}>Clock Out</button>
                            <button style={({ color: 'gray' })}>Overwrite</button>
                        </div>
                    // Else if version is defined gray out all but Overwrite
                        : obj.dateTime.date ?
                        <div>
                            <button style={({ color: 'gray' })}>Save New</button>
                            <button style={({ color: 'gray' })}>Clock In</button>
                            <button onClick={() => saveFile(true, 'record')}>Overwrite</button>
                        </div>
                        // Else gray out overwrite
                        : 
                        <div>
                            <button onClick={() => saveFile(false, 'record')}>Save New</button>
                            <button onClick={() => saveFile(false, 'clockIn')}>Clock In</button>
                            <button style={({ color: 'gray' })}>Overwrite</button>
                        </div>
                } 
                { /** Display save result with more info available upon hover - disappear when payload or options is not empty*/
                    savedInfo && (obj.payload === null || obj.payload === '') &&
                    <p className="moreButton" style={{ cursor: 'default' }}>
                        {savedInfo.message} {savedInfo.filename}
                        <span className="more">
                            {savedInfo.message} {savedInfo.dir}/{savedInfo.filename} version:&nbsp;
                            {convertUTCstringsToLocal(savedInfo.dateTime).date}-
                            {convertUTCstringsToLocal(savedInfo.dateTime).time}&nbsp;
                            in {savedInfo.table}
                        </span>
                    </p>
                }
            </div>
        </div>
    );
}

const UI = ({ UI, setObj }) => {

    /** Update payload with value */
    const updatePayload = (index, index2, inValue) => {
        if (index2 === null) {
            setObj(prevState => {
                const newPayload = [...prevState.payload];
                newPayload[index] = { ...newPayload[index], value: inValue };
                return {
                    ...prevState,
                    payload: newPayload
                }
            });
        } else {
            setObj(prevState => {
                const newPayload = [...prevState.payload];
                const newValue = [...newPayload[index].value];
                newValue[index2] = inValue;
                newPayload[index] = { ...newPayload[index], value: newValue };
                return {
                    ...prevState,
                    payload: newPayload
                }
            });
        }
    }

    /** add '' to grouped value */
    const addToGroup = (group) => {
        setObj(prevState => {
            const newPayload = prevState.payload.map(item => {
                if (item.group === group) { // Check if the group matches
                    return {
                        ...item,
                        value: [...item.value, ''] // Add an empty string to the value array
                    };
                }
                return item; // Return unchanged for non-matching groups
            });
            return {
                ...prevState,
                payload: newPayload // Update the state with the modified payload
            };
        })
    }

    /** Remove index from grouped value */
    const removeFromGroup = (group, index) => {
        setObj(prevState => {
            const newPayload = prevState.payload.map(item => {
                if (item.group === group) { // Check if the group matches
                    return {
                        ...item,
                        value: item.value.filter((_, i) => i !== index) // Remove the element at the given index
                    };
                }
                return item; // Return unchanged for non-matching groups
            });

            return {
                ...prevState,
                payload: newPayload // Update the state with the modified payload
            };
        });
    }


    return (
        <div>
            {/** Display different types of UI elements */
                UI.map((element, i) => (
                    element?.type === "toggle" ?
                        <button 
                            key={i} 
                            className="flexDivRows"
                            style={{ color: element.value ? 'gray' : 'black' }}
                            onClick={() => updatePayload(i, null, !element.value)}>
                        </button>
                    : element?.type === "choice" ?
                        <div key={i} className="flexDivRows">
                            <p>{element.label}</p>
                            { /** Buttons for multiple choice question */
                                element.choices.map((choice, iChoice) => (
                                    <button 
                                        key={i+'-'+iChoice}
                                        style={{ color: element.value === choice ? 'gray' : 'black' }}
                                        onClick={() => updatePayload(i, null, choice)}>
                                        {choice}
                                    </button>
                                ))
                            }
                        </div>
                    : element?.type === "input" ?
                        <div key={i} className="flexDivRows">
                            <p>{element.label}</p>
                            { /** Inputs */
                                element.value.map((inVal, iVal) => (
                                    <div key={i + '-' + iVal}>
                                        <input
                                            value={inVal}
                                            onChange={(e) => updatePayload(i, iVal, e.target.value)} />
                                        <button onClick={() => removeFromGroup(element.group, iVal)}>-</button>
                                    </div>
                                ))
                            }
                            <button onClick={() => addToGroup(element.group)}>+</button>
                        </div>
                    : element?.type === "text" ?
                        <div key={i}>
                            <p>{element.label}</p>
                            <textarea
                                value={element.value}
                                onChange={(e) => updatePayload(i, null, e.target.value)}/>
                        </div>
                    : element?.type === "start" || element?.type === "end" ?
                        null
                    :    
                        <p>Unrecognized element {JSON.stringify(element)}</p>
                ))
            }
        </div>
    );
}

/** HTML element for editing start and end date/time of schedule */
const DateInput = ({ date, setObj, dateValidity }) => {

    /** Update date property with inputValue */
    const uponDateChange = (inputValue, prop) => {
        let updateIndex = 0;
        const updatedElement = { ...date, [prop]: inputValue }
        if (date.type === 'start') {
            updateIndex = -2;
        } else if (date.type === 'end') {
            updateIndex = -1;
        }
        // Update length -2 or -1 element of array (where start and end will always be)
        if (updateIndex !== 0) {
            setObj(prevState => {
                const updatedPayload = [...prevState.payload];
                updatedPayload[updatedPayload.length + updateIndex] = updatedElement;
                return { ...prevState, payload: updatedPayload };
            });
        } else {
            console.error("No element updated using ", date);
        }
    }

    return (
        <div className="flexDivRows">
            {/** Preceding text */
                date.type === 'start'
                ?   <p className="flexDivColumns">Start: </p>
                : date.type === 'end'
                ?   <p className="flexDivColumns">End: </p>   
                : <p className="flexDivColumns">Shouldn't get to here...</p>
            }
            <input className="twoDigitInput flexDivColumns"
                name='month1 box'
                style={{ border: dateValidity.month ? undefined : '1px solid red' }}
                value={date.month}
                onChange={(e) => uponDateChange(e.target.value, 'month')} />
            <p className="flexDivColumns">/</p>
            <input className="twoDigitInput"
                name='day1 box'
                style={{ border: dateValidity.day ? undefined : '1px solid red' }}
                value={date.day}
                onChange={(e) => uponDateChange(e.target.value, 'day')} />
            <p className="flexDivColumns">/</p>
            <input className="fourDigitInput flexDivColumns"
                name='year1 box'
                style={{ border: dateValidity.year ? undefined : '1px solid red' }}
                value={date.year}
                onChange={(e) => uponDateChange(e.target.value, 'year')} />
            <p className="flexDivColumns">at</p>
            <input className="twoDigitInput flexDivColumns"
                name='hour1 box'
                style={{ border: dateValidity.hour ? undefined : '1px solid red' }}
                value={date.hour}
                onChange={(e) => uponDateChange(e.target.value, 'hour')} />
            <p className="flexDivColumns">:</p>
            <input className="twoDigitInput flexDivColumns"
                name='minute1 box'
                style={{ border: dateValidity.minute ? undefined : '1px solid red' }}
                value={date.minute}
                onChange={(e) => uponDateChange(e.target.value, 'minute')} />
        </div>
    );
}