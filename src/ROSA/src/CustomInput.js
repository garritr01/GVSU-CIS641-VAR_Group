import React, { useState, useEffect, useRef 
} from 'react';

import {getDateString, getTimeString, chooseMostRecent, 
    convertUTCstringsToLocal, convertLocalStringsToUTC, parseDateObject,
    convertUTCObjToLocal, convertLocalObjToUTC, getCurrentDateStrings
} from './oddsAndEnds';

import { fetchDateTime, deleteEntry, fetchObject, 
    fetchFiles, saveObject, recordDateTime, newFetchObject, newSaveObject,
    newFetchDirsAndFiles
} from './generalFetch';

import { differenceInHours
} from 'date-fns';

/** Renders custom input and handles saving */
export const CustomInput = ({ printLevel, selectFn, preselectedDir, preselectedTitle, preselectedVersion, resolutionInfo, selectDirTitleAndVersion, mode }) => {

    // if preselected doesn't exist use empty string
    const selectedDir = preselectedDir || '';
    const selectedTitle = preselectedTitle || '';
    const selectedVersion = preselectedVersion || '';
    // if time change called for alter to match local time zone
    const selectedEndDateTime =
        resolutionInfo && resolutionInfo.endDate
            ? resolutionInfo.UTC
                ? convertUTCstringsToLocal({ date: resolutionInfo.endDate, time: resolutionInfo.endTime })
                : { date: resolutionInfo.endDate, time: resolutionInfo.endTime }
            : (preselectedVersion && mode === 'edit')
                ? convertUTCstringsToLocal(preselectedVersion)
                : { date: getDateString(true), time: getTimeString(true) };

    const [directory, setDirectory] = useState(selectedDir);
    const [title, setTitle] = useState(selectedTitle);
    const [outputDirectory, setOutputDirectory] = useState(
        resolutionInfo && resolutionInfo.subtitle && resolutionInfo.subtitle !== 'NA'
            ? selectedDir + '/' + selectedTitle
            : selectedDir
    );
    const [outputTitle, setOutputTitle] = useState(
        resolutionInfo && resolutionInfo.subtitle && resolutionInfo.subtitle !== 'NA'
            ? resolutionInfo.subtitle
            : selectedTitle
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
            const dateTimeIn = await fetchDateTime('timeRecords', 'Garrit', 'lastTime', 'customInfo');
            setDateTime(convertUTCstringsToLocal(dateTimeIn));
        };
        if (mode !== 'clock in' || mode !== 'resolve') {
            callFetchDateTime();
        }
        callFetchFiles();
        console.log('CustomInput mode:', mode)
        console.log('(preselections)', 'dir:', preselectedDir, 'title:', preselectedTitle, 'version:', preselectedVersion);
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

    }, [endDateTime]);

    //* Updates inputs when typing */
    const uponInputChange = (inputValue, setInputValue) => {
        setInputValue(inputValue);
    };

    const uponCustomInputChange = (inputValue, index, secondaryIndex = null) => {
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
            const files = await fetchFiles('miscDropdowns', 'Garrit');
            const mostRecent = chooseMostRecent(files, 'CustomInfo/' + outputDirectory, outputTitle);
            const dropdownObject = await fetchObject('miscDropdowns', mostRecent, 'Garrit', 'CustomInfo/' + outputDirectory, outputTitle);
            setDropdowns(dropdownObject);
        } catch (err) {
            console.error('Error fetching dropdowns:', err);
        }
    }

    /** Adds new options to dropdown menu */
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
                const response = await saveObject('miscDropdowns', dropdownsOut, mostRecent, 'Garrit', 'CustomInfo/' + outputDirectory, outputTitle);
                console.log(response);
            } else {
                const response = await saveObject('miscDropdowns', dropdownsOut, { date: getDateString(), time: getTimeString() }, 'Garrit', 'CustomInfo/' + outputDirectory, outputTitle);
                console.log(response);
            }
        } catch (err) {
            console.error('Error saving dropdowns:', err);
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
                console.log('sC', startConverted);
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
                            element.type === 'startDate' ? {
                                ...element,
                                outVal: resolutionInfo.UTC
                                    ? convertUTCstringsToLocal({ date: resolutionInfo.startDate, time: resolutionInfo.startTime }).date
                                    : resolutionInfo.startDate
                            }
                                : element.type === 'startTime' ? {
                                    ...element,
                                    outVal: resolutionInfo.UTC
                                        ? convertUTCstringsToLocal({ date: resolutionInfo.startDate, time: resolutionInfo.startTime }).time
                                        : resolutionInfo.startTime
                                }
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
                            element.type === 'startDate' ? {
                                ...element,
                                outVal: resolutionInfo.UTC
                                    ? convertUTCstringsToLocal({ date: resolutionInfo.startDate, time: resolutionInfo.startTime }).date
                                    : resolutionInfo.startDate
                            }
                                : element.type === 'startTime' ? {
                                    ...element,
                                    outVal: resolutionInfo.UTC
                                        ? convertUTCstringsToLocal({ date: resolutionInfo.startDate, time: resolutionInfo.startTime }).time
                                        : resolutionInfo.startTime
                                }
                                    : { ...element, outVal: [''] })));
                    } catch (err) {
                        console.error('Error fetching UI:', err);
                    }
                }
            } catch (err) {
                console.log('2. Error fetching resolution info:', err);
            }
        } else if (mode === 'record' || mode === 'clock in') {
            console.log("fetching custom" + versionType + "'s", directory, 'UI from', title, 'v', version);
            try {
                const UIinput = await fetchObject(versionType === 'UI' ? 'customUI' : 'customInfo', version, 'Garrit', directory, title);
                if (versionType == "Info") {
                    setEndDateTime(convertUTCstringsToLocal(version));
                }
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
                    element.type === 'startDate' ? { ...element, outVal: mode === 'record' ? dateTime.date : getDateString(true) }
                        : element.type === 'startTime' ? { ...element, outVal: mode === 'record' ? dateTime.time : getTimeString(true) }
                            : (element.type.includes('spending') || element.type.includes('earning')) ? { ...element, outVal: [''] }
                                : { ...element, outVal: element.outVal ? element.outVal : [''] })));
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
                        : element.type === 'startTime' ? { ...element, outVal: convertUTCstringsToLocal({ date: startDateIn.outVal, time: startTimeIn.outVal }).time }
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
            } else if (!override && mode !== 'clock in' && differenceInHours(localEndDateObject, localStartDateObject) > 12) {
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
    const entryBox = (option, i) => {
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
                {output[i].outVal.map((outVal, j) => (
                    <div key={i + '-' + j}>
                        <input
                            key={j}
                            value={outVal}
                            list={option.text + 'List'}
                            onChange={(e) => uponCustomInputChange(e.target.value, i, j)}
                        />
                        <button onClick={() => removeElements(output[i].group, i, j)}>-</button>
                        {dropdowns[option.text] &&
                            <datalist id={option.text + 'List'}>
                                {dropdowns[option.text].map((choice, index) =>
                                    <option key={index} value={choice} />
                                )}
                            </datalist>
                        }
                    </div>
                ))}
                <button onClick={() => addElements(output[i].group, i)}>+</button>
            </div>
        );
    }

    const addElements = (tag, index) => {
        const updatedOutput = output.map((element, elementIndex) => (
            ((tag === element.group && tag !== 'NA') || (index === elementIndex))
                ? { ...element, outVal: [...element.outVal, ''] }
                : element
        ));
        setOutput(updatedOutput);
    }

    const removeElements = (tag, index, secondaryIndex) => {
        const updatedOutput = output.map((element, elementIndex) => {
            if ((tag === element.group && tag !== 'NA') || (index === elementIndex)) {
                console.log(element.outVal);
                const outValCopy = element.outVal
                outValCopy.splice(secondaryIndex, 1);
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
            {mode === 'record' &&
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
                                onChange={(e) => setEndDateTime({ ...endDateTime, time: e.target.value })}
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
                {(mode !== 'edit' || convertLocalStringsToUTC(endDateTime).time !== preselectedVersion.time) &&
                    <button onClick={() => closeCustomInput(true, true)}>Submit</button>
                }
                {mode === 'clock out' &&
                    <button onClick={() => closeCustomInput(true, false)}>Submit without Clocking Out</button>
                }
                {mode === 'edit' &&
                    <button onClick={async () => {
                        await removeLastEntry();
                        closeCustomInput(true, true);
                    }}
                    >
                        Submit and Remove {preselectedDir}/{preselectedTitle} v
                        {convertUTCstringsToLocal(preselectedVersion).date}-{convertUTCstringsToLocal(preselectedVersion).time}
                    </button>
                }
                {versionType === 'Info' &&
                    <button onClick={async () => {
                        await removeLastEntry();
                        closeCustomInput(true, true);
                    }}
                    >
                        Submit and Remove {directory}/{title} v
                        {convertUTCstringsToLocal(version).date}-{convertUTCstringsToLocal(version).time}
                    </button>
                }
                <button onClick={() => closeCustomInput(false, true)}>Cancel</button>
            </div>
        </div>
    );
}

export const NewCustomInput = ({ printLevel, preselectedObj }) => {

    // Get object with local month, day, year, hour, minute
    const time = getCurrentDateStrings(true);

    // Determines whether editing or loading
    const [tableToUse, setTableToUse] = useState(preselectedObj.table || 'customUI');
    // Contain entire custom input object
    const [obj, setObj] = useState(preselectedObj);
    // Contain directories and files within 'customInfo' table
    const [dirs, setDirs] = useState([]);
    const [fileInfo, setFileInfo] = useState([]);
    // Contain information about loaded file
    const [loaded, setLoaded] = useState({ dir: '', filename: '', dateTime: { date: '', time: '' } });
    // object contains short output
    const [result, setResult] = useState('');
    // object designed to output errors
    const [infoCheck, setInfoCheck] = useState([]);
    // info detail toggle
    const [detailToggle, setDetailToggle] = useState(false);
    // contain start date and end date
    const [start, setStart] = useState(time);
    const [end, setEnd] = useState(time);

    useEffect(() => {
        getDirsAndFiles();
    },[tableToUse]);

    /** Update object property with inputValue */
    const uponInputChange = (inputValue, prop) => {
        setObj(prevState => ({ ...prevState, [prop]: inputValue }));
    }

    /** Update object property (which is also an object) with inputValue */
    const uponObjectInputChange = (inputValue, prop) => {
        let parsedObj;
        // Attempt to parse and notify upon uncaught failure
        try {
            parsedObj = JSON.parse(inputValue);
        } catch (err) {
            if (prop === 'dateTime') {
                parsedObj = { date: '', time: '' };
            } else {
                console.error("No catch for unparseable object!");
            }
        }
        setObj(prevState => ({ ...prevState, [prop]: parsedObj }));
    }

    /** Gets dirs and files where directories is all unqiue directories and
    * files is an array of objects containing dateTime, directory, and filename
    */
    const getDirsAndFiles = async () => {
        try {
            const response = await newFetchDirsAndFiles(tableToUse, obj.userID);
            if (response.truth) {
                setFileInfo(response.files);
                setDirs(response.dirs);
            } else {
                console.error(`${response.status}: ${response.msg}`);
            }
        } catch (err) {
            console.error('Error fetching customUI dirs and files:', err);
        }
    };

    /** Get payload and options given relevant arguments */
    const getPayload = async () => {
        try {
            const response = await newFetchObject({ ...obj, table: tableToUse });

            if (!response.truth) {
                console.error(`Error getting ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time}): ${response.msg}`)
            } else {
                setLoaded({ dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime });
                setObj({
                    ...obj,
                    options: response.options,
                    payload: response.payload
                });
            }
        } catch {
            console.error('Error getting content with ', obj);
        }
    }

    /** Save new UI or overwrite UI */
    const saveCustomRecord = async (overwrite) => {

        if (overwrite) {
            const response = await newSaveObject(obj);
            if (response.truth) {
                if (response.status === 200) {
                    setResult('File updated.');
                    setInfoCheck([`Updated content of ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time}) in ${obj.table}.`]);
                    getDirsAndFiles();
                } else {
                    setResult('Unknown success.');
                    setInfoCheck([`Operated on ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time}) in ${obj.table}.`]);
                    console.error('Updated???', response);
                }
            } else {
                setResult('Failed to update.');
                setInfoCheck([`Failed to update content of ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time}) in ${obj.table}.`]);
                console.error(`Failed to update content of ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time}) in ${obj.table}.`, response);
            }
        } else {
            const objToSave = { ...obj, dateTime: { date: getDateString(), time: getTimeString() } };
            const response = await newSaveObject(objToSave);
            if (response.truth) {
                if (response.status === 201) {
                    setResult('File saved.');
                    setInfoCheck([`Operated on ${objToSave.dir}/${objToSave.filename} (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in ${objToSave.table}.`]);
                    getDirsAndFiles();
                } else {
                    setResult('Unknown success.');
                    setInfoCheck([`Saved content of ${objToSave.dir}/${objToSave.filename} (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in ${objToSave.table}.`]);
                    console.error('Updated???', response);
                }
            } else {
                setResult('Failed to save.');
                setInfoCheck([`Failed to save content of ${objToSave.dir}/${objToSave.filename} (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in ${objToSave.table}.`]);
                console.error(`Failed to save content of ${objToSave.dir}/${objToSave.filename} (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in ${objToSave.table}.`, response);
            }
        }
        // Reset version so it must be loaded to edit
        setObj(prevState => ({ ...prevState, dateTime: 'new' }));
    }    

    return (
        <div className="mainContainer">
            <button onClick={() => console.log(obj)}>Log Object</button>
            <button 
                style={{ color: tableToUse === 'customUI' ? 'gray' : 'black' }}
                onClick={() => setTableToUse('customUI')}>
                Use UIs
            </button>
            <button 
                style={{ color: tableToUse === 'record' ? 'gray' : 'black' }}
                onClick={() => setTableToUse('record')}>
                Use Records
            </button>
            <div className="flexDivTable">
                {/** Directory row */}
                <div className="flexDivRows">
                    <p className="flexDivColumns">Directory:</p>
                    <input
                        className="flexDivColumns"
                        name='directory box'
                        list='dirs'
                        value={obj.dir}
                        onChange={(e) => uponInputChange(e.target.value, 'dir')}
                    />
                    <datalist id='dirs'>
                        {dirs.length > 0 &&
                            [...new Set(
                                dirs.map((dir) => {
                                    if (obj.dir === '') {
                                        return dir.split('/')[0];
                                    } else if (dir.split('/').slice(0, obj.dir.split('/').length).join('/') === obj.dir) {
                                        return dir.split('/').slice(0, obj.dir.split('/').length + 1).join('/');
                                    } else {
                                        return null;
                                    }
                                })
                            )].map((name, index) => (
                                <option key={'dir' + index} value={name} />
                            ))}
                    </datalist>
                </div>
                {/** Filename row */}
                <div className="flexDivRows">
                    <p className="flexDivColumns">Filename:</p>
                    <input
                        className="flexDivColumns"
                        name='filename box'
                        list='filenames'
                        value={obj.filename}
                        onChange={(e) => uponInputChange(e.target.value, 'filename')}
                    />
                    <datalist id='filenames'>
                        {fileInfo.length > 0 &&
                            fileInfo.filter((file) => file.directory === obj.dir
                            ).filter((obj, index, self) =>
                                index === self.findIndex((o) => o.filename === obj.filename)
                            ).map((file, index) => (
                                <option key={'filename' + index} value={file.filename} />
                            ))}
                    </datalist>
                </div>
                {/** Version row */}
                <div className="flexDivRows">
                    <p className="flexDivColumns">Version:</p>
                    <select
                        value={JSON.stringify(obj.dateTime)}
                        onChange={(e) => uponObjectInputChange(e.target.value, 'dateTime')}>
                        <option key={'new'} value={'new'}>New</option>
                        { // Create option for each version and set to last saved in database initially
                            fileInfo.length > 0 && fileInfo.slice().reverse().map((file, index) => {
                                if (file.filename === obj.filename && file.directory === obj.dir) {
                                    return (
                                        <option key={'version' + index} value={JSON.stringify(file.dateTime)}>
                                            {convertUTCstringsToLocal(file.dateTime).date + '-' + convertUTCstringsToLocal(file.dateTime).time}
                                        </option>
                                    );
                                } else {
                                    return null;
                                }
                            })
                        }
                    </select>
                </div>
            </div>
            { // Display issues or success
                detailToggle
                    ? <div className="bulletList" onClick={() => setDetailToggle(false)} style={{ cursor: 'pointer' }}>
                        {
                            infoCheck.map((item, i) => (
                                <p key={'userReport' + i}>{item}</p>
                            ))
                        }
                    </div>
                    : <p onClick={() => setDetailToggle(true)} style={{ cursor: 'pointer' }}>{result}</p>
            }
            {/** Button row (saving, loading, resetting) */}
            <div className="flexDivRows">
                { // Render load content button if all necessary fields are filled
                    obj.dir && obj.filename && obj.dateTime.date ?
                        <div>
                            <button onClick={() => getPayload()}>Load Content</button>
                        </div>
                        :
                        <div>
                            <button style={({ color: 'gray' })}>Load Content</button>
                        </div>
                } { // Render overwrite button if using previous file version
                    obj.dir === loaded.dir &&
                        obj.filename === loaded.filename &&
                        obj.dateTime.date === loaded.dateTime.date &&
                        obj.dateTime.time === loaded.dateTime.time
                        ? <div>
                            <button style={({ color: 'gray' })}>Save</button>
                            <button onClick={() => saveCustomRecord(true)}>Overwrite</button>
                        </div>
                        : <div>
                            <button onClick={() => saveCustomRecord(false)}>Save</button>
                            <button style={({ color: 'gray' })}>Overwrite</button>
                        </div>
                } { // Render empty content button if payload || options
                    (obj.payload || obj.options) &&
                    <button onClick={() => setObj(prevState => ({ ...prevState, options: null, payload: null }))}>
                        Empty Content
                    </button>
                }
            </div>
            { /** Display customized info interface */
                obj.payload &&
                    <div>
                        <UI UI={obj.payload} setObj={setObj} />
                        <div className="flexDivTable">
                            { /** Display start date inputs */
                                obj.options?.startInfo === true &&
                                    <DateInput date={start} setDate={setStart} preText={'Start'} />
                            } { /** Display end date inputs */
                                    <DateInput date={end} setDate={setEnd} preText={'End'} />
                            }
                        </div>
                    </div>
            } 
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
                    : <p>Unrecognized element {JSON.stringify(element)}</p>
                ))
            }
        </div>
    );
}

/** HTML element for editing start and end date/time of schedule */
const DateInput = ({ date, setDate, preText }) => {

    /** Update date property with inputValue */
    const uponDateChange = (inputValue, prop) => {
        setDate(prevState => ({ ...prevState, [prop]: inputValue }));
    }

    return (
        <div className="flexDivRows">
            <p className="flexDivColumns">{preText}:</p>
            <input
                className="twoDigitInput flexDivColumns"
                name='month1 box'
                value={date.month}
                onChange={(e) => uponDateChange(e.target.value, 'month')}
            />
            <p className="flexDivColumns">/</p>
            <input
                className="twoDigitInput"
                name='day1 box'
                value={date.day}
                onChange={(e) => uponDateChange(e.target.value, 'day')}
            />
            <p className="flexDivColumns">/</p>
            <input
                className="fourDigitInput flexDivColumns"
                name='year1 box'
                value={date.year}
                onChange={(e) => uponDateChange(e.target.value, 'year')}
            />
            <p className="flexDivColumns">at</p>
            <input
                className="twoDigitInput flexDivColumns"
                name='hour1 box'
                value={date.hour}
                onChange={(e) => uponDateChange(e.target.value, 'hour')}
            />
            <p className="flexDivColumns">:</p>
            <input
                className="twoDigitInput flexDivColumns"
                name='minute1 box'
                value={date.minute}
                onChange={(e) => uponDateChange(e.target.value, 'minute')}
            />
        </div>
    );
}