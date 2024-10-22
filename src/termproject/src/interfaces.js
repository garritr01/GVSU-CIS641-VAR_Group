import React, { useState, useEffect, useRef } from 'react';
import { getDateString, getTimeString, getWeekdayString,
    chooseMostRecent, formatDateToObject,
    convertUTCstringsToLocal, convertLocalStringsToUTC, parseDateObject} from './oddsAndEnds';
import { fetchDateTime, fetchDateTimes, fetchDirsAndFiles, deleteEntry,
    fetchText, fetchObject, fetchObjects, fetchFiles, saveObject, recordDateTime,
    saveText, fetchStringInstances } from './generalFetch';
import { alterMatches, createCustomUIDropdown, createCustomInfoDropdowns, convertSchedules, moveTables } from './manualEdit';
import { differenceInHours, differenceInDays, differenceInMonths, differenceInYears, addDays, addMonths, addYears, getDaysInMonth } from 'date-fns';

//For manually Deleting
//deleteEntry('scheduledEvents', {date: '10/20/2023', time: '06:40'}, 'Garrit', 'Hygiene', 'Shaving')

/** Renders the buttons for choosing functions on the main menu */
export const Functions = ({ printLevel, selectFn }) => {

    //initialize func as empty
    const func = useState('');

    //select a function based on funcName
    const anyPress = (funcName) => {
        printLevel > 0 && console.log('selected function: ', funcName);
        selectFn(funcName);
    };

    //renders the buttons for selecting different functions on the main menu
    return (
        <div>
            <h3>Functions</h3>
            <button onClick={() => anyPress("file manager")}>File Manager</button>
            <button onClick={() => anyPress("journals")}>Journal</button>
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
    );
}

/** Renders the events currently clocked into as shortcut for clocking out */
export const ClockOutOptions = ({ printLevel, selectFn, selectDirTitleAndVersion }) => {

    // Array holding objects representing events on the clock
    const [clockedInEvents, setClockedInEvents] = useState([]);

    console.log('cIE',clockedInEvents);

    useEffect(() => {
        checkForClockIns();
    },[]);

    const checkForClockIns = async () => {
        try {
            const names = await fetchFiles('inProgress','Garrit');
            printLevel > 3 && console.log('clocked into ', names.map(element => element.directory+'/'+element.title).join(', '))
            setClockedInEvents(names);
        } catch (err) {
            console.error('Error fetching directories and files:', err);
        };
    }

    const handleClockOut = (event) => {
        selectDirTitleAndVersion(event.directory,event.title,event.dateTime);
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
        } catch(err) {
            console.log("Error getting UI names for quickNotes:",err);
        }
        try {
            const files = await fetchFiles('customInfo', 'Garrit');
            setListInfo(files);
        } catch(err) {
            console.error("Error getting info nmes for quickNotes:",err);
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
        } catch(err) {
            console.log('QuickNotes failed to import files:',err);
        }
    }

    return (
        <div>
            {quickNotes && quickNotes.map((event, index) => (
                <div key={index}>
                    <div style={{ display: 'flex'}}>
                        <p>{event.info.event} due {event.info.dueDate} ({event.info.urgency})</p>
                        {(event.info.subtitle && event.info.subtitle !== 'NA' && chooseMostRecent(listInfo, event.directory,event.title) !== '')
                            ?   <button onClick={() => handleResolution(event, 'customEdit', listInfo)}>Resolve and Update</button>
                            :   chooseMostRecent(listUIs, event.directory, event.title) !== ''
                                ?   <button onClick={() => handleResolution(event, 'customInfo', listUIs)}>Resolve and Input</button>
                                :   <button onClick={() => handleResolution(event, null, null)}>Resolve</button>
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

/** Renders the main menu and handles selection */
export const MainMenu = ({ printLevel, selectFn, selectResolutionInfo, selectDirTitleAndVersion }) => {

    // Renders military time and all main menu functions
    return (
        <div>
            <h1>ROSA</h1>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <h4>{getDateString()}</h4>
                <h4>-{getTimeString()}</h4>  
            </div>
            {console.log('mm render')}
            <Functions printLevel={printLevel} selectFn={selectFn}/>
            <ClockOutOptions printLevel={printLevel} selectFn={selectFn} selectDirTitleAndVersion={selectDirTitleAndVersion} />
            <ScheduleView printLevel={printLevel} selectFn={selectFn} selectResolutionInfo={selectResolutionInfo} selectDirTitleAndVersion={selectDirTitleAndVersion} mode={'mainMenu'} />
            <QuickNotes printLevel={printLevel} selectFn={selectFn} selectDirTitleAndVersion={selectDirTitleAndVersion} />
        </div>
    );
}

/** Renders journal and handles saving  */
export const Journal = ({ printLevel, selectFn, preselectedDir, preselectedTitle, preselectedVersion }) => {

    const selectedDir = preselectedDir || '';
    const selectedTitle = preselectedTitle || '';
    const selectedVersion = preselectedVersion || '';

    const [dir, setDir] = useState(selectedDir);
    const [title, setTitle] = useState(selectedTitle);
    const [version, setVersion] = useState(selectedVersion);
    const [entry, setEntry] = useState('');
    const [listOfFiles, setListOfFiles] = useState([]);
    const [listOfDirs, setListOfDirs] = useState([]);

    useEffect(() => {
        if (preselectedTitle !== null) {
            loadContent();
        };
        callFetchDirsAndFiles();
    }, []);

    useEffect(() => {
        if (listOfDirs.includes(dir) && listOfFiles.map(i => i.title).includes(title)) {
            setVersion(chooseMostRecent(listOfFiles, dir, title));
        }
    },[title,dir])

    useEffect(() => {
        if (version) {
            loadContent();
        }
    },[version])

    const uponInputChange = (inputValue, setInputValue) => {
        setInputValue(inputValue);
    };

    const callFetchDirsAndFiles = async () => {
        try {
            const dirsAndFiles = await fetchDirsAndFiles('journals','Garrit');
            setListOfFiles(dirsAndFiles.files);
            setListOfDirs(dirsAndFiles.directories);
        } catch (err) {
            console.error('Error fetching dirs and files:', err);
        }
    };

    const loadContent = async () => {
        try {
            const content = await fetchText('journals', version, 'Garrit', dir, title); // Fetch directories and files from the Flask server
            setEntry(content);
        } catch(err) {
            console.error('Error fetching directories and files:', err);
        };
        console.log()
    };

    const closeJournal = async (save) => {
        if (save) {
            try {
                const response = await saveText('journals', entry, { date:getDateString(), time:getTimeString() }, 'Garrit', dir, title);
                console.log(response);
            } catch(err) {
                console.error('Error occurred while saving entry:', err);
            }
            if ( selectedDir && selectedTitle && 
                (selectedTitle !== title || selectedDir !== dir) ) {
                // The version argument here needs to be updated to correctly discover what the old version was
                try {
                    const response = await deleteEntry('journals',version,'Garrit',selectedDir,selectedTitle);
                    console.log(response);
                }
                catch(err) {
                    console.error('Error removing entry:', err);
                }
            }
        }
        selectFn('main');
    };

    return (
        <div>
            <h2>Journal Interface</h2>
            <div>
                <input
                    name='directory box'
                    value={dir}
                    list='dirnames'
                    onChange={(e) => uponInputChange(e.target.value, setDir)}
                    style={({ width: '400px', height: '20px' })}
                />
                <datalist id='dirnames'>
                    {listOfDirs.length > 0 &&
                    listOfDirs.map((name, index) => (
                        <option key={index} value={name} />
                    ))}
                </datalist>
                <input
                    name='title box'
                    value={title}
                    list='filenames'
                    onChange={(e) => uponInputChange(e.target.value, setTitle)}
                    style={({ width: '400px', height: '20px' })}
                />
                <datalist id='filenames'>
                    {listOfFiles.length > 0 && 
                    listOfFiles.filter((name) => name.directory === dir)
                        .filter((obj, index, self) =>
                            index === self.findIndex((o) => o.title === obj.title)
                        ).map((name, index) => <option key={index} value={name.title} />)}
                </datalist>
                <select
                    value={JSON.stringify(version)}
                    onChange={(e) => setVersion(JSON.parse(e.target.value))}
                    >
                    {listOfFiles.map((option, index) => (
                        option.directory === dir && option.title == title
                        && <option key={index} value={JSON.stringify(option.dateTime)}>
                            {convertUTCstringsToLocal(option.dateTime).date + '-' + convertUTCstringsToLocal(option.dateTime).time}
                        </option>
                    ))}
                </select>
            </div>
            <textarea
                name="journal box"
                value={entry}
                onChange={(e) => uponInputChange(e.target.value, setEntry)}
                style={{ width: '400px', height: '400px' }}
            />
            <button onClick={() => closeJournal(true)}>Save and Close</button>
            <button onClick={() => closeJournal(false)}>Cancel</button>
        </div>
    );
}
/** Renders custom input and handles saving */
export const CustomInput = ({ printLevel, selectFn, preselectedDir, preselectedTitle, preselectedVersion, resolutionInfo, selectDirTitleAndVersion, mode }) => {

    // if preselected doesn't exist use empty string
    const selectedDir = preselectedDir || '';
    const selectedTitle = preselectedTitle || '';
    const selectedVersion = preselectedVersion || '';
    // if time change called for alter to match local time zone
    const selectedEndDateTime = 
        resolutionInfo && resolutionInfo.endDate
            ?   resolutionInfo.UTC
                ?   convertUTCstringsToLocal({ date: resolutionInfo.endDate, time: resolutionInfo.endTime })
                :   { date: resolutionInfo.endDate, time: resolutionInfo.endTime }
            :   (preselectedVersion && mode === 'edit') 
                ?   convertUTCstringsToLocal(preselectedVersion)
                :   { date: getDateString(true), time: getTimeString(true) };

    const [directory, setDirectory] = useState(selectedDir);
    const [title, setTitle] = useState(selectedTitle);
    const [outputDirectory, setOutputDirectory] = useState(
        resolutionInfo && resolutionInfo.subtitle && resolutionInfo.subtitle !== 'NA' 
            ?   selectedDir + '/' + selectedTitle
            :   selectedDir
            );
    const [outputTitle, setOutputTitle] = useState(
        resolutionInfo && resolutionInfo.subtitle && resolutionInfo.subtitle !== 'NA' 
            ?   resolutionInfo.subtitle
            :   selectedTitle
            );
    const [subtitleList, setSubtitleList] = useState(null);
    const [versionType, setVersionType] = useState('UI');
    const [version, setVersion] = useState(selectedVersion);
    const [existingFiles, setExistingFiles] = useState([]);
    const [output, setOutput] = useState([]);
    const [dateTime, setDateTime] = useState({ date: getDateString(true), time: getTimeString(true) });
    const [endDateTime, setEndDateTime] = useState(selectedEndDateTime);
    const [dropdowns, setDropdowns] = useState({});
    const [saveFailed, setSaveFailed] = useState(null);
    const [override, setOverride] = useState(false);

    useEffect(() => {
        const callFetchDateTime = async () => {
            const dateTimeIn = await fetchDateTime('timeRecords','Garrit','lastTime', 'customInfo');
            setDateTime(convertUTCstringsToLocal(dateTimeIn));
        };
        if (mode !== 'clock in' || mode !== 'resolve') {
            callFetchDateTime();
        }
        callFetchFiles();
        console.log('CustomInput mode:',mode)
        console.log('(preselections)','dir:',preselectedDir, 'title:',preselectedTitle, 'version:',preselectedVersion);
    }, [versionType]);

    useEffect(() => {
        if (!preselectedVersion
            && existingFiles.map(i => i.directory).includes(directory) 
            && existingFiles.map(i => i.title).includes(title)) {
            const mostRecent = chooseMostRecent(existingFiles, directory, title);
            setVersion(mostRecent);
        }
    }, [directory, title, versionType]);

    useEffect(() => {

    },[endDateTime]);

    //* Updates inputs when typing */
    const uponInputChange = (inputValue, setInputValue) => {
        setInputValue(inputValue);
    };

    const uponCustomInputChange = (inputValue, index, secondaryIndex=null) => {
        if (secondaryIndex || secondaryIndex === 0) {
            const updatedOutVal = output[index].outVal;
            updatedOutVal[secondaryIndex] = inputValue;
            setOutput(output.map((element, i) => (i === index ? { ...element, outVal: updatedOutVal } : element)));
        } else {
            setOutput(output.map((element, i) => (i === index ? { ...element, outVal: inputValue } : element)));
        }
    };

    const handleSoloButton = (index) => {
        if (output[index].outVal[0] === '' || output[index].outVal[0] === 'enabled') {
            setOutput(output.map((element, i) => (i === index ? { ...element, outVal: ['disabled'] } : element)));
        } else if (output[index].outVal[0] === 'disabled') {
            setOutput(output.map((element, i) => (i === index ? { ...element, outVal: ['enabled'] } : element)));
        } else {
            console.log("the output is not '', 'enabled', or 'disabled', it's:", output[index].outVal);
        }
    };

    //* Fetches filesystem */
    const callFetchFiles = async () => {
        try {
            const data = await fetchFiles( 
                versionType === 'Info' ? 'customInfo'
                : (mode === 'clock in' || mode === 'record' || mode === 'resolve' || mode === 'resolveMain') ? 'customUI'
                : (mode === 'clock out') ? 'inProgress'
                : 'customInfo'
                , 'Garrit');
            setExistingFiles(data);
            if (!preselectedVersion || mode === 'record'
                && data.map(i => i.directory).includes(directory) 
                && data.map(i => i.title).includes(title)) {
                const mostRecent = chooseMostRecent(data, directory, title);
                setVersion(mostRecent);
            }
        } catch (err) {
            console.error('Error fetching existing names:', err);
        }
    }

    //* Moves user to customUI to create new if required */
    const callCreateNewUI = () => {
        selectDirTitleAndVersion(directory, title);
        selectFn('customUI');
    }

    //* Fetches dropdown suggestions for faster input */
    const fetchDropdowns = async () => {
        try {
            const files = await fetchFiles('miscDropdowns','Garrit');
            const mostRecent = chooseMostRecent(files, 'CustomInfo/'+outputDirectory, outputTitle);
            const dropdownObject = await fetchObject('miscDropdowns',mostRecent,'Garrit','CustomInfo/'+outputDirectory,outputTitle);
            setDropdowns(dropdownObject);
        } catch(err) {
            console.error('Error fetching dropdowns:',err);
        }
    }

    //* Adds new options to dropdown menu */
    const saveDropdowns = async (UI) => {
        try {
            const files = await fetchFiles('miscDropdowns', 'Garrit');
            const mostRecent = chooseMostRecent(files, 'CustomInfo/' + outputDirectory, outputTitle);
            const dropdownsOut = {};
            for (const index in UI) {
                if (UI[index].type !== 'soloButton' && UI[index].type !== 'text box' && UI[index].type !== 'endDate'
                    && UI[index].type !== 'endTime' && UI[index].type !== 'startDate' && UI[index].type !== 'startTime') {
                    const newOptions = [];
                    const repeatOptions = [];
                    await Promise.all(UI[index].outVal.map((value) => {
                        if (!dropdowns[UI[index].text] || !dropdowns[UI[index].text].includes(value)) {
                            newOptions.push(value);
                        } else {
                            repeatOptions.push(value);
                        }
                    }));
                    if (Object.keys(dropdowns).includes(UI[index].text)) {
                        dropdownsOut[UI[index].text] = Array.from(new Set([...newOptions, ...repeatOptions, ...dropdowns[UI[index].text].filter(option => !repeatOptions.includes(option))]));
                    } else {
                        dropdownsOut[UI[index].text] = Array.from(new Set(newOptions));
                    }
                }
            }
            console.log(dropdownsOut);
            if (mostRecent !== '') {
                const response = await saveObject('miscDropdowns',dropdownsOut,mostRecent,'Garrit','CustomInfo/'+outputDirectory,outputTitle);
                console.log(response);
            } else {
                const response = await saveObject('miscDropdowns',dropdownsOut,{ date: getDateString(), time: getTimeString() },'Garrit','CustomInfo/'+outputDirectory,outputTitle);
                console.log(response);
            }
        } catch (err) {
            console.error('Error saving dropdowns:',err);
        }
    }

    /*** Fetches empty UI if no imported directory
     **  Fetches custom UI if imported directory
     */
    const callFetchObject = async () => {
        setEndDateTime({ date: getDateString(true), time: getTimeString(true) });
        if (mode === 'clock out') {
            console.log("fetching inProgress's", directory, 'UI from', title, 'v', version);
            try {
                const UIinput = await fetchObject('inProgress', version, 'Garrit', directory, title);
                const startConverted = convertUTCstringsToLocal({ 
                    date: UIinput.find(element => element.type === 'startDate').outVal,
                    time: UIinput.find(element => element.type === 'startTime').outVal
                });
                console.log('sC',startConverted);
                setOutput(UIinput.map((element) => (
                    element.type === 'startDate' ? { ...element, outVal: startConverted.date }
                    : element.type === 'startTime' ? { ...element, outVal: startConverted.time }
                    : { ...element }
                )));
            } catch (err) {
                console.error('Error fetching UI:', err);
            }
        } else if (mode === 'resolve' || mode == 'resolveMain') {
            try {

                const mostRecentOrNot = async () => {
                    if (resolutionInfo && resolutionInfo.subtitle && resolutionInfo.subtitle !== 'NA') {
                        const infoFiles = await fetchFiles('CustomInfo', 'Garrit');
                        return chooseMostRecent(infoFiles, outputDirectory, outputTitle);
                    } else {
                        return '';
                    }
                }

                const mostRecent = await mostRecentOrNot();

                if (mostRecent !== '') {
                    console.log("fetching customInfo's", outputDirectory, 'UI from', outputTitle, 'v', mostRecent);
                    try {
                        const UIinput = await fetchObject('customInfo', mostRecent, 'Garrit', outputDirectory, outputTitle);
                        const startDateIn = UIinput.find((element) => (element.type === 'startDate'));
                        const startTimeIn = UIinput.find((element) => (element.type === 'startTime'));
                        if (UIinput.find((element) => element.type === 'subtitle') && resolutionInfo && resolutionInfo.subtitle && resolutionInfo.subtitle === 'NA') {
                            setOutputDirectory(selectedDir + '/' + selectedTitle);
                            setOutputTitle('')
                        }
                        setOutput(UIinput.map((element) => (
                            element.type === 'startDate' ? { ...element,
                                outVal: resolutionInfo.UTC
                                    ? convertUTCstringsToLocal({ date: resolutionInfo.startDate, time: resolutionInfo.startTime }).date
                                    : resolutionInfo.startDate }
                            : element.type === 'startTime' ? { ...element,
                                outVal: resolutionInfo.UTC
                                    ? convertUTCstringsToLocal({ date: resolutionInfo.startDate, time: resolutionInfo.startTime }).time
                                    : resolutionInfo.startTime }
                            : { ...element })));
                    } catch (err) {
                        console.error('1. Error fetching subtitled info:', err);
                    }
                } else {
                    console.log("fetching CustomUI's", directory, 'UI from', title, 'v', version);
                    try {
                        const UIinput = await fetchObject('CustomUI', version, 'Garrit', directory, title);
                        if (UIinput.find((element) => element.type === 'subtitle') && resolutionInfo && resolutionInfo.subtitle && resolutionInfo.subtitle === 'NA') {
                            setOutputDirectory(selectedDir + '/' + selectedTitle);
                            setOutputTitle('')
                        }
                        setOutput(UIinput.map((element) => (
                            element.type === 'startDate' ? { ...element,
                                outVal: resolutionInfo.UTC
                                    ? convertUTCstringsToLocal({ date: resolutionInfo.startDate, time: resolutionInfo.startTime }).date
                                    : resolutionInfo.startDate }
                            : element.type === 'startTime' ? { ...element,
                                outVal: resolutionInfo.UTC
                                    ? convertUTCstringsToLocal({ date: resolutionInfo.startDate, time: resolutionInfo.startTime }).time
                                    : resolutionInfo.startTime }
                            : { ...element, outVal: [''] })));
                    } catch (err) {
                        console.error('Error fetching UI:', err);
                    }
                }
            } catch(err) {
                console.log('2. Error fetching resolution info:',err);
            }
        } else if ( mode === 'record' || mode === 'clock in' ) {
            console.log("fetching custom"+versionType+"'s", directory, 'UI from', title, 'v',version);
            try {
                const UIinput = await fetchObject(versionType === 'UI' ? 'customUI' : 'customInfo', version, 'Garrit', directory, title);
                if (versionType == "Info") {
                    setEndDateTime(convertUTCstringsToLocal(version));
                }
                if (UIinput.some(element => element.type === 'subtitle')) {
                    setOutputDirectory(directory + '/' + title);
                    setOutputTitle(
                    (resolutionInfo && resolutionInfo.subtitle && resolutionInfo.subtitle !== 'NA')
                        ?   resolutionInfo.subtitle 
                        :   '');
                    try {
                        const infoFiles = await fetchFiles('customInfo', 'Garrit');
                        setSubtitleList(Array.from(new Set(infoFiles.map((file) => {
                            if (file.directory === directory + '/' + title) {
                                return file.title;
                            } else {
                                return null;
                            }
                        }))).filter((element) => (element)));
                    } catch(err) {
                        console.error('Error retrieving subtitle list',err);
                    }
                } else {
                    setSubtitleList(null);
                }
                setOutput(UIinput.map((element) => (
                    element.type === 'startDate' ? { ...element, outVal: mode === 'record' ? dateTime.date : getDateString(true)}
                    : element.type === 'startTime' ? { ...element, outVal: mode === 'record' ? dateTime.time : getTimeString(true)}
                    : (element.type.includes('spending') || element.type.includes('earning')) ? { ...element, outVal: ['']}
                    : {...element, outVal: element.outVal ? element.outVal : ['']})));
            } catch (err) {
                console.error('Error fetching UI:', err);
            }
        } else {
            console.log("fetching customInfo's", directory, 'UI from', title, 'v', version);
            try {
                const UIinput = await fetchObject('customInfo', version, 'Garrit', directory, title);
                const startDateIn = UIinput.find((element) => (element.type === 'startDate'));
                const startTimeIn = UIinput.find((element) => (element.type === 'startTime'));
                if (UIinput.some(element => element.type === 'subtitle')) {
                    setOutputDirectory(directory + '/' + title);
                    setOutputTitle(
                        (resolutionInfo && resolutionInfo.subtitle && resolutionInfo.subtitle !== 'NA')
                            ? resolutionInfo.subtitle
                            : '');
                    try {
                        const infoFiles = await fetchFiles('customInfo', 'Garrit');
                        setSubtitleList(Array.from(new Set(infoFiles.map((file) => {
                            if (file.directory === directory + '/' + title) {
                                console.log(file.title);
                                return file.title;
                            } else {
                                return null;
                            }
                        }))).filter((element) => (element)));
                    } catch (err) {
                        console.error('Error retrieving subtitle list', err);
                    }
                } else {
                    setSubtitleList(null);
                }
                setOutput(UIinput.map((element) => (
                    element.type === 'startDate' ? { ...element, outVal: convertUTCstringsToLocal({ date: startDateIn.outVal, time: startTimeIn.outVal }).date }
                    : element.type === 'startTime' ? { ...element, outVal: convertUTCstringsToLocal({date: startDateIn.outVal, time: startTimeIn.outVal }).time }
                    : { ...element })));
                setEndDateTime(convertUTCstringsToLocal(version));
            } catch (err) {
                console.error('Error fetching UI:', err);
            }
        }
        fetchDropdowns();
    };

    //* Handles the closing and saving of custom inputs */
    const closeCustomInput = async (save, clockOut) => {
        if (save) {

            const localStartTime = (output.find((element) => (element.type === 'startTime')) || { outVal: null }).outVal;
            const localStartDate = (output.find((element) => (element.type === 'startDate')) || { outVal: null }).outVal;
            const localStartDateObject = parseDateObject({ date: localStartDate, time: localStartTime });
            const localEndDateObject = parseDateObject({ date: endDateTime.date, time: endDateTime.time });
            if (!override && mode !== 'clock in' && localStartDateObject > localEndDateObject) {
                setSaveFailed("End < Start!! Fix it.");
                return 0;
            } else if (!override && mode !== 'clock in' && differenceInHours(localEndDateObject, localStartDateObject) > 12 ) {
                setSaveFailed("Time span greater than 12 hours. Are you Sure?");
                return 0;
            }
            let convertedOutput;
            if (localStartTime && localStartDate) {
                const convertedStartDateTime = convertLocalStringsToUTC({ date: localStartDate, time: localStartTime });
                console.log(convertedStartDateTime);
                convertedOutput = output.map((element) => {
                    if (element.type === 'startTime') {
                        return { ...element, outVal: convertedStartDateTime.time };
                    } else if (element.type === 'startDate') {
                        return { ...element, outVal: convertedStartDateTime.date };
                    } else {
                        return element;
                    }
                })
            } else {
                convertedOutput = output;
            }

            convertedOutput = convertedOutput.filter((element) => element.type !== 'subtitle');

            saveDropdowns(convertedOutput);

            if (mode === 'clock in' || (mode === 'clock out' && !clockOut)) {
                try {
                    const responseMsg = await saveObject('inProgress', convertedOutput, convertLocalStringsToUTC(endDateTime), 'Garrit', outputDirectory, outputTitle);
                    console.log(responseMsg);
                } catch (err) {
                    console.error('Error save clock in:', err);
                }
                if (mode === 'clock out') {
                    try {
                        const responseMsg = await deleteEntry('inProgress', preselectedVersion, 'Garrit', preselectedDir, preselectedTitle);
                        console.log(responseMsg);
                    } catch (err) {
                        console.error('Error deleting from inProgress:', err)
                    }
                }

            } else {

                try {
                    const responseMsg = await saveObject('customInfo', convertedOutput, convertLocalStringsToUTC(endDateTime), 'Garrit', outputDirectory, outputTitle);
                    console.log(responseMsg);
                } catch (err) {
                    console.error('Error fetching dirs and files:', err);
                }

                if (mode === 'clock out') {
                    try {
                        const responseMsg = await deleteEntry('inProgress', preselectedVersion, 'Garrit', preselectedDir, preselectedTitle);
                        console.log(responseMsg);
                    } catch (err) {
                        console.error('Error deleting from inProgress:', err)
                    }
                } else if (mode === 'record' && preselectedVersion) {
                    try {
                        const responseMsg = await deleteEntry('quickNote', preselectedVersion, 'Garrit', preselectedDir, preselectedTitle);
                        console.log(responseMsg);
                    } catch (err) {
                        console.error('Error deleting from quickNote:', err)
                    }
                }
                try {
                    const responseMsg = await recordDateTime('timeRecords', convertLocalStringsToUTC(endDateTime), 'Garrit', 'lastTime', 'customInfo');
                    console.log(responseMsg);
                } catch (err) {
                    console.error('Error recording end time:', err);
                }
            }
        }
        if (mode === 'resolve') {
            selectFn('schedule view');
        } else {
            selectFn('main');
        }
    };

    //* Handles deleting duplicate entry if required */
    const removeLastEntry = async () => {
        try {
            const responseMsg = await deleteEntry('customInfo', selectedVersion, 'Garrit', selectedDir, selectedTitle);
            console.log(responseMsg);
        } catch (err) {
            console.error('Error deleting from inProgress:', err)
        }
    }

    //* Following 5 functions are for creating useful input features */
    const entryBox = (option,i) => {
        return (
            <div key={i} style={{ display: 'flex' }}>
                <p>{option.text}</p>
                <input
                    value={output[i].outVal}
                    onChange={(e) => uponCustomInputChange(e.target.value, i)}
                    />
            </div>
        );
    }

    const expandableEntryBox = (option, i) => {
        return (
            <div key={i} style={{ display: 'flex' }}>
                <p>{option.text}</p>
                {output[i].outVal.map((outVal,j) => (
                    <div key={i+'-'+j}>
                        <input
                            key={j}
                            value={outVal}
                            list={option.text+'List'}
                            onChange={(e) => uponCustomInputChange(e.target.value, i, j)}
                            />
                        <button onClick={() => removeElements(output[i].group,i,j)}>-</button>
                        { dropdowns[option.text] &&
                            <datalist id={option.text + 'List'}>
                                {dropdowns[option.text].map((choice, index) =>
                                    <option key={index} value={choice} />
                                )}
                            </datalist>
                        }
                    </div>
                ))}
                <button onClick={() => addElements(output[i].group,i)}>+</button>
            </div>
        );
    }

    const addElements = (tag, index) => {
        const updatedOutput = output.map((element, elementIndex) => (
            ((tag === element.group && tag !== 'NA') || (index === elementIndex))
                ? { ...element, outVal: [ ...element.outVal, '' ] }
                : element
        ));
        setOutput(updatedOutput);
    }

    const removeElements = (tag, index, secondaryIndex) => {
        const updatedOutput = output.map((element, elementIndex) => {
            if ((tag === element.group && tag !== 'NA') || (index === elementIndex)) {
                console.log(element.outVal);
                const outValCopy = element.outVal
                outValCopy.splice(secondaryIndex,1);
                console.log('spliced', outValCopy);
                return { ...element, outVal: outValCopy };
            } else {
                return element;
            }
        });
        setOutput(updatedOutput);
    }

    const largeEntryBox = (option, i) => {
        return (
            <div key={i} style={{ display: 'flex' }}>
                <p>{option.text}</p>
                <textarea
                    name="journal box"
                    value={output[i].outVal}
                    onChange={(e) => uponCustomInputChange(e.target.value, i)}
                    style={{ width: '400px', height: '100px' }}
                />
            </div>
        );
    }

    return (
        <div>
            <h4>Custom Input</h4>
            { mode === 'record' &&
                <button 
                    onClick={() => {
                        setVersionType(versionType === 'UI' ? 'Info' : 'UI');
                        uponInputChange('', setDirectory);
                        uponInputChange('', setTitle);
                        uponInputChange('', setOutputDirectory);
                        uponInputChange('', setOutputTitle);
                    }}
                    style={{ color: versionType === 'UI' ? 'black' : 'gray' }}
                    >
                    Import Info
                </button>
            }
            {(mode === 'clock in' || mode === 'record' || mode === 'resolve' || mode === 'resolveMain') &&
                <div style={{ display: 'flex' }}>
                    <p>Input Directory:</p>
                    <input
                        value={directory}
                        list='prevNames'
                        onChange={(e) => {
                            uponInputChange(e.target.value, setDirectory);
                            uponInputChange(e.target.value, setOutputDirectory);
                        }}
                    />
                    <datalist id='prevNames'>
                        {Array.from(new Set(existingFiles.map((option) => option.directory))).map((option, index) => (
                            <option key={index} value={option} />
                        ))}
                    </datalist>
                    <p>Title:</p>
                    <input
                        value={title}
                        list='titles'
                        onChange={(e) => {
                            uponInputChange(e.target.value, setTitle);
                            uponInputChange(e.target.value, setOutputTitle);
                        }}
                    />
                    <datalist id='titles'>
                        {existingFiles.filter((obj, index, self) =>
                            index === self.findIndex((o) => o.directory === obj.directory && o.title === obj.title)
                        ).map((option, index) => (
                            option.directory === directory && <option key={index} value={option.title} />
                        ))}
                    </datalist>
                    <p>Version:</p>
                    <select
                        value={JSON.stringify(version)}
                        onChange={(e) => setVersion(JSON.parse(e.target.value))}
                        >
                        {existingFiles.map((option, index) => (
                            option.directory === directory && option.title == title
                            && <option key={index} value={JSON.stringify(option.dateTime)}>
                                {convertUTCstringsToLocal(option.dateTime).date + '-' + convertUTCstringsToLocal(option.dateTime).time}
                            </option>
                        ))}
                    </select>
                    <button onClick={() => callFetchObject()}>fetch UI</button>
                    <button onClick={() => callCreateNewUI()}>Create New UI</button>
                </div>
            }
            <div style={{ display: 'flex' }}>
                <p>Output Directory:</p>
                <input
                    value={outputDirectory}
                    onChange={(e) => uponInputChange(e.target.value, setOutputDirectory)}
                    />
                <p>Title:</p>
                <input
                    value={outputTitle}
                    onChange={(e) => uponInputChange(e.target.value, setOutputTitle)}
                    />
                {(mode === 'edit' || mode === 'clock out') &&
                    <div>
                        <p>Version:</p>
                        <select
                            value={JSON.stringify(version)}
                            onChange={(e) => setVersion(JSON.parse(e.target.value))}
                            >
                            {existingFiles.map((option, index) => (
                                option.directory === directory && option.title == title
                                && <option key={index} value={JSON.stringify(option.dateTime)}>
                                    {convertUTCstringsToLocal(option.dateTime).date + '-' + convertUTCstringsToLocal(option.dateTime).time}
                                </option>
                            ))}
                        </select>
                        <button onClick={() => callFetchObject()}>fetch Info</button>
                    </div>
                }
            </div>
            <div>
                <button 
                    onClick={() => setOutput(output.map((element) => (element.group !== 'start' ? { ...element, outVal: [''] } : element)))}
                    >
                    Clear Info
                </button>
                {output.length !== 0 &&
                    output.map((element, index) => {
                        switch (element.type) {
                            case 'soloButton':
                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleSoloButton(index)}
                                        style={{ color: output[index].outVal[0] === 'disabled' ? 'gray' : 'black' }}
                                        >
                                        {element.text}
                                    </button>
                                );
                            case 'entry':
                            case 'earning':
                            case 'spending':
                                return expandableEntryBox(element, index);
                            case 'text box':
                                return largeEntryBox(element, index);
                            case 'subtitle':
                                return (<div style={{ display: 'flex' }}>
                                            <p>{element.text}</p>
                                            <input 
                                                list="subtitles"
                                                value={outputTitle}
                                                onChange={(e) => setOutputTitle(e.target.value)}
                                                />
                                        </div>);
                            case 'startTime':
                            case 'startDate':
                                return entryBox(element, index);
                            default:
                                return null;
                        }
                })}
                {subtitleList &&
                    <datalist id='subtitles'>
                        {subtitleList.map((subtitle, index) => (
                            <option key={index} value={subtitle} />
                        ))}
                    </datalist>
                }
                {mode !== 'clock in' &&
                    <div>
                        <div style={{ display: 'flex' }}>
                            <p>End Date:</p>
                            <input
                                value={endDateTime.date}
                                onChange={(e) => setEndDateTime({ ...endDateTime, date: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'flex' }}>
                            <p>End Time:</p>
                            <input
                                value={endDateTime.time}
                                onChange={(e) => setEndDateTime({ ...endDateTime, time:e.target.value })}
                            />
                        </div>
                    </div>
                }
            </div>
            {saveFailed && 
                <div style={{ display: 'flex' }}>
                    <p>{saveFailed}</p>
                    <button 
                        style={{ color: override ? 'gray' : 'black' }}
                        onClick={() => override ? setOverride(false) : setOverride(true)}
                        >
                        Override
                    </button>
                </div>
            }
            <div style={{ display: 'flex' }}>
                { (mode !== 'edit' || convertLocalStringsToUTC(endDateTime).time !== preselectedVersion.time) &&
                    <button onClick={() => closeCustomInput(true,true)}>Submit</button>
                }
                { mode === 'clock out' &&
                    <button onClick={() => closeCustomInput(true,false)}>Submit without Clocking Out</button>
                }
                { mode === 'edit' &&
                    <button onClick={async () => {
                        await removeLastEntry();
                        closeCustomInput(true,true);
                        }}
                        >
                    Submit and Remove {preselectedDir}/{preselectedTitle} v
                    {convertUTCstringsToLocal(preselectedVersion).date}-{convertUTCstringsToLocal(preselectedVersion).time}
                    </button>
                }
                { versionType === 'Info' &&
                    <button onClick={async () => {
                        await removeLastEntry();
                        closeCustomInput(true, true);
                        }}
                        >
                        Submit and Remove {directory}/{title} v
                        {convertUTCstringsToLocal(version).date}-{convertUTCstringsToLocal(version).time}
                    </button>
                }
            <button onClick={() => closeCustomInput(false,true)}>Cancel</button>
            </div>
        </div>
    );
}

/** interface for creating a user interface for custom info - Skipped documentation here too 
 * as the simple functions are the most important for future use and I think they're relatively self explanatory
*/
export const CustomUI = ({ printLevel, selectFn, preselectedDir, preselectedTitle, preselectedVersion, selectDirTitleAndVersion, mode }) => {

    // Set as empty if no preselectedDir input
    const selectedDir = preselectedDir || '';
    const selectedTitle = preselectedTitle || '';
    const selectedVersion = preselectedVersion || '';

    // Used for knowing what index the object to move is in
    const [editIndex, setEditIndex] = useState(null);
    // Used for knowing whaat index to move the object to
    const [toMoveIndex, setToMoveIndex] = useState(null);
    // Used to tie elements together
    const [groupIndex, setGroupIndex] = useState(null);
    // Used to hold current group name
    const [groupNum, setGroupNum] = useState(0);
    // The "directory of the UI to be imported
    const [directory, setDirectory] = useState(selectedDir);
    // The title of the UI to be imported
    const [title, setTitle] = useState(selectedTitle);
    // The dateTime of the UI to be imported
    const [version, setVersion] = useState(selectedVersion);
    // The array of objects making up the array
    const [customUI, setCustomUI] = useState([]);
    // Has directory, title, and dateTime objects
    const [existingFiles, setExistingFiles] = useState([]);
    // Holds the text in the "text:" box to be used for new objects
    const [newElementInput, setNewElementInput] = useState('');
    // If disabled, adds a start date/time object (end date/time always included)
    const [repeatType, setRepeatType] = useState(null);
    const [repeatInfoElement, setRepeatInfoElement] = useState(null);
    const [repeatInfo, setRepeatInfo] = useState([]);
    const [noteInfo, setNoteInfo] = useState({ event: '', note: '', dueDate: getDateString(true), urgency: ''});
    const [textChoices, setTextChoices] = useState([]);
    const [dropdownDateTime, setDropDownDateTime] = useState(null);
    const [subtitleList, setSubtitleList] = useState(null);

    useEffect(() => {
        callFetchFiles();
        console.log('CustomUI mode:',mode);
    }, [])

    useEffect(() => {

    }, [customUI,editIndex,groupIndex]);

    useEffect(() => {
        if (existingFiles.map(i => i.directory).includes(directory) && existingFiles.map(i => i.title).includes(title)) {
            const mostRecent = chooseMostRecent(existingFiles, directory, title);
            setVersion(mostRecent);
        }
    }, [directory, title]);

    useEffect(() => {
        const isStart = repeatInfo.some((element) => (element.startTime !== 'NA'));
        isStart && includeStart();
        const isSubtitle = repeatInfo.some((element) => (element.subtitle !== 'NA'));
        isSubtitle && includeSubtitle();
    },[repeatInfo]);

    const uponInputChange = (inputValue, setInputValue) => {
        setInputValue(inputValue);
    }

    const uponCustomTextChange = (inputValue, index) => {
        setCustomUI(customUI.map((element, i) => (i === index ? { ...element, text: inputValue } : element)));
    }

    const addButton = (text) => {
        setCustomUI([...customUI, { 'type': 'soloButton', 'text': text, group: 'NA' }]);
    }

    const addEntry = (text) => {
        setCustomUI([...customUI, { 'type': 'entry', 'text': text, group: 'NA' }]);
    }

    const addTextBox = (text) => {
        setCustomUI([...customUI, { 'type': 'text box', 'text': text, group: 'NA' }]);
    }

    const removeButton = (index) => {
        return (<button onClick={() => handleElementRemoval(index)}>-</button>);
    }

    const commitButton = () => {
        return (<button onClick={() => setEditIndex(null)}>Commit</button>)
    }

    const editButton = (index) => {
        return (<button onClick={() => handleEditClick(index)}>Edit</button>);
    }

    const moveButton = (index) => {
        return (<button onClick={() => (toMoveIndex !== null ? setToMoveIndex(null) : setToMoveIndex(index))}>Move</button>);
    }

    const moveToButton = (index) => {
        return (<button onClick={() => handleMove(index)}>Move to</button>);
    }

    const groupButton = (index) => {
        return (<button onClick={() => handleGroupClick(index, groupNum)}>Group</button>);
    }

    const endGroupButton = () => {
        return (<button onClick={() => handleEndGroup()}>Commit</button>);
    }

    const EditText = (index) => {
        return (<input
            value={customUI[index].text}
            onChange={(e) => uponCustomTextChange(e.target.value, index)}
        />
        );
    }

    const handleGroupClick = (index, num) => {
        console.log('grouping', customUI[index].text)
        setGroupIndex(index);
        let updatedUI = customUI;
        updatedUI[index].group = num;
        console.log(updatedUI[index]);
        setCustomUI(updatedUI);
    }

    const handleEndGroup = () => {
        setGroupIndex(null);
        setGroupNum(prev => prev + 1);
    }

    const handleEditClick = (index) => {
        console.log('editing', customUI[index].text)
        setEditIndex(index);
    }

    const handleElementRemoval = (index) => {
        console.log('removing', customUI[index].text, "'s group");
        setCustomUI(prevUI => prevUI.filter((element, i) => 
            (element.group !== customUI[index].group || (element.group === 'NA' && index !== i))));
    }

    const handleMove = (index) => {
        const elementToMove = customUI.splice(toMoveIndex, 1)[0]; // Remove element at index 1 (2) and store it
        customUI.splice(index, 0, elementToMove);
        setToMoveIndex(index);
        setCustomUI([...customUI]);
    }

    const updateRepeatType = (rpType) => {
        setRepeatType(rpType);
        if (rpType === 'specifiedDates') {
            setRepeatInfoElement({
                subtitle: 'NA', remind: false,
                repeat: rpType, UTC: 'none', startDate: getDateString(true),
                endDate: getDateString(true), startTime: '09:00', endTime: '13:46',
                startCutoff: getDateString(true), endCutoff: 'NA',
            });
        } else if (rpType === 'specifiedSplit') {
            setRepeatInfoElement({ 
                subtitle: 'NA', remind: false,
                repeat: rpType, UTC: 'none',
                startDate: getDateString(true), endDate: getDateString(true),
                interval: '10', startTime: '09:00', endTime: '13:46',
                startCutoff: getDateString(true), endCutoff: 'NA',
            });
        } else if (rpType === 'weekly') {
            setRepeatInfoElement({ 
                subtitle: 'NA', remind: false,
                repeat: rpType, UTC: 'none',
                startDate: '3', endDate: '4', 
                startTime: '09:00', endTime: '13:46',
                startCutoff: getDateString(true), endCutoff: 'NA',
            });
        } else if (rpType === 'monthly') {
            setRepeatInfoElement({ 
                subtitle: 'NA', remind: false,
                repeat: rpType, UTC: 'none', 
                startDate: '20', endDate: '23', 
                startTime: '09:00', endTime: '13:46',
                startCutoff: getDateString(true), endCutoff: 'NA',
            });
        } else if (rpType === 'yearly') {
            setRepeatInfoElement({ 
                subtitle: 'NA', remind: false,
                repeat: rpType, UTC: 'none',
                startDate: getDateString(true).split('/').slice(0, -1).join('/'),
                endDate: getDateString(true).split('/').slice(0, -1).join('/'),
                startTime: '09:00', endTime: '13:46',
                startCutoff: getDateString(true), endCutoff: 'NA',
            });
        }
    }

    const callFetchFiles = async () => {
        try {
            const data = await fetchFiles('scheduledEvents', 'Garrit');
            setExistingFiles(data);
            if (data.map(i => i.directory).includes(directory) && data.map(i => i.title).includes(title)) {
                const mostRecent = chooseMostRecent(data, directory, title);
                setVersion(mostRecent);
            }
        } catch (err) {
            console.error('Error fetching existing names:', err);
        }
        try {
            const files = await fetchFiles('miscDropdowns','Garrit');
            const file = files.find((file) => file.directory === 'CustomUI' && file.title === 'textDropdown');
            const dropdown = await fetchObject('miscDropdowns',file.dateTime,'Garrit',file.directory,file.title);
            setTextChoices(dropdown);
            setDropDownDateTime(file.dateTime);
        } catch(err) {
            console.log('Error fetching text dropdown:',err);
        }
    }

    const callFetchObject = async () => {
        try {
            const UIinput = await fetchObject('customUI',
                version, 'Garrit', directory, title);
            if (UIinput.find((element) => element.type === 'subtitle')) {
                try {
                    const infoFiles = await fetchFiles('customInfo','Garrit');
                    setSubtitleList(Array.from(new Set(infoFiles.map((file) => {
                        if (file.directory === directory+'/'+title) {
                            console.log(file.title);
                            return file.title;
                        } else {
                            return null;
                        }
                    }))).filter((element) => (element)));
                } catch(err) {

                }
            } else {
                setSubtitleList(null);
            }
            setCustomUI(UIinput);
        } catch (err) {
            console.error('Error fetching UI:', err);
        }
    }

    const includeSubtitle = () => {
        const hasSubtitle = customUI.some(item => item.group === 'subtitle');
        if (!hasSubtitle) {
            setCustomUI([
                { text: 'Subtitle', type: 'subtitle', group: 'subtitle' },
                ...customUI
            ]);
        }
    }
    
    const includeEarning = () => {
        const hasEarning = customUI.some(item => item.group === 'earning');
        if (!hasEarning) {
            setCustomUI([
                ...customUI,
                { text: 'Category', type: 'entry', group: 'earning' },
                { text: 'Item', type: 'entry', group: 'earning' },
                { text: 'Earning ($)', type: 'entry', group: 'earning' },
            ]);
        }
    }
    
    const includeSpending = () => {
        const hasSpending = customUI.some(item => item.group === 'spending');
        if (!hasSpending) {
            setCustomUI([
                ...customUI,
                { text: 'Category', type: 'entry', group: 'spending' },
                { text: 'Item', type: 'entry', group: 'spending' },
                { text: 'Spending ($)', type: 'entry', group: 'spending' },
            ]);
        }
    }

    const includeStart = () => {
        const hasStartDateOrTime = customUI.some(item =>
            item.type === 'startDate' || item.group === 'start'
        );
        if (!hasStartDateOrTime) {
            setCustomUI([ 
                ...customUI,
                { type: 'startDate', text: 'Start Date', group: 'start' },
                { type: 'startTime', text: 'Start Time', group: 'start' }
            ]);
        }
    }

    const closeCustomUI = async (save, saveUI) => {
        if (save) {
            let updatedUI = customUI;
            if (mode === 'note') {
                try {
                    const dateTime = { date: getDateString(), time: getTimeString() };
                    const response = await saveObject('quickNote',
                        noteInfo, dateTime, 'Garrit', directory ? directory : 'Misc', title ? title : 'Misc');
                    console.log(response);
                } catch(err) {
                    console.log('Error saving quick note:',err);
                }
            }
            if (mode === 'schedule') {
                const scheduleInfo = repeatInfo.map((info) => {
                    if (info.repeat === 'specifiedDates' || info.repeat === 'specifiedSplit') {
                        if (info.UTC) {
                            return {
                                ...info,
                                startDate: convertLocalStringsToUTC({ date: info.startDate, time: info.startTime }).date,
                                startTime: convertLocalStringsToUTC({ date: info.startDate, time: info.startTime }).time,
                                endDate: convertLocalStringsToUTC({ date: info.endDate, time: info.endTime }).date,
                                endTime: convertLocalStringsToUTC({ date: info.endDate, time: info.endTime }).time,
                            };
                        } else {
                            return {
                                ...info,
                                startDate: info.startDate,
                                startTime: info.startTime,
                                endDate: info.endDate,
                                endTime: info.endTime,
                            };
                        }
                    } else if (info.repeat === 'weekly') {
                        const currentDate = new Date();
                        let weekOfDates = [];
                        let weekDays = [];
                        for (let i = 0; i < 15; i++) {
                            const nextDate = new Date(formatDateToObject(currentDate).date + ' ' + '00:00');
                            nextDate.setDate(currentDate.getDate() + i);
                            weekOfDates.push(nextDate);
                            weekDays.push(nextDate.getDay());
                        }
                        const startDateObj = weekOfDates.find((element, index) => (weekDays[index] === parseInt(info.startDate)));
                        let endDateObj;
                        // In case I decide to do something for an entire week, but not specifically schedule (doubt it) the endDate must not be the same as start
                        if ((parseInt(info.endTime.split(':')[0]) > parseInt(info.startTime.split(':')[0]))
                            || (info.endTime.split(':')[0] === info.startTime.split(':')[0] && parseInt(info.endTime.split(':')[1]) > parseInt(info.startTime.split(':')[1]))) {
                            endDateObj = weekOfDates.find((element, index) => (weekDays[index] === parseInt(info.endDate) && element >= startDateObj));
                        } else {
                            endDateObj = weekOfDates.find((element, index) => (weekDays[index] === parseInt(info.endDate) && element >= startDateObj));
                        }
                        if (info.UTC) {
                            return {
                                ...info,
                                startDate: convertLocalStringsToUTC({ date: formatDateToObject(startDateObj).date, time: info.startTime }).date,
                                startTime: convertLocalStringsToUTC({ date: formatDateToObject(startDateObj).date, time: info.startTime }).time,
                                endDate: convertLocalStringsToUTC({ date: formatDateToObject(endDateObj).date, time: info.endTime }).date,
                                endTime: convertLocalStringsToUTC({ date: formatDateToObject(endDateObj).date, time: info.endTime }).time,
                            };
                        } else {
                            return {
                                ...info,
                                startDate: formatDateToObject(startDateObj).date,
                                startTime: info.startTime,
                                endDate: formatDateToObject(endDateObj).date,
                                endTime: info.endTime,
                            };
                        }
                    } else if (info.repeat === 'monthly') {
                        const currentDate = new Date();
                        //Using july here so if a month must be added the days won't get fucky (jul & aug have 31 days)
                        const startDate = new Date(
                            currentDate.getFullYear(), 6, parseInt(info.startDate),
                            parseInt(info.startTime.split(':')[0]), parseInt(info.startTime.split(':')[1]));
                        const endDate = new Date(
                            currentDate.getFullYear(), 6, parseInt(info.endDate),
                            parseInt(info.endTime.split(':')[0]), parseInt(info.endTime.split(':')[1]));

                        if (startDate > endDate) {
                            endDate.setMonth(endDate.getMonth() + 1);
                        }

                        if (info.UTC) {
                            return {
                                ...info,
                                startDate: convertLocalStringsToUTC({ date: formatDateToObject(startDate).date, time: formatDateToObject(startDate).time }).date,
                                startTime: convertLocalStringsToUTC({ date: formatDateToObject(startDate).date, time: formatDateToObject(startDate).time }).time,
                                endDate: convertLocalStringsToUTC({ date: formatDateToObject(endDate).date, time: formatDateToObject(endDate).time }).date,
                                endTime: convertLocalStringsToUTC({ date: formatDateToObject(endDate).date, time: formatDateToObject(endDate).time }).time,
                            };
                        } else {
                            return {
                                ...info,
                                startDate: formatDateToObject(startDate).date,
                                startTime: formatDateToObject(startDate).time,
                                endDate: formatDateToObject(endDate).date,
                                endTime: formatDateToObject(endDate).time,
                            };
                        }
                    } else if (info.repeat === 'yearly') {
                        const currentDate = new Date();
                        const startDate = new Date(
                            '2024',
                            parseInt(info.startDate.split('/')[0]) - 1, parseInt(info.startDate.split('/')[1]),
                            parseInt(info.startTime.split(':')[0]), parseInt(info.startTime.split(':')[1]
                            ));
                        let endDate = new Date(
                            '2024',
                            parseInt(info.endDate.split('/')[0]) - 1, parseInt(info.endDate.split('/')[1]),
                            parseInt(info.endTime.split(':')[0]), parseInt(info.endTime.split(':')[1]
                            ));
                        if (startDate > endDate) {
                            endDate.setFullYear(endDate.getFullYear() + 1);
                        }
                        console.log(endDate);
                        if (info.UTC) {
                            return {
                                ...info,
                                startDate: convertLocalStringsToUTC({ date: formatDateToObject(startDate).date, time: formatDateToObject(startDate).time }).date,
                                startTime: convertLocalStringsToUTC({ date: formatDateToObject(startDate).date, time: formatDateToObject(startDate).time }).time,
                                endDate: convertLocalStringsToUTC({ date: formatDateToObject(endDate).date, time: formatDateToObject(endDate).time }).date,
                                endTime: convertLocalStringsToUTC({ date: formatDateToObject(endDate).date, time: formatDateToObject(endDate).time }).time,
                            };
                        } else {
                            return {
                                ...info,
                                startDate: formatDateToObject(startDate).date,
                                startTime: formatDateToObject(startDate).time,
                                endDate: formatDateToObject(endDate).date,
                                endTime: formatDateToObject(endDate).time,
                            };
                        }
                    }})
                    try {
                        const response = await saveObject('scheduledEvents', scheduleInfo, 
                            { date: getDateString(), time: getTimeString() }, 'Garrit', directory, title);
                        console.log(response);
                    } catch (err) {
                        console.error('Error saving customUI:', err);
                    }
            }
            if (saveUI) {
                try {
                    const dateTime = { date: getDateString(), time: getTimeString() }
                    const response = await deleteEntry('customUI', dateTime, 'Garrit', directory, title);
                    console.log(response);
                } catch (err) {
                    console.error('Error saving customUI:', err);
                }
                try {
                    const dateTime = { date: getDateString(), time: getTimeString() }
                    const response = await saveObject('customUI',
                        updatedUI, dateTime, 'Garrit', directory, title);
                    console.log(response);
                } catch (err) {
                    console.error('Error saving customUI:', err);
                }
                try {
                    const dropdownCopy = textChoices;
                    await Promise.all(updatedUI.map((element) => {dropdownCopy.push(element.text); console.log('dd',element.text)}));
                    const newDropdown = Array.from(new Set(dropdownCopy));
                    const response = await saveObject('miscDropdowns',
                        newDropdown,dropdownDateTime,'Garrit','CustomUI','textDropdown');
                    console.log(response)
                } catch(err) {
                    console.error('Error updating dropdowns:',err);
                }
            }
        }

        selectDirTitleAndVersion(directory, title);
        if (mode === 'record') {
            selectFn('customInfo');
        } else if (mode === 'clock in') {
            selectFn('customClockIn');
        } else if (mode === 'clock out') {
            selectFn('customClockOut');
        } else if (mode === 'schedule') {
            selectFn('schedule view');
        } else if (mode === 'note' || mode === 'goals') {
            selectFn('main');
        }
    }

    return (
        <div>
            <h4>Custom UI Design</h4>
            <div style={{ display: 'flex' }}>
                <p>Directory:</p>
                <input
                    name='fuckAutofilling'
                    value={directory}
                    list='prevNames'
                    onChange={(e) => uponInputChange(e.target.value, setDirectory)}
                />
                <datalist id="prevNames">
                    {Array.from(new Set(existingFiles.map(option => option.directory))).map((option, index) => (
                        <option key={index} value={option} />
                    ))}
                </datalist>
                <p>Title:</p>
                <input
                    value={title}
                    list='titles'
                    onChange={(e) => uponInputChange(e.target.value, setTitle)}
                />
                <datalist id="titles">
                    {existingFiles.filter((obj, index, self) =>
                        index === self.findIndex((o) => o.directory === obj.directory && o.title === obj.title)
                        ).map((option, index) => (
                            option.directory === directory
                            && <option key={index} value={option.title} />
                    ))}
                </datalist>
                <p>Version:</p>
                <select
                    value={JSON.stringify(version)}
                    onChange={(e) => setVersion(JSON.parse(e.target.value))}
                    >
                    {existingFiles.map((option, index) => (
                        option.directory === directory && option.title == title
                        && <option key={index} value={JSON.stringify(option.dateTime)}>
                            {convertUTCstringsToLocal(option.dateTime).date + '-' + convertUTCstringsToLocal(option.dateTime).time}
                        </option>
                    ))}
                </select>
                <button onClick={() => callFetchObject()}>fetch UI</button>
            </div>
            <div style={{ display: 'flex' }}>
                <p>text:</p>
                <input
                    value={newElementInput}
                    list='textOptions'
                    onChange={(e) => uponInputChange(e.target.value, setNewElementInput)}
                />
                <button onClick={() => addButton(newElementInput)}>
                    Add Button
                </button>
                <button onClick={() => addEntry(newElementInput)}>
                    Add Entry
                </button>
                <button onClick={() => addTextBox(newElementInput)}>
                    Add Text Box
                </button>
                <datalist id="textOptions">
                    {textChoices.map((choice, index) => (
                        <option key={index} value={choice}/>
                    ))}
                </datalist>
            </div>
            <div>
                <button
                    onClick={() => includeStart()}
                    style={{ color: customUI.some((element) => element.group === 'start') ? 'gray' : 'black' }}
                    >
                    Add Start Time
                </button>
                <button
                    onClick={() => includeSubtitle()}
                    style={{ color: customUI.some((element) => element.group === 'subtitle') ? 'gray' : 'black' }}
                    >
                    Add Subtitle
                </button>
                <button
                    onClick={() => includeSpending()}
                    style={{ color: customUI.some((element) => element.group === 'spending') ? 'gray' : 'black' }}
                    >
                    Add Spending
                </button>
                <button
                    onClick={() => includeEarning()}
                    style={{ color: customUI.some((element) => element.group === 'earning') ? 'gray' : 'black' }}
                    >
                    Add Earning
                </button>
            </div>
            {mode === 'schedule' &&
                <div>
                    <div style={{ display: 'flex' }}>
                        <p>Repeat type:</p>
                        <button
                            onClick={() => updateRepeatType('specifiedDates')}
                            style={{ color: repeatType !== 'specifiedDates' ? 'black' : 'grey' }}
                            >
                            Specified Dates
                        </button>
                        <button
                            onClick={() => updateRepeatType('specifiedSplit')}
                            style={{ color: repeatType !== 'specifiedSplit' ? 'black' : 'grey' }}
                            >
                            Every x days
                        </button>
                        <button
                            onClick={() => updateRepeatType('weekly')}
                            style={{ color: repeatType !== 'weekly' ? 'black' : 'grey' }}
                            >
                            Weekly
                        </button>
                        <button
                            onClick={() => updateRepeatType('monthly')}
                            style={{ color: repeatType !== 'monthly' ? 'black' : 'grey' }}
                            >
                            Monthly
                        </button>
                        <button
                            onClick={() => updateRepeatType('yearly')}
                            style={{ color: repeatType !== 'yearly' ? 'black' : 'grey' }}
                            >
                            Yearly
                        </button>
                    </div>
                </div>
            }
            { subtitleList &&
                <datalist id='subtitles'>
                    {subtitleList.map((subtitle, index) => (
                        <option key={index} value={subtitle} />
                    ))}
                </datalist>
            }
            {   repeatType === 'specifiedSplit' ? (
                    <div>
                        <div style={{ display: 'flex' }}>
                            <p> Subtitle: </p>
                            <input
                                list='subtitles'
                                value={repeatInfoElement.subtitle}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, subtitle: e.target.value }, setRepeatInfoElement)}
                            />
                        </div>
                        <div style={{ display: 'flex' }}>
                            <input
                                value={repeatInfoElement.startTime}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, startTime: e.target.value }, setRepeatInfoElement)}
                            />
                            <input
                                value={repeatInfoElement.endTime}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, endTime: e.target.value }, setRepeatInfoElement)}
                            />
                        </div>
                        <div style={{ display: 'flex' }}>
                            <input
                                value={repeatInfoElement.startDate}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, startDate: e.target.value }, setRepeatInfoElement)}
                                />
                            <input
                                value={repeatInfoElement.endDate}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, endDate: e.target.value }, setRepeatInfoElement)}
                                />
                            <p>Every</p>
                            <input
                                value={repeatInfoElement.interval}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, interval: e.target.value }, setRepeatInfoElement)}
                            />
                            <p>days</p>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <p>Effective</p>
                            <input
                                value={repeatInfoElement.startCutoff}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, startCutoff: e.target.value }, setRepeatInfoElement)}
                            />
                            <p> through </p>
                            <input
                                value={repeatInfoElement.endCutoff}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, endCutoff: e.target.value }, setRepeatInfoElement)}
                            />
                        </div>
                        <div style={{ display: 'flex' }}>
                            <p>Vary by Time Zone:</p>
                            <button
                                onClick={() => setRepeatInfoElement({ ...repeatInfoElement, UTC: true })}
                                style={{ color: (repeatInfoElement.UTC && repeatInfoElement.UTC !== 'none') ? 'gray' : 'black' }}
                                >
                                Yes
                            </button>
                            <button
                                onClick={() => setRepeatInfoElement({ ...repeatInfoElement, UTC: false })}
                                style={{ color: (!repeatInfoElement.UTC && repeatInfoElement.UTC !== 'none') ? 'gray' : 'black' }}
                                >
                                No
                            </button>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <p>Remind:</p>
                            <button
                                onClick={() => setRepeatInfoElement({ ...repeatInfoElement, remind: true })}
                                style={{ color: (repeatInfoElement.remind && repeatInfoElement.remind !== 'none') ? 'gray' : 'black' }}
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setRepeatInfoElement({ ...repeatInfoElement, remind: false })}
                                style={{ color: (!repeatInfoElement.remind && repeatInfoElement.remind !== 'none') ? 'gray' : 'black' }}
                            >
                                No
                            </button>
                        </div>
                        <button 
                            onClick={() => (repeatInfoElement.UTC !== 'none'
                                 ? setRepeatInfo([ ...repeatInfo, repeatInfoElement ]) : null)}
                            style={{ color: (repeatInfoElement.UTC !== 'none' ? 'black' : 'gray')}}
                            >
                           Set Repeating Schedule
                        </button>
                    </div>
                ) : repeatType && (
                    <div>
                        <div style={{ display: 'flex' }}>
                            <p> Subtitle: </p>
                            <input
                                list='subtitles'
                                value={repeatInfoElement.subtitle}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, subtitle: e.target.value }, setRepeatInfoElement)}
                            />
                        </div>
                        <div style={{ display: 'flex' }}>
                            <input
                                value={repeatInfoElement.startDate}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, startDate: e.target.value }, setRepeatInfoElement)}
                            />
                            <input
                                value={repeatInfoElement.endDate}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, endDate: e.target.value }, setRepeatInfoElement)}
                            />
                        </div>
                        <div style={{ display: 'flex' }}>
                            <input
                                value={repeatInfoElement.startTime}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, startTime: e.target.value }, setRepeatInfoElement)}
                            />
                            <input
                                value={repeatInfoElement.endTime}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, endTime: e.target.value }, setRepeatInfoElement)}
                            />
                        </div>
                        { repeatType !== 'specifiedDates' &&
                        <div style={{ display: 'flex' }}>
                            <p>Effective</p>
                            <input
                                value={repeatInfoElement.startCutoff}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, startCutoff: e.target.value }, setRepeatInfoElement)}
                            />
                            <p> through </p>
                            <input
                                value={repeatInfoElement.endCutoff}
                                onChange={(e) => uponInputChange({ ...repeatInfoElement, endCutoff: e.target.value }, setRepeatInfoElement)}
                            />
                        </div>}
                        <div style={{ display: 'flex' }}>
                            <p>Vary by Time Zone:</p>
                            <button
                                onClick={() => setRepeatInfoElement({ ...repeatInfoElement, UTC: true })}
                                style={{ color: (repeatInfoElement.UTC && repeatInfoElement.UTC !== 'none') ? 'gray' : 'black' }}
                                >
                                Yes
                            </button>
                            <button
                                onClick={() => setRepeatInfoElement({ ...repeatInfoElement, UTC: false })}
                                style={{ color: (!repeatInfoElement.UTC && repeatInfoElement.UTC !== 'none') ? 'gray' : 'black' }}
                                >
                                No
                            </button>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <p>Remind:</p>
                            <button
                                onClick={() => setRepeatInfoElement({ ...repeatInfoElement, remind: true })}
                                style={{ color: (repeatInfoElement.remind && repeatInfoElement.remind !== 'none') ? 'gray' : 'black' }}
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setRepeatInfoElement({ ...repeatInfoElement, remind: false })}
                                style={{ color: (!repeatInfoElement.remind && repeatInfoElement.remind !== 'none') ? 'gray' : 'black' }}
                            >
                                No
                            </button>
                        </div>
                        <div style={{ display: 'flex' }}>
                            <button
                                onClick={() => (repeatInfoElement.UTC !== 'none'
                                    ? setRepeatInfo([...repeatInfo, repeatInfoElement]) : null)}
                                style={{ color: (repeatInfoElement.UTC !== 'none' ? 'black' : 'gray') }}
                            >
                                Add Schedule Element
                            </button>
                        </div>
                    </div>
                )
            }
            { mode === 'schedule' &&
                <div style={{ display: 'flex' }}>
                    <p>Repeat Info: </p>
                    <ul style={{ 'listStyle': 'none', 'display': 'inline', paddingLeft: '2px', paddingRight: '2px' }}>
                        {repeatInfo.map((date, index) => (
                            <li
                                key={index}
                                style={{ display: 'inline', cursor: 'pointer' }}
                                onClick={() => {
                                    setRepeatInfo(repeatInfo.filter((e, infoIndex) => (index !== infoIndex)));
                                }}
                                >
                                {JSON.stringify(date)}
                            </li>
                        ))}
                    </ul>
                </div>
            }
            { mode === 'note' &&
                <div>
                    <div style={{ display: 'flex' }}>
                        <p>Note Title</p>
                        <input
                            value={noteInfo.event}
                            onChange={(e) => setNoteInfo({ ...noteInfo, event: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex' }}>
                        <p>Urgency (0-10)</p>
                        <input 
                            value={noteInfo.urgency}
                            onChange={(e) => setNoteInfo({ ...noteInfo, urgency: e.target.value})}
                            />
                    </div>
                    <div style={{ display: 'flex' }}>
                        <p>Due Date</p>
                        <input
                            value={noteInfo.dueDate}
                            onChange={(e) => setNoteInfo({ ...noteInfo, dueDate: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex' }}>
                        <p>Note</p>
                        <textarea
                            value={noteInfo.note}
                            onChange={(e) => setNoteInfo({ ...noteInfo, note: e.target.value })}
                            />
                    </div>
                </div>
            }
            <div>
                {customUI.length !== 0 && customUI.map((element, index) => {
                    switch (element.type) {
                        case 'soloButton':
                            return (
                                <div key={index}>
                                    <button>{element.text}</button>
                                    {editButton(index)}
                                    {removeButton(index)}
                                    {moveButton(index)}
                                    {editIndex === index &&
                                        <>
                                            {EditText(index)}
                                            {commitButton()}
                                        </>
                                    }
                                    {toMoveIndex !== null && moveToButton(index)}
                                    {groupButton(index)}
                                    {groupIndex !== null && endGroupButton(index)}
                                    <p onClick={() => handleGroupClick(index,'NA')}>{'Group: ' + element.group }</p>
                                </div>
                            );
                        case 'subtitle':
                        case 'entry':
                        case 'startTime':
                        case 'startDate':
                        case 'spending':
                        case 'earning':
                            return (
                                <div key={index} style={{ display: 'flex' }}>
                                    <p>{element.text}</p>
                                    <input></input>
                                    {editButton(index)}
                                    {removeButton(index)}
                                    {moveButton(index)}
                                    {editIndex === index &&
                                        <>
                                            {EditText(index)}
                                            {commitButton()}
                                        </>
                                    }
                                    {toMoveIndex !== null && moveToButton(index)}
                                    {groupButton(index)}
                                    {groupIndex !== null && endGroupButton(index)}
                                    <p onClick={() => handleGroupClick(index, 'NA')}>{'Group: ' + element.group}</p>
                                </div>
                            );
                        case 'text box':
                            return (
                                <div key={index} style={{ display: 'flex' }}>
                                    <p>{element.text}</p>
                                    <textarea
                                        style={{ width: '400px', height: '100px' }}
                                    />
                                    {editButton(index)}
                                    {removeButton(index)}
                                    {moveButton(index)}
                                    {editIndex === index &&
                                        <>
                                            {EditText(index)}
                                            {commitButton()}
                                        </>
                                    }
                                    {toMoveIndex !== null && moveToButton(index)}
                                    {groupButton(index)}
                                    {groupIndex !== null && endGroupButton(index)}
                                    <p onClick={() => handleGroupClick(index, 'NA')}>{'Group: ' + element.group}</p>
                                </div>
                            );
                    }
                })}
            </div>
            {mode === 'note' &&
                <button
                    onClick={() => closeCustomUI(true, false)}
                    >
                    Create Note without UI
                </button>
            }
            {mode === 'schedule' && 
                <button
                    onClick={() => closeCustomUI(true, false)}
                    >
                    Schedule without New UI
                </button>
            }
            <button
                onClick={() => closeCustomUI(true,true)}
                >
                Create UI
            </button>
            <button onClick={() => closeCustomUI(false,false)}>
                Return to Main
            </button>
        </div>
    );
}

//* This one is incredibly overcomplicated - I skipped documentation to save time as we will likely not use much from here */
export const ScheduleView = ({ printLevel, selectFn, selectResolutionInfo, selectDirTitleAndVersion, mode}) => {

    const today = new Date();
    const [startDateIn, setStartDateIn] = useState('');
    const [endDateIn, setEndDateIn] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [include, setInclude] = useState(false);
    const [specifiedDirectory, setSpecifiedDirectory] = useState('');
    const [specifiedDirectories, setSpecifiedDirectories] = useState([]);
    const [specifiedTitle, setSpecifiedTitle] = useState('');
    const [specifiedTitles, setSpecifiedTitles] = useState([]);
    const initImport = mode === 'mainMenu' ? true : false;
    const [importEvents, setImportEvents] = useState(initImport);
    const [timelineEvents, setTimelineEvents] = useState([]);
    const [scheduleEvents, setScheduleEvents] = useState([]);
    const [resolvedEvents, setResolvedEvents] = useState([]);
    const [colorGradientBasis, setColorGradientBasis] = useState([]);
    const [colorGradient, setColorGradient] = useState([]);
    const [expandedCell, setExpandedCell] = useState(null);
    const [selection, setSelection] = useState(null);
    const [selectionType, setSelectionType] = useState(null);
    const [dblCheckDelete, setDblCheckDelete] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        const todayMidnight = new Date (today);
        todayMidnight.setHours(0,0,0,0);
        setExpandedCell(todayMidnight);
        const startDateCopy = new Date(today);
        const endDateCopy = new Date(today);
        if (mode === 'calendar') {
            startDateCopy.setDate(today.getDate() - 2);
            endDateCopy.setDate(today.getDate() + 4);
        } else if (mode === 'mainMenu') {
            startDateCopy.setDate(today.getDate());
            endDateCopy.setDate(today.getDate() + 2);
        } else {
            console.log('schedule view mode is unknown');
        }
        setStartDateIn(formatDateToObject(startDateCopy).date);
        setEndDateIn(formatDateToObject(endDateCopy).date);
        fetchFromRange(formatDateToObject(startDateCopy).date, formatDateToObject(endDateCopy).date)
    }, []);

    useEffect(() => {
        setScrollPosition(0);
    }, [expandedCell]);
    
    const uponInputChange = (inputValue, setInputValue) => {
        setInputValue(inputValue);
    };

    const fetchEventsFromRange = async (start, end) => {
        console.log('importing events from', start, ' to ', end);
        console.time('infoTime');
        try {
            const files = await fetchFiles('customInfo', 'Garrit');
            //console.log('info files:', files);
            if(importEvents) {
                const filteredFiles = files.filter((file) => {
                    const elementDateObj = parseDateObject(convertUTCstringsToLocal({ date: file.dateTime.date, time: file.dateTime.time }));
                    if (include) {
                        return elementDateObj >= start && elementDateObj < end && 
                        (specifiedDirectories.includes(file.directory) || specifiedTitles.includes(file.title));
                    } else {
                        return elementDateObj >= start && elementDateObj < end && 
                        (!specifiedDirectories.includes(file.directory) && !specifiedTitles.includes(file.title))
                    }
                });
                const timelineInit = await callFetchObject('customInfo', 'Garrit', filteredFiles);
                setTimelineEvents(timelineInit);
                console.log('Imported Events:',timelineInit);
            } else {
                setTimelineEvents([]);
            }
            return files;
        } catch (err) {
            console.log('Error fetching info:', err);
            return [];
        } finally {
            console.timeEnd('infoTime');
        }
    }

    const fetchSchedulesFromRange = async(startUTC, endUTC) => {
        console.time('scheduleTime');
        let schedulesBuilt = [];
        try {
            // Import all {title, directory, dateTime} from table
            const scheduleFiles = await fetchFiles('scheduledEvents', 'Garrit');
            //console.log('schFiles',scheduleFiles);
            // Add userID attribute
            const schedulesAttributes = scheduleFiles.map((file) => {
                return { ...file, userID: 'Garrit' };
            });
            //console.log('schAtts',schedulesAttributes);
            // Add content to attributes
            const scheduleContent = await fetchObjects('scheduledEvents',schedulesAttributes);
            //console.log('schCont',scheduleContent);
            // Reduce to one dimension by adding adequate info to each element of content
            const scheduleObjects = scheduleContent.map((file) => {
                    return file.content.map((content) => {return { ...content, title: file.title, directory: file.directory, dateTime: file.dateTime }})
                }).reduce((accumulator, schedule) => accumulator.concat(schedule),[])
                .filter((object) => 
                    (include && (specifiedDirectories.includes(object.directory) || specifiedTitles.includes(object.title)))
                    || (!include && (!specifiedDirectories.includes(object.directory) && !specifiedTitles.includes(object.title))));
            //console.log('schObs',scheduleObjects);
            if (scheduleObjects.length > 0) {
                scheduleObjects.map((element, index) => {

                    const convertDateIfNeedBe = (dT) => {
                        if (!element.UTC) {
                            return parseDateObject(convertUTCstringsToLocal(formatDateToObject(dT)));
                        } else {
                            return dT;
                        }
                    }

                    const startCutoff = element.startCutoff === 'NA'
                        ?   'NA'
                        :   parseDateObject({ date: element.startCutoff, time: '00:00' });
                    const endCutoff = element.endCutoff === 'NA' 
                        ?   'NA'
                        :   parseDateObject({ date: element.endCutoff, time: '00:00' });
                    const elementStartObj = element.UTC
                        ?   parseDateObject(convertLocalStringsToUTC({ date: element.startDate, time: element.startTime }))
                        :   parseDateObject({ date: element.startDate, time: element.startTime });
                    const elementEndObj = element.UTC
                        ?   parseDateObject(convertLocalStringsToUTC({ date: element.endDate, time: element.endTime }))
                        :   parseDateObject({ date: element.endDate, time: element.endTime });
                    const startDateObj = convertDateIfNeedBe(startUTC);
                    const endDateObj = convertDateIfNeedBe(endUTC);
                    //console.log(index, elementStartObj, elementEndObj);
                    switch (element.repeat) {
                        case 'specifiedDates': {
                            if (parseDateObject({ date: element.startDate, time: element.startTime }) >= startDateObj ||
                                parseDateObject({ date: element.endDate, time: element.endTime}) <= endDateObj) {
                                schedulesBuilt.push({
                                    ...element,
                                    startDate: element.startDate,
                                    endDate: element.endDate,
                                    startTime: element.startTime,
                                    endTime: element.endTime,
                                });
                            }
                            break;
                        } case 'specifiedSplit':
                          case 'weekly': {
                            // Split (in days) between start/next start and end/next end
                            const interval = element.repeat === 'specifiedSplit'
                                ? parseInt(element.interval) : 7;

                            //console.log(parseDateObject({ date: element.endDate, time: element.endTime }));
                            //console.log(parseDateObject({ date: element.startDate, time: element.startTime }));

                            // if earlier date is first, returns negative
                            let dayDiff = differenceInDays(startDateObj,parseDateObject({ date: element.endDate, time: element.endTime }));
                            //console.log('dayDiff',dayDiff);
                            //console.log(parseDateObject({ date: element.endDate, time: element.endTime }), startDateObj,dayDiff);
                            while (dayDiff % interval !== 0) {
                                dayDiff++;
                            }

                            let startDateCopy = addDays(parseDateObject({ date: element.startDate, time: element.startTime }),dayDiff);
                            let endDateCopy = addDays(parseDateObject({ date: element.endDate, time: element.endTime }),dayDiff);

                            //console.log(element.subtitle);
                            //console.log('objs',startDateObj, endDateObj);
                            //console.log('cSD2', startDateCopy, endDateCopy);
                            while (startDateCopy <= endDateObj) {
                                //console.log('outer loop');
                                //console.log(element.UTC, currentStartDate, currentEndDate);
                                //console.log('inner loop');
                                // If not start date or end date I'd like to see 00:00-23:59, so converting that to UTC, so conversion later shows expected time
                                const scheduleElement = {
                                    ...element,
                                    startDate: formatDateToObject(startDateCopy).date,
                                    endDate: formatDateToObject(endDateCopy).date,
                                    startTime: element.startTime,
                                    endTime: element.endTime,
                                };
                                //console.log('sch',scheduleElement);
                                //console.log(element.subtitle,scheduleElement)
                                if ((startCutoff < parseDateObject({ date: scheduleElement.startDate, time: scheduleElement.startTime }) || startCutoff === 'NA') &&
                                    (endCutoff > parseDateObject({ date: scheduleElement.endDate, time: scheduleElement.endTime }) || endCutoff === 'NA')) {
                                    schedulesBuilt.push(scheduleElement);
                                }

                                startDateCopy = addDays(startDateCopy,interval);
                                endDateCopy = addDays(endDateCopy,interval);
                            }
                            break;
                        } case 'monthly': {

                            // if earlier date is first, returns negative
                            let monthDiff = differenceInMonths(startDateObj, parseDateObject({ date: element.endDate, time: element.endTime }));

                            let startDateCopy = addMonths(parseDateObject({ date: element.startDate, time: element.startTime }), monthDiff);
                            let endDateCopy = addMonths(parseDateObject({ date: element.endDate, time: element.endTime }), monthDiff);  

                            //console.log('cSD2', startDateCopy, endDateCopy);
                            let ctr = 0;
                            while (addMonths(startDateCopy,ctr) <= endDateObj) {
                                const scheduleElement = {
                                    ...element,
                                    startDate: formatDateToObject(addMonths(startDateCopy, ctr)).date,
                                    endDate: formatDateToObject(addMonths(endDateCopy, ctr)).date,
                                    startTime: element.startTime,
                                    endTime: element.endTime,
                                };
                                if ((startCutoff < parseDateObject({ date: scheduleElement.startDate, time: scheduleElement.startTime }) || startCutoff === 'NA') &&
                                    (endCutoff > parseDateObject({ date: scheduleElement.endDate, time: scheduleElement.endTime }) || endCutoff === 'NA')) {
                                    schedulesBuilt.push(scheduleElement);
                                }
                                ctr++;
                            }
                            break;
                        } case 'yearly': {
                            // if earlier date is first, returns negative
                            let yearDiff = differenceInYears(startDateObj, parseDateObject({ date: element.endDate, time: element.endTime }));

                            let startDateCopy = addYears(parseDateObject({ date: element.startDate, time: element.startTime }), yearDiff);
                            let endDateCopy = addYears(parseDateObject({ date: element.endDate, time: element.endTime }), yearDiff);

                            //console.log('cSD2', startDateCopy, endDateCopy);
                            let ctr = 0;
                            while (addYears(startDateCopy, ctr) <= endDateObj) {
                                const scheduleElement = {
                                    ...element,
                                    startDate: formatDateToObject(addYears(startDateCopy, ctr)).date,
                                    endDate: formatDateToObject(addYears(endDateCopy, ctr)).date,
                                    startTime: element.startTime,
                                    endTime: element.endTime,
                                };
                                if ((startCutoff < parseDateObject({ date: scheduleElement.startDate, time: scheduleElement.startTime }) || startCutoff === 'NA') &&
                                    (endCutoff > parseDateObject({ date: scheduleElement.endDate, time: scheduleElement.endTime }) || endCutoff === 'NA')) {
                                    schedulesBuilt.push(scheduleElement);
                                    console.log('yer',scheduleElement);
                                }
                                ctr++;
                            }
                            break;
                        }
                    }
                });
                console.log('schedules:',schedulesBuilt);
                setScheduleEvents(schedulesBuilt);
                return schedulesBuilt;
            } else {
                console.log('empty boi');
                setScheduleEvents([]);
                return [];
            }
        } catch (err) {
            console.error('Error fetching schedule:', err);
        } finally {
            console.timeEnd('scheduleTime');
        }
    }

    const fetchResolutionsFromRange = async(start, end, startUTC, endUTC) => {
        console.time('resolutionTime');
        try {
            const resolvedFiles = await fetchFiles('resolvedEvents', 'Garrit');
            const resolvedAttributes = resolvedFiles.map((file) => {
                return { ...file, userID: 'Garrit' };
            });
            const resolvedContent = await fetchObjects('resolvedEvents', resolvedAttributes);
            const resolvedObjects = resolvedContent.reduce((accumulator, resolution) => accumulator.concat(resolution), []);
            const resolvedInit = resolvedObjects.filter((file) => {
                const elementStartDateObj = parseDateObject(convertUTCstringsToLocal({ date: file.content.endDate, time: file.content.endTime }));
                const elementEndDateObj = parseDateObject(convertUTCstringsToLocal({ date: file.content.endDate, time: file.content.endTime }));
                if (file.UTC) {
                    return ((elementStartDateObj >= startUTC && elementStartDateObj < endUTC)
                        || (elementEndDateObj >= startUTC && elementEndDateObj < endUTC))
                        && (include && (specifiedDirectories.includes(file.directory) || specifiedTitles.includes(file.title))
                            || (!include && (!specifiedDirectories.includes(file.directory) && !specifiedTitles.includes(file.title)))
                        );
                } else {
                    return ((elementStartDateObj >= start && elementStartDateObj < end)
                        || (elementEndDateObj >= start && elementEndDateObj < end))
                        && (include && (specifiedDirectories.includes(file.directory) || specifiedTitles.includes(file.title))
                            || (!include && (!specifiedDirectories.includes(file.directory) && !specifiedTitles.includes(file.title)))
                        );
                }
            })
            console.log('resolutions imported for calendar',resolvedInit);
            setResolvedEvents(resolvedInit);
        } catch (err) {
            console.error('Error fetching resolutions:', err)
        } finally {
            console.timeEnd('resolutionImportTime');
        }
    }

    // Set relevantEvents to files with .MM-DD-YYYY.HH-mm within range
    const fetchFromRange = async (start, end) => {
        setStartDate({ date: start, time: '00:00'});
        setEndDate({ date: end, time: '00:00'});

        // Create dates with a one day buffer zone to account for a lack of time change when 
        // importing information (Allows me to keep data for years and not take ages to load) 
        const startDateUTC = parseDateObject(convertLocalStringsToUTC({ date: start, time: '00:00' }));
        startDateUTC.setDate(startDateUTC.getDate() - 1);
        const endDateUTC = parseDateObject(convertLocalStringsToUTC({ date: end, time: '00:00' }));
        endDateUTC.setDate(endDateUTC.getDate() + 1);

        const startDate = parseDateObject({ date: start, time: '00:00' });
        startDate.setDate(startDate.getDate() - 1);
        const endDate = parseDateObject({ date: end, time: '00:00' });
        endDate.setDate(endDate.getDate() + 1);

        await fetchResolutionsFromRange(startDate, endDate, startDateUTC, endDateUTC);

        const builtSchedules = await fetchSchedulesFromRange(startDateUTC, endDateUTC);

        const timelineInit = await fetchEventsFromRange(startDateUTC, endDateUTC);

        if (timelineInit && builtSchedules) {
            const cgBasis = Array.from(new Set([...timelineInit.map(element => element.directory),
                                                ...builtSchedules.map(element => element.directory)]));
            setColorGradientBasis(cgBasis);
            createColorGradient(cgBasis);
        } else if (timelineInit) {
            setColorGradientBasis(timelineInit);
            createColorGradient(timelineInit);
        } else if (builtSchedules) {
            setColorGradientBasis(builtSchedules);
            createColorGradient(builtSchedules);
        }
    }

    const callFetchObject = async (tableOut,userIDout,fileObjects) => {

        /*const events = await Promise.all(fileObjects.map(async (file) => {
            try {
                const UIin = await fetchObject(table,file.dateTime,'Garrit',file.directory,file.title);
                return {...file, UI: UIin};
            } catch(err) {
                console.error('Error fetching',file,'UI:',err);
                return null;
            }
        }));*/

        const attributes = fileObjects.map((file) => {return { ...file, userID: userIDout }});

        const events = await fetchObjects(tableOut, attributes);

        return events.map((event) => {
            const { content, ...restOfEvent } = event;
            return { ...restOfEvent, UI: content };
        });
    }

    const DisplayInfo = ({ info }) => {

        console.log(info);
        return (
            <div>
                {info.UI.map((element, i) => {
                    switch (element.type) {
                        case 'soloButton':
                            return (<button key={i} style={{ color: (element.outVal && element.outVal[0] === 'disabled') ? 'gray' : 'blacak' }}>{element.text}</button>);
                        case 'entry':
                        case 'earning':
                        case 'spending':
                        case 'subtitle':
                            return (
                                <div key={i} style={{ display: 'flex' }}>
                                    <p>{element.text}</p>
                                    {element.outVal
                                        ? element.outVal.map((outValue, j) => (
                                            <input
                                                value={outValue}
                                                key={i + ',' + j}
                                                readOnly
                                            />
                                        ))
                                        : <input
                                            value={''}
                                            key={i + ',0'}
                                            readOnly
                                        />
                                    }
                                </div>
                            );
                        case 'startDate':
                        case 'startTime':
                            return (
                                <div key={i} style={{ display: 'flex' }}>
                                    <p>{element.text}</p>
                                    <input
                                        value={element.outVal || ''}
                                        key={i + ',0'}
                                        readOnly
                                    />
                                </div>
                            );
                        case 'text box':
                            return (
                                <div key={i} style={{ display: 'flex' }}>
                                    <p>{element.text}</p>
                                    {element.outVal
                                        ? <textarea
                                            value={element.outVal}
                                            readOnly
                                        />
                                        : <textarea
                                            value={''}
                                            readOnly
                                        />
                                    }
                                </div>
                            );
                    }
                })}
            </div>
        );
    }

    const DisplayScheduled = ({ info }) => {
        const [objectFile, setObjectFile] = useState([]);
        const [mostRecent, setMostRecent] = useState(null);

        useEffect(() => {
            const fetchData = async () => {
                try {
                    const files = await fetchFiles('CustomUI', 'Garrit');
                    const recent = chooseMostRecent(files, info.directory, info.title);
                    setMostRecent(recent);
                    const object = await fetchObject('CustomUI', recent, 'Garrit', info.directory, info.title);
                    setObjectFile(object);
                } catch (err) {
                    console.error('Error Displaying selected schedule UI:', err);
                }
            };

            fetchData();
        }, [info]);

        return (
            <div>
                <button onClick={() => {
                    generateReminder(info);
                    handleScheduleResolution(false, info.directory,
                        info.title, mostRecent, info);
                    }}
                    >
                    Remind And Resolve
                </button>
                <button onClick={() => handleScheduleResolution(false, info.directory, 
                    info.title, mostRecent, info)}
                    >
                    Resolve
                </button>
                <button onClick={() => handleScheduleResolution(true, info.directory,
                    info.title, mostRecent, info)}
                    >
                    Resolve and Input Info
                </button>
                <button onClick={() => handleUnresolving(info)}
                    >
                    Unresolve
                </button>
                { mode === 'calendar' &&
                    <EditMiscObject selectFn={selectFn}
                    preselectedTable={'scheduledEvents'}
                    preselectedDir={info.directory}
                    preselectedTitle={info.title}
                    preselectedVersion={info.dateTime} />
                }
            </div>
        );
    };

    const DisplayResolved = ({ info }) => {
        return (
            <div>
                { mode === 'calendar' &&
                <EditMiscObject selectFn={selectFn}
                    preselectedTable={'resolvedEvents'}
                    preselectedDir={info.directory}
                    preselectedTitle={info.title}
                    preselectedVersion={info.dateTime} />
                }
            </div>
        );
    }

    const plotBar = (type) => {
        if (type === 'time') {
            const labels = Array.from(new Set(timelineEvents.map((event) => (event.title))));
            const data = labels.map((tag) => { return { label: tag, value: 0 } });
            timelineEvents.map((event) => {

                if (event.UI.find((element) => (element.group === 'start'))) {
                    const startTime = event.UI.find((element) => (element.type === 'startTime')).outVal;
                    const startDate = event.UI.find((element) => (element.type === 'startDate')).outVal;
                    const endTime = event.dateTime.time;
                    const endDate = event.dateTime.date;
                    data.find((element) => (element.label === event.title)).value = data.find((element) => (element.label === event.title)).value + 
                        (
                            parseDateObject({ date: endDate, time: endTime})-parseDateObject({ date: startDate, time: startTime })
                        )/(1000*60*60);
                }
            });
        } /*else if (type === 'finances') {
            const labels = Array.from(new Set(timelineEvents.map((event) => (event.title))));
            const data = labels.map((tag) => { return { label: tag, sublabel:, value: 0 } });
            timelineEvents.map((event) => {

                if (event.UI.find((element) => (element.group === 'earning'))) {

                } if (event.UI.find((element) => (element.group === 'spending'))) {

                }
            });
        }*/
    }

    const handleContentEditing = (functionToOpen, directory, file, version) => {
        console.log('editing ', functionToOpen, directory, file, version, ' content');
        selectDirTitleAndVersion(directory, file, version);
        selectFn(functionToOpen);
    };

    const handleEventDeleting = async (selection) => {
        console.log('deleting event', selection);
        setDblCheckDelete(false);
        try {
            const responseMsg = await deleteEntry('customInfo', selection.dateTime, 'Garrit', selection.directory, selection.title);
            console.log(responseMsg)
            setSelection(null);
            await fetchFromRange(startDateIn,endDateIn);
        } catch (err) {
            console.error('Error fetching directories and files:', err);
        }
    };

    const handleResolutionDeleting = async (selection) => {
        console.log('deleting resolution', selection);
        setDblCheckDelete(false);
        try {
            const responseMsg = await deleteEntry('resolvedEvents', selection.dateTime, 
                'Garrit', selection.directory, selection.title);
            console.log(responseMsg);
            setSelection(null);
            setResolvedEvents(resolvedEvents.filter((resolution) => (
                resolution.dateTime.date !== selection.dateTime.date ||
                resolution.dateTime.time !== selection.dateTime.time ||
                resolution.title !== selection.title ||
                resolution.directory !== selection.directory
            )));
        } catch (err) {
            console.error('Error fetching directories and files:', err);
        }
    };

    const handleUnresolving = async (selection) => {
        console.log('deleting resolution', selection);
        setDblCheckDelete(false);
        try {
            const responseMsg = await deleteEntry('resolvedEvents', { date: selection.endDate, time: selection.endTime },
                'Garrit', selection.directory, selection.title);
            console.log(responseMsg);
            setResolvedEvents(resolvedEvents.filter((resolution) => (
                resolution.dateTime.date !== selection.endDate ||
                resolution.dateTime.time !== selection.endTime ||
                resolution.title !== selection.title ||
                resolution.directory !== selection.directory
            )));
        } catch (err) {
            console.error('Error fetching directories and files:', err);
        }
    };

    const handleScheduleResolution = async (enterInfo, directory, title, version, info) => {

        const resolutionInfo = { UTC: info.UTC, subtitle: info.subtitle, title: info.title, directory: info.directory,
            startDate: info.startDate, startTime: info.startTime, endDate: info.endDate, endTime: info.endTime }
        try {
            const response = await saveObject('resolvedEvents', resolutionInfo, 
                { date: info.endDate, time: info.endTime }, 'Garrit', directory, title);
            console.log(response);
        } catch(err) {
            console.log('Error recording resolved dateTime:',err);
        }
        if (enterInfo) {
            selectDirTitleAndVersion(directory, title, version);
            selectResolutionInfo(info);
            console.log('resolving at ',info);
            if (mode === 'calendar') {
                selectFn('resolveSchedule');
            } else if (mode === 'mainMenu') {
                selectFn('resolveScheduleMain');
            }
        } else {
            // Adds to current resolutions, so importing all again not necessary.
            console.log([...resolvedEvents,
            {
                content: resolutionInfo, dateTime: { date: info.endDate, time: info.endTime },
                title: title, directory: directory, userID: 'Garrit'
            }]);
            setResolvedEvents([ ...resolvedEvents, 
                { content: resolutionInfo, dateTime: { date: info.endDate, time: info.endTime }, 
                    title: title, directory: directory, userID: 'Garrit' } ]);
        }
    }

    const generateReminder = async (element) => {
        const subtitleString = (element.subtitle && element.subtitle !== 'NA')
            ? ', ' + element.subtitle + ' '
            : ' ';

        try {
            const noteInfo = {
                subtitle: element.subtitle,
                event: `${element.directory}: ${element.title}` + subtitleString,
                dueDate: element.endDate, urgency: '10', note: 'resolve this in calendar before here (FOR NOW).',
            };
            const dateTime = { date: element.endDate, time: element.endTime };
            if (element.subtitle && element.subtitle !== 'NA') {
                const response = await saveObject('quickNote', noteInfo, dateTime, 'Garrit', 
                    element.directory+'/'+element.title, element.subtitle);
                console.log(response);
            } else {
                const response = await saveObject('quickNote', noteInfo, dateTime, 'Garrit',
                    element.directory, element.title);
                console.log(response);
            }
        } catch (err) {
            console.log('Error auto-generating quick note:', err);
        }
    }

    const createColorGradient = (basis) => {

        if(basis.length > 1) {
            const hexToRGB = (hex) => {
                const bigint = parseInt(hex.slice(1), 16);
                const r = (bigint >> 16) & 255;
                const g = (bigint >> 8) & 255;
                const b = bigint & 255;
                return { r, g, b };
            }

            const rgbToHex = (r, g, b) => {
                return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()}`;
            }

            const colors = ['#FF0000', '#FFA500', '#0000FF', '#00FF00', '#006400'];
            const numSteps = basis.length;
            const gradient = [];

            for (let i = 0; i < numSteps; i++) {
                const startColorIndex = Math.floor((i/(numSteps - 1))*(colors.length - 1));
                const endColorIndex = Math.min(startColorIndex + 1, colors.length - 1);
                const colorRatio = (i / (numSteps - 1)) * (colors.length - 1) - startColorIndex;

                const startColor = hexToRGB(colors[startColorIndex]);
                const endColor = hexToRGB(colors[endColorIndex]);

                const r = Math.round(startColor.r + (endColor.r - startColor.r) * colorRatio);
                const g = Math.round(startColor.g + (endColor.g - startColor.g) * colorRatio);
                const b = Math.round(startColor.b + (endColor.b - startColor.b) * colorRatio);

                gradient.push(rgbToHex(r, g, b));
            }

            setColorGradient(gradient);
        } else {
            setColorGradient(['black']);
        }
    }

    const DisplayPlot = ({ data }) => {
        return (
            <div className="bar-chart">
                {JSON.stringify(data)}
            </div>
        );
    };

    const Grid = () => {
        // Create reference dates
        const startDateObj = parseDateObject(startDate);
        const endDateObj = parseDateObject(endDate);
        // Find difference
        const numDays = (endDateObj - startDateObj) / (1000 * 60 * 60 * 24);
        // Indent if more than a week shown based on starting weekday
        const indentLength = numDays > 7 ? startDateObj.getDay() : 0;

        // Create cells as an array to display in return value
        // Uses indentLength to determine where empty cells are to be placed
        const cells = Array.from({length: numDays + indentLength}, (_,index) => {
            const usedIndex = index - indentLength;
            const fullDateUsed = new Date(startDateObj);
            fullDateUsed.setDate(startDateObj.getDate() + (numDays - (numDays - usedIndex)));
            const dateUsing = formatDateToObject(fullDateUsed).date;
            if (usedIndex < 0) {
                return <EmptyCell 
                            key={usedIndex} 
                            num={numDays - (numDays - usedIndex)}
                            maxNum={numDays}
                            origin={startDateObj} 
                            />
            } else {
                return <Cell 

                    key={usedIndex} 
                    num={numDays-(numDays-usedIndex)}
                    maxNum={numDays}
                    origin={startDateObj}

                    daysEvents={timelineEvents.filter((event) => {
                            // filter by specified dates
                            const date = convertUTCstringsToLocal({ date: event.dateTime.date, time: event.dateTime.time }).date;
                            if (include) {
                                return date === dateUsing && (specifiedDirectories.includes(event.directory) || specifiedTitles.includes(event.title));
                            } else {
                                return date === dateUsing && (!specifiedDirectories.includes(event.directory) && !specifiedTitles.includes(event.title));
                            }
                        }).sort((a, b) => {
                            const aDate =
                                a.UTC
                                    ? parseDateObject(convertUTCstringsToLocal({ date: a.dateTime.date, time: a.dateTime.time }))
                                    : parseDateObject({ date: a.dateTime.date, time: a.dateTime.time });
                            const bDate =
                                b.UTC
                                    ? parseDateObject(convertUTCstringsToLocal({ date: b.dateTime.date, time: b.dateTime.time }))
                                    : parseDateObject({ date: b.dateTime.date, time: b.dateTime.time });
                            return aDate - bDate
                    })}

                    daysSchedule={scheduleEvents.filter((event) => {
                            let startDate;
                            let endDate;
                            if (event.UTC) {
                                startDate = parseDateObject(convertUTCstringsToLocal({ date: event.startDate, time: event.startTime }));
                                endDate = parseDateObject(convertUTCstringsToLocal({ date: event.endDate, time: event.endTime }));
                            } else {
                                startDate = parseDateObject({ date: event.startDate, time: event.startTime });
                                endDate = parseDateObject({ date: event.endDate, time: event.endTime });
                            }
                            if (include) {
                                return ((formatDateToObject(startDate).date === dateUsing || 
                                        formatDateToObject(endDate).date === dateUsing || 
                                        (startDate <= fullDateUsed && endDate >= fullDateUsed))) 
                                        && (specifiedDirectories.includes(event.directory) || specifiedTitles.includes(event.title));
                            } else {
                                /*if (dateUsing === '12/31/2023') {
                                    console.log('sDeD', startDate, endDate,event);
                                    console.log('dU',dateUsing);
                                    console.log('fDU',fullDateUsed);
                                    console.log('truths', startDate <= fullDateUsed, endDate >= fullDateUsed);
                                }*/
                                
                                // return if (date string is equal to end OR start date string 
                                            // OR if date object is between start date object AND end date object)
                                            // AND meets inclusivity by name criteria
                                return ((formatDateToObject(startDate).date === dateUsing || 
                                        formatDateToObject(endDate).date === dateUsing || 
                                        (startDate <= fullDateUsed && endDate >= fullDateUsed)))
                                        && (!specifiedDirectories.includes(event.directory) && !specifiedTitles.includes(event.title));
                            }
                        }).sort((a, b) => {
                            const aDate = 
                                a.UTC 
                                    ?   parseDateObject(convertUTCstringsToLocal({ date: a.startDate, time: a.startTime }))
                                    :   parseDateObject({ date: a.startDate, time: a.startTime });
                            const bDate = 
                                b.UTC 
                                    ?   parseDateObject(convertUTCstringsToLocal({ date: b.startDate, time: b.startTime }))
                                    :   parseDateObject({ date: b.startDate, time: b.startTime });
                            return aDate - bDate
                    })}

                    daysResolutions={resolvedEvents.filter((event) => {
                            //returns if date is included in range of dates of event
                            const convertedStart = event.UTC 
                                ? convertUTCstringsToLocal({ date: event.content.startDate, time: event.content.startTime })
                                : { date: event.content.startDate, time: event.content.startTime};
                            const convertedEnd = event.UTC 
                                ? convertUTCstringsToLocal({ date: event.content.endDate, time: event.content.endTime })
                                : { date: event.content.endDate, time: event.content.endTime};
                            if (include) {
                                return ((convertedStart.date === dateUsing || convertedEnd.date === dateUsing)
                                    || (convertedStart.date <= dateUsing && convertedEnd.date >= dateUsing)) 
                                    && (specifiedDirectories.includes(event.directory) || specifiedTitles.includes(event.title));
                            } else {
                                return ((convertedStart.date === dateUsing || convertedEnd.date === dateUsing)
                                    || (convertedStart.date <= dateUsing && convertedEnd.date >= dateUsing)) 
                                    && (!specifiedDirectories.includes(event.directory) && !specifiedTitles.includes(event.title));
                            }
                        }).sort((a, b) => {
                            const aDate =
                                a.UTC
                                    ? parseDateObject(convertUTCstringsToLocal({ date: a.startDate, time: a.startTime }))
                                    : parseDateObject({ date: a.startDate, time: a.startTime });
                            const bDate =
                                b.UTC
                                    ? parseDateObject(convertUTCstringsToLocal({ date: b.startDate, time: b.startTime }))
                                    : parseDateObject({ date: b.startDate, time: b.startTime });
                            return aDate - bDate
                    })}
                    />
            }
        });
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', overflow: 'auto' }}>
                {cells}
            </div>
        );
    }

    const Cell = ({ num, maxNum, origin, daysEvents, daysSchedule, daysResolutions }) => {
        const [localScrollPosition, setLocalScrollPosition] = useState(scrollPosition);
        const dateObject = new Date(origin);
        const todaysDate = new Date();
        todaysDate.setHours(0,0,0,0);
        dateObject.setDate(origin.getDate() + num);
        //daysSchedule.length > 0 && console.log('dS',daysSchedule, dateObject);
        const divRef = useRef(null);

        // Use useEffect to update the scrollTop when localScrollPosition changes
        useEffect(() => {
            if (divRef.current && expandedCell && ((formatDateToObject(expandedCell).date === formatDateToObject(dateObject).date))) {
                divRef.current.scrollTop = localScrollPosition;
            }
        }, [localScrollPosition]);

        const cellStyle = {
            boxSizing: 'border-box',
            width: expandedCell
                ? (formatDateToObject(expandedCell).date === formatDateToObject(dateObject).date ? (
                        `50%`
                    ) : ((sameWeek(expandedCell,dateObject) 
                            ?   (maxNum < 8 ? `${50/maxNum}%` : `calc(50% / 6)`)
                            :   (maxNum < 8 ? `${50/maxNum}%` : `calc(100% / 7)`)
                    )
                ))
                : (maxNum < 8 ? `${100/maxNum}%` : `calc(100% / 7)`),
            height: expandedCell 
                ? ((formatDateToObject(expandedCell).date === formatDateToObject(dateObject).date) 
                ? '35vh' : '20vh') : '20vh',
            border: '1px solid black',
            display: 'inline-block',
            padding: '2px',
            overflow: 'auto',
        };
        const dateStyle = {
            margin: '0',
            position: 'relative',
            fontSize: '2vh',
        }
        const listStyle = {
            paddingInlineStart: '2px',
            position: 'relative',
            marginLeft: dateStyle.margin,
            fontSize: '1.5vh',
            whiteSpace: 'nowrap',
            listStyleType: 'none',
        }

        return (
            <div ref={divRef} style={cellStyle} onScroll={(e) => setLocalScrollPosition(e.target.scrollTop)}>
                <p 
                    style={dateStyle}
                    onClick={() => {expandedCell
                                    ? formatDateToObject(expandedCell).date !== formatDateToObject(dateObject).date
                                        ? setExpandedCell(dateObject) 
                                        : setExpandedCell(false) 
                                    : setExpandedCell(dateObject)}}
                    >
                    {formatDateToObject(dateObject).date.split('/').slice(0,-1).join('/') + ' ' + getWeekdayString(dateObject.getDay())}
                </p>
                <div style={{ borderTop: '1px solid orange', borderBottom: '1px solid orange', marginBottom: '5px' }}>
                    {daysSchedule && (
                        <ul style={listStyle}>
                            {daysSchedule.map((element, index) => {
                                //console.log('beginning of map',dateObject,element);

                                const subtitleString = (element.subtitle && element.subtitle !== 'NA')
                                    ? ', ' + element.subtitle + ' '
                                    : ' ';

                                let objectResolved = false;
                                for (let i = 0; i < daysResolutions.length; i++) {
                                    //console.log('res',daysResolutions[i]);
                                    let truth = true;
                                    for (const prop in daysResolutions[i].content) {
                                        if (prop !== 'dateTime' && (daysResolutions[i].content[prop] !== element[prop])) {
                                            truth = false;
                                            //if (subtitleString === ', Remind ') {
                                            //    console.log('res2', dateObject, prop, daysResolutions[i][prop] === element[prop]);
                                            //}
                                            break;
                                        }
                                    }
                                    //console.log(element.subtitle, daysResolutions[i].dateTime.dateTime);
                                    if (truth && (!element.subtitle || (element.subtitle === daysResolutions[i].content.subtitle))) {
                                        objectResolved = true;
                                        break;
                                    }
                                }

                                if (!objectResolved && element.remind && todaysDate > dateObject) {
                                    handleScheduleResolution(false, element.directory, element.title, null, element)
                                    generateReminder(element);
                                }

                                const handleClick = () => {
                                    setScrollPosition(localScrollPosition);
                                    setSelection(daysSchedule[index]); // Update selection with the index of the clicked element
                                    setSelectionType('schedule');
                                    console.log('schedule selection', daysSchedule[index], 'at', element);
                                };

                                const createString = () => {
                                    let displayString = `${element.directory}: ${element.title}` + subtitleString;
                                    if (element.UTC) {
                                        if (convertUTCstringsToLocal({ date: element.startDate, time: element.startTime }).date !== formatDateToObject(dateObject).date) {
                                            displayString += convertUTCstringsToLocal({ date: element.startDate, time: element.startTime }).date +', ';
                                        }
                                        displayString += convertUTCstringsToLocal({ date: element.startDate, time: element.startTime }).time;
                                        if (convertUTCstringsToLocal({ date: element.endDate, time: element.endTime }).date !== formatDateToObject(dateObject).date) {
                                            displayString += convertUTCstringsToLocal({ date: element.endDate, time: element.endTime }).date + ', ';
                                        }
                                        if (element.endDate !== element.startDate || element.endTime !== element.startTime) {
                                            displayString += ' - ' + convertUTCstringsToLocal({ date: element.endDate, time: element.endTime }).time;
                                        }
                                    } else {
                                        if (element.startDate !== formatDateToObject(dateObject).date) {
                                            displayString += element.startDate + ', ';
                                        }
                                        displayString += element.startTime;
                                        if (element.endDate !== formatDateToObject(dateObject).date) {
                                            displayString += element.endDate + ', ';
                                        }
                                        if (element.endDate !== element.startDate || element.endTime !== element.startTime) {
                                            displayString += ' - ' + element.endTime;
                                        }
                                    } 
                                    return displayString;
                                }

                                return (
                                    <li key={index} onClick={handleClick} 
                                        style={{
                                            color: colorGradient[colorGradientBasis.findIndex((dir) => (dir === element.directory))],
                                            textDecorationColor: 'darkorange', 
                                            textDecorationLine: objectResolved ? 'line-through' : 'underline',
                                            fontWeight: selection === daysSchedule[index] && 'bold',
                                            fontSize: selection === daysSchedule[index] && '12px'
                                        }}
                                        >
                                        {createString()}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <div style={{ borderTop: '1px solid blue', borderBottom: '1px solid blue', marginBottom: '5px' }}>
                    {daysEvents && (
                        <ul style={listStyle}>
                            {daysEvents.map((element, index) => {

                                const endDate = element.dateTime.date;
                                const endTime = element.dateTime.time;
                                const startDate = (element.UI.find((UIelement) => UIelement.type === 'startDate') || { outVal: null }).outVal;
                                const startTime = (element.UI.find((UIelement) => UIelement.type === 'startTime') || { outVal: null }).outVal;

                                const handleClick = () => {
                                    setScrollPosition(localScrollPosition);
                                    setSelection(daysEvents[index]); // Update selection with the index of the clicked element
                                    setSelectionType('event');
                                    console.log('event selection', daysEvents[index], 'at', formatDateToObject(dateObject));
                                };

                                const subtitleString = (element.dateTime.subtitle && element.dateTime.subtitle !== 'NA')
                                    ? ', ' + element.dateTime.subtitle + ' '
                                    : ' ';

                                return (
                                    <li key={index} onClick={handleClick} 
                                        style={{ 
                                            color: colorGradient[colorGradientBasis.findIndex((dir) => (dir === element.directory))],
                                            textDecorationColor: 'teal',
                                            textDecorationLine: 'underline',
                                            fontWeight: selection === daysEvents[index] && 'bold',
                                            fontSize: selection === daysEvents[index] && '12px'
                                            }}>
                                        {startTime
                                            ? `${element.directory}: ${element.title}` + subtitleString + `${convertUTCstringsToLocal({
                                                date: startDate,
                                                time: startTime,
                                            }).time}-${convertUTCstringsToLocal({
                                                date: endDate,
                                                time: endTime,
                                            }).time}`
                                            : `${element.directory}: ${element.title.split('.')[0]}` + subtitleString + `${convertUTCstringsToLocal({
                                                date: endDate,
                                                time: endTime,
                                            }).time}`}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <div style={{ borderTop: '1px solid green', borderBottom: '1px solid green' }}>
                    {daysResolutions && (
                        <ul style={listStyle}>
                            {daysResolutions.map((element, index) => {
                                const handleClick = () => {
                                    setScrollPosition(localScrollPosition);
                                    setSelection(element); // Update selection with the index of the clicked element
                                    setSelectionType('resolution');
                                    console.log('resolution selection', element);
                                };
                                //console.log('element.dateTime',element.dateTime);
                                //console.log('daysSchedule.dateTimes',daysSchedule.map((element) => (element.dateTime)));

                                const subtitleString = (element.content.subtitle && element.content.subtitle !== 'NA')
                                    ? ', ' + element.content.subtitle + ' '
                                    : ' ';

                                return (
                                    <li key={index} onClick={handleClick} 
                                        style={{ 
                                            color: colorGradient[colorGradientBasis.findIndex((dir) => (dir === element.directory))],
                                            textDecorationColor: 'green',
                                            textDecorationLine: 'underline',
                                            fontWeight: selection === daysResolutions[index] && 'bold',
                                            fontSize: selection === daysResolutions[index] && '12px'
                                            }}
                                        >
                                        { element.content.UTC 
                                            ?   `${element.directory}: ${element.title}` + subtitleString + `${convertUTCstringsToLocal({
                                                    date: element.content.startDate,
                                                    time: element.content.startTime,
                                                }).time}-${convertUTCstringsToLocal({
                                                    date: element.content.endDate,
                                                    time: element.content.endTime,
                                                }).time}`
                                            :   `${element.content.directory}: ${element.content.title}` + subtitleString + `${element.content.startTime}-${element.content.endTime}`
                                        }
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        );
    }

    const EmptyCell = ({ num, maxNum, origin }) => {
        const dateObject = new Date(origin.getTime() + (num * 1000 * 60 * 60 * 24));
        const cellStyle = {
            boxSizing: 'border-box',
            width: (expandedCell && sameWeek(expandedCell, dateObject))
                    ? (maxNum < 8 ? `calc(50% / ${maxNum })` : `calc(50% / 6)`)
                    : (maxNum < 8 ? `calc(50% / ${maxNum })` : `calc(100% / 7)`),
            height: '20vh',
            padding: '2px',
            display: 'inline-block',
            border: '1px solid white',
        };
        return (
            <div style={cellStyle}>
            </div>
        );
    }

    const sameWeek = (date1, date2) => {

        const diffDates = differenceInDays(date1, date2);

        const diffDays = date1.getDay() - date2.getDay();
        //console.log(date1, date2, diffDates, diffDays);

        // if difference in dates is same as difference in weekdays AND months are at least adjacent
        if (Math.abs(diffDates) === Math.abs(diffDays)) {
            return true;
        } else {
            return false;
        }
    }

    return (
        <div>
            { mode === 'calendar' &&
                <div>
                    <div style={{ display: 'flex' }}>
                        <p>Start</p>
                        <input
                            value={startDateIn}
                            onChange={(e) => uponInputChange(e.target.value, setStartDateIn)}
                        />
                        <p>End</p>
                        <input
                            value={endDateIn}
                            onChange={(e) => uponInputChange(e.target.value, setEndDateIn)}
                        />
                        <button onClick={() => fetchFromRange(startDateIn, endDateIn)}>Apply Dates</button>
                        <button onClick={() => selectFn('scheduledEvents')}>Schedule New Event</button>
                        <button
                            onClick={() => setImportEvents(importEvents ? false : true)}
                            style={{ color: importEvents ? 'gray' : 'black' }}
                        >
                            Include Event Info
                        </button>
                    </div>
                    <div display={{ style: 'flex' }}>
                        <button onClick={() => setInclude(true)}>Include</button>
                        <button onClick={() => setInclude(false)}>Exclude</button>
                        <input
                            value={specifiedDirectory}
                            list='presentDirectories'
                            onChange={(e) => uponInputChange(e.target.value, setSpecifiedDirectory)}
                        />
                        {
                            <datalist id='presentDirectories'>
                                {colorGradientBasis.map((element, index) => (
                                    <option key={index} value={element} />
                                ))
                                }
                            </datalist>
                        }
                        <button onClick={() => setSpecifiedDirectories([...specifiedDirectories, specifiedDirectory])}>Add Directory</button>
                        <input
                            value={specifiedTitle}
                            list='presentTitles'
                            onChange={(e) => uponInputChange(e.target.value, setSpecifiedTitle)}
                        />
                        {
                            <datalist id='presentTitles'>
                                {Array.from(new Set([...timelineEvents.map(element => element.title),
                                ...scheduleEvents.map(element => element.title)]))
                                    .map((element, index) => (
                                        <option key={index} value={element} />
                                    ))
                                }
                            </datalist>
                        }
                        <button onClick={() => setSpecifiedTitles([...specifiedTitles, specifiedTitle])}>Add Title</button>
                    </div>
                    <div>
                        <ul style={{ 'listStyle': 'none', 'display': 'inline', padding: 0, margin: 0 }}>
                            {include ? 'including directories:' : 'excluding directories:'}
                            {specifiedDirectories.map((event, index) => (
                                <li
                                    key={index}
                                    style={{ display: 'inline', cursor: 'pointer' }}
                                    onClick={() => setSpecifiedDirectories(specifiedDirectories.
                                        filter((element) => (element !== event)))}
                                >
                                    {event + ', '}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <ul style={{ 'listStyle': 'none', 'display': 'inline', padding: 0, margin: 0 }}>
                            {include ? 'including titles:' : 'excluding titles:'}
                            {specifiedTitles.map((event, index) => (
                                <li
                                    key={index}
                                    style={{ display: 'inline', cursor: 'pointer' }}
                                    onClick={() => setSpecifiedTitles(specifiedTitles.
                                        filter((element) => (element !== event)))}
                                >
                                    {event + ', '}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div style={{ height: '30vh', overflowY: 'auto', overflowX: 'wrap' }}>
                        {selection &&
                            (selectionType === 'event' ?
                                <div>
                                    <DisplayInfo info={selection} />
                                    <button onClick={() => handleContentEditing('customEdit', selection)}>Edit Content</button>
                                    <button onClick={() => setDblCheckDelete(true)}>Delete File</button>
                                    {dblCheckDelete &&
                                        <div>
                                            <p>Are you sure?</p>
                                            <button onClick={() => handleEventDeleting(selection)}>Yes</button>
                                            <button onClick={() => setDblCheckDelete(false)}>No</button>
                                        </div>
                                    }
                                </div>
                                : (selectionType === 'schedule') ?
                                    <div>
                                        <DisplayScheduled info={selection} />
                                        <button onClick={() => handleContentEditing('scheduledEvents', selection)}>Edit Content</button>
                                    </div>
                                    : (selectionType === 'resolution') ?
                                        <div>
                                            <DisplayResolved info={selection} />
                                            <button onClick={() => setDblCheckDelete(true)}>Delete File</button>
                                            {dblCheckDelete &&
                                                <div>
                                                    <p>Are you sure?</p>
                                                    <button onClick={() => handleResolutionDeleting(selection)}>Yes</button>
                                                    <button onClick={() => setDblCheckDelete(false)}>No</button>
                                                </div>
                                            }
                                        </div>
                                        : (selectionType === 'plot') &&
                                        <DisplayPlot />
                            )
                        }
                    </div>
                    <div style={{ display: 'flex' }}>
                        <button onClick={() => plotBar('finances')}>Plot Finances</button>
                        <button onClick={() => plotBar('time')}>Plot Time Usage</button>
                        <button onClick={() => selectFn('main')}>Return to Main</button>
                    </div>
                </div>
            }
            <div>
                {timelineEvents && scheduleEvents && resolvedEvents &&
                    <Grid />
                }
            </div>
            <div style={{ height: '30vh', overflowY: 'auto', overflowX: 'wrap' }}>
                {selection &&
                    (selectionType === 'event' ?
                        <div>
                            <DisplayInfo info={selection} />
                            <button onClick={() => handleContentEditing('customEdit', selection)}>Edit Content</button>
                            <button onClick={() => setDblCheckDelete(true)}>Delete File</button>
                            {dblCheckDelete &&
                                <div>
                                    <p>Are you sure?</p>
                                    <button onClick={() => handleEventDeleting(selection)}>Yes</button>
                                    <button onClick={() => setDblCheckDelete(false)}>No</button>
                                </div>
                            }
                        </div>
                        : (selectionType === 'schedule') ?
                            <div>
                                <DisplayScheduled info={selection} />
                                <button onClick={() => handleContentEditing('scheduledEvents', selection)}>Edit Content</button>
                            </div>
                            : (selectionType === 'resolution') ?
                                <div>
                                    <DisplayResolved info={selection} />
                                    <button onClick={() => setDblCheckDelete(true)}>Delete File</button>
                                    {dblCheckDelete &&
                                        <div>
                                            <p>Are you sure?</p>
                                            <button onClick={() => handleResolutionDeleting(selection)}>Yes</button>
                                            <button onClick={() => setDblCheckDelete(false)}>No</button>
                                        </div>
                                    }
                                </div>
                                : (selectionType === 'plot') &&
                                <DisplayPlot />
                    )
                }
            </div>
        </div>
    );
}

//* Following two functions used for direct editing without interface assistance (not designed to really be part of the app) */
export const EditMiscObject = ({ printLevel, selectFn, preselectedTable, preselectedDir, preselectedTitle, preselectedVersion }) => {
    const [object, setObject] = useState([]);

    useEffect(() => {
        if ('date' in preselectedVersion) {
            fetchFile();
        } else {
            setObject(preselectedVersion);
        }
    }, []);

    const fetchFile = async () => {
        try {
            const objectIn = await fetchObject(preselectedTable, preselectedVersion, 'Garrit', preselectedDir, preselectedTitle);
            setObject(objectIn);
        } catch (err) {
            console.error(`Error fetching ${preselectedTable}, ${preselectedDir}, ${preselectedTitle}, ${preselectedVersion.date}-${preselectedVersion.time}:`, err);
        }
    };

    const saveFile = () => {
        try {
            let response;
            if ('date' in preselectedVersion) {
                response = saveObject(preselectedTable, object, preselectedVersion, 'Garrit', preselectedDir, preselectedTitle);
            } else {
                response = recordDateTime(preselectedTable, object, 'Garrit', preselectedDir, preselectedTitle);
            }
            console.log(response);
        } catch (err) {
            console.error(`Error saving ${preselectedTable}, ${preselectedDir}, ${preselectedTitle}, ${preselectedVersion.date}-${preselectedVersion.time}:`, err);
        }
    };

    // Define a callback function to update the outer object
    const handleObjectChange = (updatedObject) => {
        setObject(updatedObject);
    };

    return (
        <div>
            <div style={{ display: 'flex' }}>
                <p>{preselectedTable}: {preselectedDir}/{preselectedTitle}/{preselectedVersion.date}-{preselectedVersion.time}</p>
                <button onClick={() => saveFile()}>Save</button>
                <button onClick={() => fetchFile()}>Cancel</button>
            </div>
            <EditValues originalObject={object} onObjectChange={handleObjectChange} />
        </div>
    );
};

const EditValues = ({ printLevel, originalObject, onObjectChange }) => {
    // Function to handle input changes and update the state

    const handleInputChange = (key, index, value) => {
        const updatedObject = !Array.isArray(originalObject )
            ?   { ...originalObject }   :   [ ...originalObject ];

        if (index === 'NA') {
            updatedObject[key] = value;
        } else {
            updatedObject[key][index] = value;
        }

        // Call the callback function to update the outer object
        onObjectChange(updatedObject);
    };

    const handleTF = (key, index, value) => {
        const updatedObject = !Array.isArray(originalObject)
            ? { ...originalObject } : [...originalObject];

        if (index === 'NA') {
            updatedObject[key] = value;
        } else {
            updatedObject[key][index] = value;
        }

        onObjectChange(updatedObject)
    }

    return (
        <div>
            {!Array.isArray(originalObject)
                ?   Object.keys(originalObject).map(key => (
                    typeof originalObject[key] === 'string' ? (
                        <div key={key} style={{ display: 'flex' }}>
                            <p>{key}:</p>
                            <input
                                value={originalObject[key]}
                                onChange={e => handleInputChange(key, 'NA', e.target.value)}
                            />
                        </div>
                    ) : typeof originalObject[key] === 'boolean' ? (
                        <div key={key} style={{ display: 'flex' }}>
                            <p>{key}:</p>
                            <button 
                                onClick={() => handleTF(key, 'NA', true)}
                                style={{ color: originalObject[key] ? 'gray' : 'black' }}
                                >
                                True
                            </button>
                            <button 
                                onClick={() => handleTF(key, 'NA', false)}
                                style={{ color: !originalObject[key] ? 'gray' : 'black' }}
                                >
                                False
                            </button>
                        </div>
                    ) : (
                        <div key={key} style={{ display: 'flex' }}>
                            <button onClick={() => {
                                const { key, ...updatedObject } = originalObject;
                                onObjectChange(updatedObject);
                                }}>
                                -
                            </button>
                            <p>{key}:</p>
                            {originalObject[key].map((element, index) => (
                                element !== '' &&
                                <input
                                    key={key+index}
                                    value={element}
                                    onChange={e => handleInputChange(key, index, e.target.value)}
                                    />
                            ))}
                        </div>
                    )
                ))
                : originalObject.map((element,index) => (
                    typeof originalObject[index] === 'string' ? (
                        <div key={index} style={{ display: 'flex' }}>
                            <p>{index}:</p>
                            <input
                                value={originalObject[index]}
                                onChange={e => handleInputChange(index, 'NA', e.target.value)}
                            />
                        </div>
                    ) : typeof originalObject[index] === 'boolean' ? (
                        <div key={index} style={{ display: 'flex' }}>
                            <p>{index}:</p>
                            <button
                                onClick={() => handleTF(index, true)}
                                style={{ color: originalObject[index] ? 'gray' : 'black' }}
                                >
                                True
                            </button>
                            <button
                                onClick={() => handleTF(index, false)}
                                style={{ color: !originalObject[index] ? 'gray' : 'black' }}
                                >
                                False
                            </button>
                        </div>
                    ) : element !== '' && (
                        <div key={index} style={{ display: 'flex' }}>
                            <button onClick={() => {
                                const updatedObject = originalObject.filter((object,index2) => index !== index2);
                                onObjectChange(updatedObject);
                                }}>
                                -
                            </button>
                            {Object.keys(originalObject[index]).map((key) => (
                                ( typeof originalObject[index][key] !== 'boolean'
                                    ?   <div key={index + key}>
                                        <p>{key}:</p>
                                        <input
                                            value={originalObject[index][key]}
                                            onChange={e => handleInputChange(index, key, e.target.value)}
                                        />
                                    </div>
                                    :   <div key={key} style={{ display: 'flex' }}>
                                        <p>{key}:</p>
                                        <button
                                            onClick={() => handleTF(index, key, true)}
                                            style={{ color: originalObject[index][key] ? 'gray' : 'black' }}
                                            >
                                            True
                                        </button>
                                        <button
                                            onClick={() => handleTF(index, key, false)}
                                            style={{ color: !originalObject[index][key] ? 'gray' : 'black' }}
                                            >
                                            False
                                        </button>
                                    </div>
                                )
                            ))}
                        </div>
                    )
                ))
            }
        </div>
    );
}

export const FileExplorer = ({ printLevel, selectFn, selectDirTitleAndVersion }) => {

    const [searchString, setSearchString] = useState('');
    const [discoveredFiles, setDiscoveredFiles] = useState([]);
    const [listOfDirs, setListOfDirs] = useState([]);
    const [listOfFiles, setListOfFiles] = useState([]);
    const [listOfVersions, setListOfVersions] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [selectedDirectory, setSelectedDirectory] = useState(null);
    const [selectedTitle, setSelectedTitle] = useState(null);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [fileContent, setFileContent] = useState(null);
    const [dblCheckDeleteDir, setDblCheckDeleteDir] = useState(false);
    const [dblCheckDeleteFile, setDblCheckDeleteFile] = useState(false);
    const [dblCheckDeleteVersion, setDblCheckDeleteVersion] = useState(false);

    useEffect(() => {
        if (selectedTable) {
            callFetchDirsAndFiles(selectedTable);
        }
    }, [selectedTable]);

    const callFetchDirsAndFiles = async (table) => {
        try {
            const dirsAndFiles = await fetchDirsAndFiles(table,'Garrit');
            setListOfFiles(dirsAndFiles.files);
            setListOfDirs(dirsAndFiles.directories);
            if (selectedTitle) {
                setListOfVersions(dirsAndFiles.files.map((element) => {
                    if (element.directory === selectedDirectory && element.title === selectedTitle) {
                        return element.dateTime;
                    } else {
                        return null;
                    }
                }).filter((element) => (element !== null)))
            }
        } catch (err) {
            console.error('Error fetching dirs and files:', err);
        }
    };

    const handleSearch = async () => {
        try {
            const relevantFiles = await fetchStringInstances(selectedTable, 'Garrit', searchString);
            setDiscoveredFiles(relevantFiles);
        } catch(err) {
            console.log('error searching:', err);
        }
    }

    const handleTableClick = (tableName) => {
        setListOfFiles([]);
        setListOfDirs([]);
        setFileContent(null);
        if (tableName !== selectedTable) {
            setSelectedTable(tableName);
            callFetchDirsAndFiles(tableName);
            console.log('selected table.', tableName);
        } else {
            setSelectedTable(null);
            console.log('deselected table:', tableName);
        }
        setSelectedDirectory(null);
        setSelectedTitle(null);
        setSelectedVersion(null);
        setListOfVersions(null);
    };

    const handleDirectoryClick = (dirName) => {
        setFileContent(null);
        if (dirName !== selectedDirectory) {
            setSelectedDirectory(dirName);
            callFetchDirsAndFiles(selectedTable);
            console.log('selected dir:', dirName);
        } else {
            if (dirName.split('/').length >= 1) {
                setSelectedDirectory(dirName.split('/').slice(0, -1).join('/'));
            } else {
                setSelectedDirectory(null);
                setSelectedTitle(null);
                setSelectedVersion(null);
            }
            console.log('deselected dir:', dirName);
        }
        setSelectedTitle(null);
        setSelectedVersion(null);
        setListOfVersions(null);
        setDblCheckDeleteDir(false);
        setDblCheckDeleteFile(false);
        setDblCheckDeleteVersion(false);
    };

    const handleFileClick = async (file) => {
        console.log('selected title:', file.title);
        setFileContent(null);
        const listOfVersionsTemp = listOfFiles.map((element) => {
            if (element.directory === selectedDirectory && element.title === file.title) {
                return element.dateTime;
            } else {
                return null;
            }
        }).filter((element) => (element !== null));

        if (selectedTitle === file.title) {
            setSelectedTitle(null);
            setSelectedVersion(null);
            setListOfVersions(null);
        } else {
            setSelectedTitle(file.title);
            if (selectedTable !== 'timeRecords') {
                setListOfVersions(listOfVersionsTemp);
                if (listOfVersionsTemp.length !== 1) {
                    setSelectedVersion(null);
                } else {
                    setSelectedVersion(listOfVersionsTemp[0]);
                    try {
                        if (selectedTable === 'journals') {
                            const content = await fetchText(selectedTable, listOfVersionsTemp[0], 'Garrit', selectedDirectory, file.title);
                            setFileContent(content);
                        } else {
                            const content = await fetchObject(selectedTable, listOfVersionsTemp[0], 'Garrit', selectedDirectory, file.title);
                            setFileContent(content);
                        }
                    } catch (err) {
                        console.error('Error fetching file content:', err);
                    }
                }
            } else {
                try {
                    console.log('attempting time versions');
                    const content = await fetchDateTimes(selectedTable, 'Garrit', selectedDirectory, file.title);
                    setListOfVersions(content);
                } catch(err) {
                    console.log('Error fetching file:', err);
                }
            }
        }
        setDblCheckDeleteFile(false);
        setDblCheckDeleteVersion(false);
    };

    const handleVersionClick = async (version) => {
        console.log('selected version:', version);
        if ( selectedVersion === version ) {
            setSelectedVersion(null);
            setFileContent(null);
        } else {
            setSelectedVersion(version);
            try {
                if (selectedTable === 'journals') {
                    const content = await fetchText(selectedTable, version, 'Garrit', selectedDirectory, selectedTitle);
                    setFileContent(content);
                } else {
                    const content = await fetchObject(selectedTable, version, 'Garrit', selectedDirectory, selectedTitle);
                    setFileContent(content);
                }
            } catch (err) {
                console.error('Error fetching file content:', err);
            }
        }
        setDblCheckDeleteVersion(false);
    }

    const handleContentEditing = () => {
        console.log('editing ', selectedTable, selectedDirectory, selectedTitle, selectedVersion, ' content');
        switch (selectedTable) {
            case 'customInfo':
                selectDirTitleAndVersion(selectedDirectory, selectedTitle, selectedVersion);
                selectFn('customEdit');
                break;
            case 'journals':
            case 'customUI':
                selectDirTitleAndVersion(selectedDirectory, selectedTitle, selectedVersion);
                selectFn(selectedTable);
                break;
            case 'inProgress':
                selectDirTitleAndVersion(selectedDirectory, selectedTitle, selectedVersion);
                selectFn('customClockOut');
                break;
            case 'scheduledEvents':
            case 'miscObject2':
            case 'timeRecords':
            case 'quickNote':
            case 'miscDropdowns':
            case 'resolvedEvents':
                selectDirTitleAndVersion(selectedDirectory, selectedTitle, selectedVersion, selectedTable);
                selectFn('edit any');
                break;
            default:
                break;
        }
    };

    const handleVersionDeleting = async (directory, title, version) => {
        console.log('handling deletion of ',selectedTable, selectedDirectory, title, version);
        setDblCheckDeleteVersion(false);
        setDblCheckDeleteFile(false);
        setDblCheckDeleteDir(false);
        setFileContent(null);
        try {
            const responseMsg = await deleteEntry(selectedTable, version, 'Garrit', directory, title);
            console.log(responseMsg);
            setSelectedVersion(null);
            await callFetchDirsAndFiles(selectedTable, selectedDirectory);
        } catch (err) {
            console.error('Error fetching directories and files:', err);
        }
    }

    const handleFileDeleting = async (directory, title) => {
        for (const file of listOfFiles) {
            if (file.directory.split('/').slice(0, directory.split('/').length).join('/') === directory
                && file.title === title) {
                handleVersionDeleting(file.directory, file.title, file.dateTime);
            }
        }
        setDblCheckDeleteVersion(false);
        setDblCheckDeleteFile(false);
        setDblCheckDeleteDir(false);
    };

    const handleDirectoryDeleting = async () => {
        for (const file of listOfFiles) {
            if (file.directory.split('/').slice(0,selectedDirectory.split('/').length).join('/') === selectedDirectory) {
                handleFileDeleting(file.directory,file.title);
            }
        }
        if(selectedDirectory.split('/').length !== 1) {
            setSelectedDirectory(selectedDirectory.split('/').slice(0,-1).join('/'));
        } else {
            setSelectedDirectory(null);
        }
        setDblCheckDeleteVersion(false);
        setDblCheckDeleteFile(false);
        setDblCheckDeleteDir(false);
    }

    const CascadingRender = () => {
        let filteredList = [];
        if (selectedDirectory) {
            let selectedList = [];
            // adds all subdirs from currently selected dir
            for (let i = 1; i < selectedDirectory.split('/').length + 1; i++) {
                selectedList.push({ title: selectedDirectory.split('/').slice(0, i).join('/'), isFile: false });
            }
            // adds dirs equal to selectedDirectory up to trailing dir
            const filteredListNoFiles = selectedList.concat(
                listOfDirs.filter((element) => ( 
                    element.split('/').length > selectedDirectory.split('/').length
                    && element.split('/').slice(0, selectedDirectory.split('/').length).join('/') === selectedDirectory
                )).map((element) => (
                    {title: element.split('/').slice(0, selectedDirectory.split('/').length+1).join('/'), isFile: false }
                ))
            );
            const filteredListNoDupes = filteredListNoFiles.filter((obj, index, self) =>
                index === self.findIndex((o) => o.title === obj.title)
            );
            // adds files with dir matching selectedDirectory
            filteredList = filteredListNoDupes.concat(listOfFiles
                .filter((element,index,self) => (
                    element.directory === selectedDirectory &&
                    index === self.findIndex((o) => o.directory === element.directory && o.title === element.title)
                )).map((element) => ({...element, isFile: true})
            ));
        } else {
            // initial list of directories
            filteredList = listOfDirs.map((element) => {
                    if (element.split('/').length === 1) { 
                        // if no subdirs
                        return { title: element, isFile: false};
                    } else if (!listOfDirs.includes(element.split('/')[0])) {
                        // leading dir if not present alone
                        return { title: element.split('/')[0], isFile: false};
                    } else {
                        // otherwise would be undefined
                        return null;
                    }
                }).filter((element) => (element !== null)).filter((obj, index, self) =>
                index === self.findIndex((o) => o.title === obj.title)
            );  
        }

        return (
            <ul>
                {filteredList.filter((element) => (element !== null)).map((element, index) => (
                    <li
                        key={index}
                        onClick={() => (element.isFile
                            ? handleFileClick(element)
                            : handleDirectoryClick(element.title))}
                        style={element.isFile === false ? (
                            { 'marginLeft': `${element.title.split('/').length * 20}px` }
                        ) : (
                            {
                                'marginLeft': `${(selectedDirectory.split('/').length + 1) * 20}px`,
                                'listStyleType': 'circle',
                            }
                        )
                        }
                    >
                        {element.title.split('/').slice(-1)}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div>
            <h2>File Manager</h2>
            <div>
                <button onClick={() => handleTableClick("journals")}>Journals</button>
                <button onClick={() => handleTableClick("customUI")}>Custom UI</button>
                <button onClick={() => handleTableClick("customInfo")}>Custom Input</button>
                <button onClick={() => handleTableClick("scheduledEvents")}>Schedule</button>
                <button onClick={() => handleTableClick("resolvedEvents")}>Resolved Schedule</button>
                <button onClick={() => handleTableClick("timeRecords")}>Time Records</button>
                <button onClick={() => handleTableClick("inProgress")}>In Progress</button>
                <button onClick={() => handleTableClick("quickNote")}>Quick Notes</button>
                <button onClick={() => handleTableClick("miscDropdowns")}>Dropdowns</button>
                <button onClick={() => handleTableClick("miscObject")}>Test Objects</button>
                <button onClick={() => handleTableClick("miscObject2")}>Test Objects 2</button>
                {selectedTable !== null && 
                    (
                    <div>
                        {selectedTable === 'customInfo' &&
                            <p>Don't forget to change dropdowns too!</p>
                        }
                        <div style={{ display: 'flex' }}>
                            <input onChange={(e) => setSearchString(e.target.value)}></input>
                            <button onClick={() => handleSearch()}>Search</button>
                            <button onClick={() => setDiscoveredFiles([])}>Clear</button>
                        </div>
                        { discoveredFiles.length > 0 &&
                            discoveredFiles.map((file,index) =>
                            <p key={index}>{file.directory}/{file.title}/
                                {convertUTCstringsToLocal(file.dateTime).date}-{convertUTCstringsToLocal(file.dateTime).time} -
                                - "{file.sample}"
                            </p>
                        )
                        }
                        <CascadingRender />
                    </div>
                    )
                }
            </div>
            <button onClick={() => selectFn('main')}>Return to Main</button>
            {selectedDirectory &&
                <div>
                    <button 
                        onClick={() => setDblCheckDeleteDir(true)}
                        >
                        Recursively Delete {selectedDirectory}
                    </button>
                    {dblCheckDeleteDir &&
                        <div>
                            <p>Are you sure?</p>
                            <button onClick={() => handleDirectoryDeleting() }>Yes</button>
                            <button onClick={() => setDblCheckDeleteDir(false)}>No</button>
                        </div>
                    }
                </div>
            }
            {selectedTitle &&
                <div>
                    <button
                        onClick={() => setDblCheckDeleteFile(true)}
                        >
                        Recursively Delete {selectedDirectory+'/'+selectedTitle}
                    </button>
                    {dblCheckDeleteFile &&
                        <div>
                            <p>Are you sure?</p>
                            <button onClick={() => handleFileDeleting(selectedDirectory,selectedTitle)}>Yes</button>
                            <button onClick={() => setDblCheckDeleteFile(false)}>No</button>
                        </div>
                    }
                    <p>Versions:</p>
                    <div>
                        <ul style={{ 'listStyle': 'none', 'display': 'inline', padding: 0, margin: 0 }}>
                            {listOfVersions && listOfVersions.map((dateTime, index) => (
                                ('interval' in dateTime || 'endDate' in dateTime) ? (
                                    <li
                                        key={index}
                                        style={{ display: 'block', cursor: 'pointer' }}
                                        onClick={() => handleVersionClick(dateTime)}
                                        >
                                        - {JSON.stringify(dateTime, null, 2)}
                                    </li>
                                ) : (
                                    <li
                                        key={index}
                                        style={{ display: 'inline', cursor: 'pointer' }}
                                        onClick={() => handleVersionClick(dateTime)}
                                        >
                                        {convertUTCstringsToLocal(dateTime).date + '-' + convertUTCstringsToLocal(dateTime).time + ', '}
                                    </li>
                                )
                            ))}
                        </ul>
                    </div>
                </div>
            }
            {selectedVersion &&
                <div style={{ display: 'flex' }}>
                    <h3>{selectedDirectory+'/'+selectedTitle+' - '+convertUTCstringsToLocal(selectedVersion).date+' '+convertUTCstringsToLocal(selectedVersion).time}</h3>
                    <button onClick={() => handleContentEditing()}>Edit Content</button>
                    <button onClick={() => setDblCheckDeleteVersion(true)}>Delete File</button>
                    {dblCheckDeleteVersion &&
                        <div>
                            <p>Are you sure?</p>
                            <button onClick={() => handleVersionDeleting(selectedDirectory,selectedTitle,selectedVersion)}>Yes</button>
                            <button onClick={() => setDblCheckDeleteVersion(false)}>No</button>
                        </div>
                    }
                </div>
            }
            { fileContent && selectedTable === 'journals' &&    
                <div
                    style={{
                        width: '90vw',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        overflow: 'auto',
                        margin: '0 auto',
                    }}
                    >
                    {fileContent}
                </div>
            }
            { fileContent && (   selectedTable === 'customInfo' || 
                                    selectedTable === 'customUI' ||
                                    selectedTable === 'inProgress') &&
                <div>
                    <div>
                        {fileContent.map((element, i) => {
                            switch (element.type) {
                                case 'soloButton':
                                    return (<button key={i} style={{ color: (element.outVal && element.outVal[0] === 'disabled') ? 'gray' : 'blacak' }}>{element.text}</button>);
                                case 'entry':
                                case 'earning':
                                case 'spending':
                                case 'subtitle':
                                    return (
                                        <div key={i} style={{ display: 'flex' }}>
                                            <p>{element.text}</p>
                                            {element.outVal 
                                                ? element.outVal.map((outValue, j) => (
                                                    <input
                                                        value={outValue}
                                                        key={i+','+j}
                                                        readOnly
                                                        />
                                                ))
                                                : <input
                                                    value={''}
                                                    key={i+',0'}
                                                    readOnly
                                                    />
                                            }
                                        </div>
                                    );
                                case 'startDate':
                                case 'startTime':
                                    return (
                                        <div key={i} style={{ display: 'flex' }}>
                                            <p>{element.text}</p>
                                            <input
                                                value={element.outVal || ''}
                                                key={i+',0'}
                                                readOnly
                                                />
                                        </div>
                                    );
                                case 'text box':
                                    return  (
                                        <div key={i} style={{ display: 'flex' }}>
                                            <p>{element.text}</p>
                                            {element.outVal
                                                ? <textarea
                                                    value={element.outVal}
                                                    readOnly
                                                    />
                                                : <textarea
                                                    value={''}
                                                    readOnly
                                                    />
                                            }
                                        </div>
                                    );
                            }
                        })}
                    </div> &&
                    <div>
                        {fileContent.map((element, i) => {
                            return (
                                <div style={{ display: 'flex' }}>
                                    {Object.keys(element).map((key) => '[' + key + ': ' + element[key] + ']')}
                                </div>
                            );
                        })}
                    </div>
                </div>

            }
            {  fileContent && ( selectedTable === 'miscDropdowns' ||
                                selectedTable === 'timeRecords' ||
                                selectedTable === 'quickNote' ||
                                selectedTable === 'resolvedEvents' ||
                                selectedTable === 'scheduledEvents' ||
                                selectedTable === 'miscObject2') &&
                <EditMiscObject selectFn={selectFn} 
                    preselectedTable={selectedTable} 
                    preselectedDir={selectedDirectory}
                    preselectedTitle={selectedTitle}
                    preselectedVersion={selectedVersion}/>
            }
        </div>
    );
}
