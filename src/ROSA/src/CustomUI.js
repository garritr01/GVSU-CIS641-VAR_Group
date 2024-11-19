import React, { useState, useEffect, useRef 
} from 'react';

import {getDateString, getTimeString, chooseMostRecent, formatDateToObject,
    convertUTCstringsToLocal, convertLocalStringsToUTC, getCurrentDateStrings,
    getWeekdayString, convertLocalObjToUTC, convertUTCObjToLocal
} from './oddsAndEnds';

import { deleteEntry, fetchObject, fetchFiles, fetchDirsAndFiles, saveObject, 
    newSaveObject, newFetchObject, newFetchDirsAndFiles
} from './generalFetch';

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
    const [noteInfo, setNoteInfo] = useState({ event: '', note: '', dueDate: getDateString(true), urgency: '' });
    const [textChoices, setTextChoices] = useState([]);
    const [dropdownDateTime, setDropDownDateTime] = useState(null);
    const [subtitleList, setSubtitleList] = useState(null);

    useEffect(() => {
        callFetchFiles();
        console.log('CustomUI mode:', mode);
    }, [])

    useEffect(() => {

    }, [customUI, editIndex, groupIndex]);

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
    }, [repeatInfo]);

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
            const files = await fetchFiles('miscDropdowns', 'Garrit');
            const file = files.find((file) => file.directory === 'CustomUI' && file.title === 'textDropdown');
            const dropdown = await fetchObject('miscDropdowns', file.dateTime, 'Garrit', file.directory, file.title);
            setTextChoices(dropdown);
            setDropDownDateTime(file.dateTime);
        } catch (err) {
            console.log('Error fetching text dropdown:', err);
        }
    }

    const callFetchObject = async () => {
        try {
            const UIinput = await fetchObject('customUI',
                version, 'Garrit', directory, title);
            if (UIinput.find((element) => element.type === 'subtitle')) {
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
                } catch (err) {
                    console.log('Error saving quick note:', err);
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
                    }
                })
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
                    await Promise.all(updatedUI.map((element) => { dropdownCopy.push(element.text); console.log('dd', element.text) }));
                    const newDropdown = Array.from(new Set(dropdownCopy));
                    const response = await saveObject('miscDropdowns',
                        newDropdown, dropdownDateTime, 'Garrit', 'CustomUI', 'textDropdown');
                    console.log(response)
                } catch (err) {
                    console.error('Error updating dropdowns:', err);
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
                        <option key={index} value={choice} />
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
            {subtitleList &&
                <datalist id='subtitles'>
                    {subtitleList.map((subtitle, index) => (
                        <option key={index} value={subtitle} />
                    ))}
                </datalist>
            }
            {repeatType === 'specifiedSplit' ? (
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
                            ? setRepeatInfo([...repeatInfo, repeatInfoElement]) : null)}
                        style={{ color: (repeatInfoElement.UTC !== 'none' ? 'black' : 'gray') }}
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
                    {repeatType !== 'specifiedDates' &&
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
            {mode === 'schedule' &&
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
            {mode === 'note' &&
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
                            onChange={(e) => setNoteInfo({ ...noteInfo, urgency: e.target.value })}
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
                                    <p onClick={() => handleGroupClick(index, 'NA')}>{'Group: ' + element.group}</p>
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
                onClick={() => closeCustomUI(true, true)}
            >
                Create UI
            </button>
            <button onClick={() => closeCustomUI(false, false)}>
                Return to Main
            </button>
        </div>
    );
}

/** Interface for creating UIs to use in CustomInput */
export const NewCustomUI = ({ printLevel, preselectedObj }) => {
    
    // Get object with local month, day, year, hour, minute
    const time = getCurrentDateStrings(true);

    // Use object
    const [obj, setObj] = useState(preselectedObj);
    // Contain loaded dir, filename, and version
    const [loaded, setLoaded] = useState({ dir: '', filename: '', dateTime: { date: '', time: '' } });
    // Info for dropdown menus
    const [dirs, setDirs] = useState([]);
    const [fileInfo, setFileInfo] = useState([]);
    // Toggle schedule UI
    const [scheduleToggle, setScheduleToggle] = useState(false);
    // Contain repeat type temporarily
    const [repeatType, setRepeatType] = useState('');
    // Used to determine whether value is absolute or subject to time zones (true -> absolute)
    const [local, setLocal] = useState(false);
    // Contain date being input for later conversion to object (2 for start and end if necessary)
    const [date1, setDate1] = useState(time);
    const [date2, setDate2] = useState(time);
    // Contain effective date being input for later conversion to object
    const [startDate, setStartDate] = useState(time);
    const [endDate, setEndDate] = useState(time);
    // repeatInfo is only used by weekly to specify which day and specRpt to specify how many days before repeating
    const [repeatInfo, setRepeatInfo] = useState('1');
    // elementInfo contains the text to show describing the input
    const [elementInfo, setElementInfo] = useState({ type: '', label: '', choices: null, group: 0 });
    // object contains short output
    const [result, setResult] = useState('');
    // object designed to output errors
    const [infoCheck, setInfoCheck] = useState([]);
    // info detail toggle
    const [detailToggle, setDetailToggle] = useState(false);

    /** Set table to 'customUI' upon load
    * Set options.startInfo to false if DNE
    * and get existing dirs, files and versions
    */
    useEffect(() => {
        setObj(prevState => ({ ...prevState, table: 'customUI' }));
        if (!obj.options || !obj.options.startInfo) {
            setObj(prevState => ({ 
                ...prevState, 
                options: { ...prevState.options, startInfo: false } 
            }));
        }
        getDirsAndFiles();
    }, []);

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
            const response = await newFetchDirsAndFiles('customUI', obj.userID);
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
            const response = await newFetchObject(obj);
            
            if (!response.truth) {
                console.error(`Error getting ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time}): ${response.msg}`)
            } else {
                setLoaded({ dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime });
                const newObj = {
                    ...obj,
                    options: response.options,
                    payload: response.payload
                };
                const newOptions = convertScheduleIn(newObj.options);
                setObj({ ...newObj, options: newOptions });
            }
        } catch {
            console.error('Error getting content with ', obj);
        }
    }

    /** Convert all options.schedules to to local if option.schedule[i].local === false
     * setObject
     */
    const convertScheduleIn = (newOptions) => {
        if (newOptions) {
            if (newOptions.schedule) {
                const updatedOptions = {
                    ...newOptions,
                    schedule: newOptions.schedule.map((schedule) => {
                        // If `schedule.local` is false, convert times to UTC
                        if (!schedule.local) {
                            // Convert start and end to UTC with hour and minute set to midnight
                            const startLocal = convertUTCObjToLocal(schedule.start);
                        
                            const endLocal = convertUTCObjToLocal(schedule.end);
                        
                            const effectiveStartLocal = convertUTCObjToLocal(schedule.effectiveStart);
                        
                            let effectiveEndLocal;
                            if (schedule.effectiveEnd.month !== 'NA') {
                                effectiveEndLocal = convertUTCObjToLocal(schedule.effectiveEnd);
                            } else {
                                effectiveEndLocal = schedule.effectiveEnd;
                            }
                        
                            return {
                                ...schedule,
                                start: startLocal,
                                end: endLocal,
                                effectiveStart: effectiveStartLocal,
                                effectiveEnd: effectiveEndLocal
                            };
                        } else {
                            // If `schedule.local` is true, leave the schedule unchanged
                            return {
                                ...newOptions,
                            };
                        }
                    })
                }
                return updatedOptions;
            } else {
                return newOptions;
            }
        } else {
            return null;
        }
    }

    /** Convert all options.schedules to UTC if option.schedule[i].local === false 
     * return object
    */
    const convertScheduleOut = () => {
        if (obj.options) {
            if (obj.options.schedule) {
                const updatedObj = {
                    ...obj,
                    options: {
                        ...obj.options,
                        schedule: obj.options.schedule.map((schedule) => {
                            // If `schedule.local` is false, convert times to UTC
                            if (!schedule.local) {
                                // Convert start and end to UTC with hour and minute set to midnight
                                const startUTC = convertLocalObjToUTC(schedule.start);
                            
                                const endUTC = convertLocalObjToUTC(schedule.end);
                            
                                // Conditionally convert effectiveStart and effectiveEnd only if the month is not 'NA'
                                let effectiveStartUTC = schedule.effectiveStart;
                                let effectiveEndUTC = schedule.effectiveEnd;
                            
                                if (schedule.effectiveStart.month !== 'NA') {
                                    effectiveStartUTC = convertLocalObjToUTC(effectiveStartUTC);
                                }
                            
                                if (schedule.effectiveEnd.month !== 'NA') {
                                    effectiveEndUTC = convertLocalObjToUTC(effectiveEndUTC);
                                }
                            
                                return {
                                    ...schedule,
                                    start: startUTC,
                                    end: endUTC,
                                    effectiveStart: effectiveStartUTC,
                                    effectiveEnd: effectiveEndUTC
                                };
                            } else {
                                // If `schedule.local` is true, leave the schedule unchanged
                                return {
                                    ...schedule,
                                };
                            }
                        })
                    }
                };
                return updatedObj;
            } else {
                return obj;
            }
        } else {
            return obj;
        }
    }

    /** Save new UI or overwrite UI */
    const saveCustomUI = async (overwrite) => {

        const outObj = convertScheduleOut();

        if (overwrite) {
            const response = await newSaveObject(outObj);
            if (response.truth) {
                if (response.status === 200) {
                    setResult('File updated.');
                    setInfoCheck([`Updated content of ${outObj.dir}/${outObj.filename} (${outObj.dateTime.date}-${outObj.dateTime.time}) in ${outObj.table}.`]);
                    getDirsAndFiles();
                } else {
                    setResult('Unknown success.');
                    setInfoCheck([`Operated on ${outObj.dir}/${outObj.filename} (${outObj.dateTime.date}-${outObj.dateTime.time}) in ${outObj.table}.`]);
                    console.error('Updated???',response);
                }
            } else {
                setResult('Failed to update.');
                setInfoCheck([`Failed to update content of ${outObj.dir}/${outObj.filename} (${outObj.dateTime.date}-${outObj.dateTime.time}) in ${outObj.table}.`]);
                console.error(`Failed to update content of ${outObj.dir}/${outObj.filename} (${outObj.dateTime.date}-${outObj.dateTime.time}) in ${outObj.table}.`,response);
            }
        } else {
            const objToSave = { ...outObj, dateTime: { date: getDateString(), time: getTimeString() } };
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

    /** Checks that schedule information is correct number of characters and only digits 
     * input order: ['start', 'end', 'effective start', 'effective end']
    */
    const checkObjValidity = (dates) => {

        const names = ['start', 'end', 'effective start', 'effective end'];

        setInfoCheck([]);
        let returnTruth = true;
        dates.forEach((item, i) => {
            if (!/^\d{2}$/.test(item.month) && !(item.month === 'NA' && 'effective end' === names[i])) {
                console.log('names',names[i])
                setInfoCheck(prevState => [...prevState, `Schedule ${names[i]} month is not two-digit (${item.month})`]);
                returnTruth = false;
            } if (!/^\d{2}$/.test(item.day) && !(item.day === 'NA' && 'effective end' === names[i])) {
                setInfoCheck(prevState => [...prevState, `Schedule ${names[i]} day is not two-digit (${item.day})`]);
                returnTruth = false;
            } if (!/^\d{4}$/.test(item.year) && !(item.year === 'NA' && 'effective end' === names[i])) {
                setInfoCheck(prevState => [...prevState, `Schedule ${names[i]} year is not four-digit (${item.year})`]);
                returnTruth = false;
            } if (!/^\d{2}$/.test(item.hour) && !(item.hour === 'NA' && 'effective end' === names[i])) {
                setInfoCheck(prevState => [...prevState, `Schedule ${names[i]} hour is not two-digit (${item.hour})`]);
                returnTruth = false;
            } if (!/^\d{2}$/.test(item.minute) && !(item.minute === 'NA' && 'effective end' === names[i])) {
                setInfoCheck(prevState => [...prevState, `Schedule ${names[i]} minute is not two-digit (${item.minute})`]);
                returnTruth = false;
            }
        });

        if (returnTruth) {
            setResult('Schedule applied.')
        } else {
            setResult('Schedule not applied.')
        }

        return returnTruth;
    }

    /** Add StartEndInput content to obj.options.schedule */
    const scheduleIt = () => {

        // quit if invalid object
        if (!checkObjValidity([date1, date2, startDate, endDate])) {return}

        // Record save success and details
        setResult('Scheduled.');
        setInfoCheck([
            `repeat: ${repeatType}`,
            repeatType === 'specRpt' 
                ? `days between: ${repeatInfo}`
                : repeatType === 'weekly'
                ? `repeats each ${getWeekdayString(parseInt(repeatInfo))}`
                : 'no additional repeat information',
            local
                ? 'No conversions'
                : 'Held as UTC and converted to local for use',
            `Initial start: ${date1.month}/${date1.day}/${date1.year} - ${date1.hour}:${date1.minute}`,
            `Initial end: ${date2.month}/${date2.day}/${date2.year} - ${date2.hour}:${date2.minute}`,
            `Effective from ${startDate.month}/${startDate.day}/${startDate.year} - ${startDate.hour}:${startDate.minute}
            until ${endDate.month}/${endDate.day}/${endDate.year} - ${endDate.hour}:${endDate.minute}`
        ])

        // Format date properties to ensure two digits for day, month, hour, and minute, and four digits for year
        const formatDate = (dateObj) => {
            return {
                day: String(dateObj.day).padStart(2, '0'),
                month: String(dateObj.month).padStart(2, '0'),
                year: dateObj.year !== 'NA' ? String(dateObj.year).padStart(4, '0') : dateObj.year,
                hour: String(dateObj.hour).padStart(2, '0'),
                minute: String(dateObj.minute).padStart(2, '0')
            };
        };

        // Create new formatted variables for start, end, effectiveStart, and effectiveEnd
        const formattedStart = formatDate(date1);
        const formattedEnd = formatDate(date2);
        const formattedEffectiveStart = formatDate(startDate);
        const formattedEffectiveEnd = formatDate(endDate);

        // Create the newSchedule object with formatted date objects
        const newSchedule = {
            repeatType: repeatType,
            repeatInfo: repeatInfo,
            start: formattedStart,
            end: formattedEnd,
            effectiveStart: formattedEffectiveStart,
            effectiveEnd: formattedEffectiveEnd,
            local: local
        };

        setObj(prevState => ({
            ...prevState,
            options: {
                ...prevState.options,
                schedule: prevState.options && prevState.options.schedule
                    ? [...prevState.options.schedule, newSchedule]
                    : [newSchedule]
            }
        }));
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
            <button onClick={() => console.log(obj)}>obj</button>
            <button onClick={() => console.log(dirs)}>dir</button>
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
                            [...new Set (
                                dirs.map((dir) => {
                                    if (obj.dir === '') {
                                        return dir.split('/')[0];
                                    } else if (dir.split('/').slice(0, obj.dir.split('/').length).join('/') === obj.dir) {
                                        return dir.split('/').slice(0, obj.dir.split('/').length + 1).join('/');
                                    } else {
                                        return null;
                                    }
                                })
                            )]
                            .map((name, index) => (
                                <option key={'dir'+index} value={name} />
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
                                <option key={'filename'+index} value={file.filename} />
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
                                        <option key={'version'+index} value={JSON.stringify(file.dateTime)}>
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
                ?    <div className="bulletList" onClick={() => setDetailToggle(false)} style={{ cursor: 'pointer' }}>
                        {
                            infoCheck.map((item, i) => (
                                <p key={'userReport'+i}>{item}</p>
                            ))
                        }
                    </div>
                :   <p onClick={() => setDetailToggle(true)} style={{ cursor: 'pointer' }}>{result}</p>
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
                        ?   <div>
                                <button style={({ color: 'gray' })}>Save</button>
                                <button onClick={() => saveCustomUI(true)}>Overwrite</button>
                            </div>
                        :   <div> 
                                <button onClick={() => saveCustomUI(false)}>Save</button>
                                <button style={({ color: 'gray' })}>Overwrite</button>
                            </div>
                } { // Render empty content button if payload || options
                    (obj.payload || obj.options) &&
                        <button onClick={() => setObj(prevState => ({ ...prevState, options: null, payload: null}))}>
                            Empty Content
                        </button>
                }
            </div>
            {/** Initial Scheduling Row */}
            <div className="flexDivRows">
                    <button 
                        className="flexDivColumns" 
                        onClick={() => setScheduleToggle(!scheduleToggle)}>
                            Toggle Schedule
                    </button>
                {/** Schedule repeat options */
                    scheduleToggle &&
                        <div>
                            <p>Repeat Type:</p>
                            <button className="moreLink" onClick={() => {setRepeatType('none')}}>
                                Specific
                                <span className="more bulletList">
                                    <h3>Specific Behavior</h3>
                                    <p>Start and end define one event</p>
                                </span>
                            </button>
                            <button className="moreLink" onClick={() => {setRepeatType('specRpt')}}>
                                Specific Repeat
                                <span className="more bulletList">
                                    <h3>Specific Repeat Behavior</h3>
                                    <p>Start and end serve as initial date</p>
                                    <p>Events will repeat the specified number of days apart</p>
                                    <p>Events will repeat in the past and future within the inclusive bounds of effective start and end</p>
                                </span>
                            </button>
                            <button className="moreLink" onClick={() => {setRepeatType('daily')}}>
                                Daily
                                <span className="more bulletList">
                                    <h3>Daily Repeat Behavior</h3>
                                    <p>Start and end are only relevant for the starting time and time span</p>
                                    <p>If the start and end dates are different events will span multiple days</p>
                                    <p>Events will repeat each day in the past and future within the inclusive bounds of effective start and end</p>
                                </span>
                            </button>
                            <button className="moreLink" onClick={() => {setRepeatType('weekly'); setRepeatInfo('1');}}>
                                Weekly
                                <span className="more bulletList">
                                    <h3>Weekly Repeat Behavior</h3>
                                    <p>Start and end are only relevant for the starting time and time span</p>
                                    <p>If the start and end date are different each event will span multiple days and the start date will use the given day of the week</p>
                                    <p>Events will repeat each week in the past and future within the inclusive bounds of effective start and end</p>
                                </span>
                            </button>
                            <button className="moreLink" onClick={() => {setRepeatType('monthly')}}>
                                Monthly
                                <span className="more bulletList">
                                    <h3>Monthly Repeat Behavior</h3>
                                    <p>Start and end are only relevant for the day, and time</p>
                                    <p>If the start and end date are different each event will span multiple days</p>
                                    <p>If day used is not in a certain month the last day of the month will be used</p>
                                    <p>Events will repeat each month in the past and future within the bounds of effective start and end</p>
                                </span>
                            </button>
                            <button className="moreLink" onClick={() => {setRepeatType('annually')}}>
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
            </div>
            {/** Display relevant inputs for repeatType */
                scheduleToggle && (
                    repeatType === 'none' ? (
                        <div>
                            <p className="flexDivRows">Scheduled Time</p>
                            <StartEndInput 
                                local={local} setLocal={setLocal} 
                                date1={date1} setDate1={setDate1} 
                                date2={date2} setDate2={setDate2}/>
                            <button onClick={() => scheduleIt()}>Schedule it!</button>
                        </div>
                    ) : repeatType === 'specRpt' ? (
                        <div>
                            <p className="flexDivRows">Scheduled Time</p>
                            <StartEndInput
                                local={local} setLocal={setLocal}
                                date1={date1} setDate1={setDate1}
                                date2={date2} setDate2={setDate2} />
                            <div className="flexDivRows">
                                <p>Repeat every&nbsp;</p>
                                <input
                                    className="twoDigitInput"
                                    name='specific repeat box'
                                    value={repeatInfo}
                                    onChange={(e) => setRepeatInfo(e.target.value)}
                                />
                                <p>&nbsp;days</p>
                            </div>
                            <EffectiveTimeRange 
                                end={date2} repeatType={repeatType}
                                startDate={startDate} setStartDate={setStartDate}
                                endDate={endDate} setEndDate={setEndDate}/>
                            <button onClick={() => scheduleIt()}>Schedule it!</button>
                        </div>
                    ) : repeatType === 'daily' ? (
                        <div>
                            <p className="flexDivRows">Scheduled Time</p>
                            <StartEndInput
                                local={local} setLocal={setLocal}
                                date1={date1} setDate1={setDate1}
                                date2={date2} setDate2={setDate2} />
                            <EffectiveTimeRange 
                                end={date2} repeatType={repeatType}
                                startDate={startDate} setStartDate={setStartDate}
                                endDate={endDate} setEndDate={setEndDate} />
                            <button onClick={() => scheduleIt()}>Schedule it!</button>
                        </div>
                    ) : repeatType === 'weekly' ? (
                        <div>
                            <p className="flexDivRows">Scheduled Time</p>
                            <StartEndInput
                                local={local} setLocal={setLocal}
                                date1={date1} setDate1={setDate1}
                                date2={date2} setDate2={setDate2} />
                            <div className="flexDivRows">
                                <p>Repeat every&nbsp;</p>
                                <select
                                    name='weekly repeat box'
                                    value={repeatInfo}
                                    onChange={(e) => setRepeatInfo(e.target.value)}>
                                        <option key={'0'} value={'0'}>Sunday</option>
                                        <option key={'1'} value={'1'}>Monday</option>
                                        <option key={'2'} value={'2'}>Tuesday</option>
                                        <option key={'3'} value={'3'}>Wednesday</option>
                                        <option key={'4'} value={'4'}>Thursday</option>
                                        <option key={'5'} value={'5'}>Friday</option>
                                        <option key={'6'} value={'6'}>Saturday</option>
                                </select>
                            </div>
                            <EffectiveTimeRange 
                                end={date2} repeatType={repeatType}
                                startDate={startDate} setStartDate={setStartDate}
                                endDate={endDate} setEndDate={setEndDate} />
                            <button onClick={() => scheduleIt()}>Schedule it!</button>
                        </div>
                    ) : repeatType === 'monthly' ? (
                        <div>
                            <p className="flexDivRows">Scheduled Time</p>
                            <StartEndInput
                                local={local} setLocal={setLocal}
                                date1={date1} setDate1={setDate1}
                                date2={date2} setDate2={setDate2} />
                            <EffectiveTimeRange 
                                end={date2} repeatType={repeatType}
                                startDate={startDate} setStartDate={setStartDate}
                                endDate={endDate} setEndDate={setEndDate} />
                            <button onClick={() => scheduleIt()}>Schedule it!</button>
                        </div>
                    ) : repeatType === 'annually' ? (
                        <div>
                            <p className="flexDivRows">Scheduled Time</p>
                            <StartEndInput
                                local={local} setLocal={setLocal}
                                date1={date1} setDate1={setDate1}
                                date2={date2} setDate2={setDate2} />
                            <EffectiveTimeRange 
                                end={date2} repeatType={repeatType}
                                startDate={startDate} setStartDate={setStartDate}
                                endDate={endDate} setEndDate={setEndDate} />
                            <button onClick={() => scheduleIt()}>Schedule it!</button>
                        </div>
                    ) : (null)
                )
            }
            {/** Only show Scheduled Dates if there are any */
                obj.options && obj.options.schedule && obj.options.schedule.length > 0 &&
                <p className="flexDivRows">Scheduled Dates</p>
            }
            {/** Display all schedule elements */
                <ScheduleDisplay 
                    obj={obj} setObj={setObj} 
                    setScheduleToggle={setScheduleToggle} 
                    setDate1={setDate1} setDate2={setDate2}
                    setStartDate={setStartDate} setEndDate={setEndDate}/>
            }
            {/** Options to create elements */}
            <div className="flexDivRows">
                <button
                    style={{ color: obj.options?.startInfo === true ? 'gray' : 'black'}}
                    onClick={() => setObj({ ...obj, options: { ...obj.options, startInfo: obj.options?.startInfo === true ? false : true } })}>
                    Add Start Time
                </button>
                <button onClick={() => setElementInfo(({ type: 'toggle', label: '', value: false, choices: null, group: 0 }))}>Add Button</button>
                <button onClick={() => setElementInfo(({ type: 'choice', label: '', value: '', choices: [''], group: 0 }))}>Add Multiple Choice</button>
                <button onClick={() => setElementInfo(({ type: 'input', label: '', value: [''], choices: null, group: 0 }))}>Add Input Box</button>
                <button onClick={() => setElementInfo(({ type: 'text', label: '', value: '', choices: null, group: 0 }))}>Add Text Box</button>
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
            <p>UI Representation:</p>
            {/** Display UI similar to how it will be in CustomRecord */
                <EditUI obj={obj} setObj={setObj}/>
            }
            <div className="flexDivTable">
            {/** Display startInfo if set to true*/
                obj.options?.startInfo &&
                        <div className="flexDivRows">
                            <p className="flexDivColumns">Event Start:</p>
                            <input readOnly
                                className="twoDigitInput"
                                name='startInfo month box'
                                value={time.month}
                            />
                            <p className="flexDivColumns">/</p>
                            <input readOnly
                                className="twoDigitInput"
                                name='startInfo day box'
                                value={time.day}
                            />
                            <p className="flexDivColumns">/</p>
                            <input readOnly
                                className="fourDigitInput"
                                name='startInfo year box'
                                value={time.year}
                            />
                            <p className="flexDivColumns">at</p>
                            <input readOnly
                                className="twoDigitInput"
                                name='startInfo hour box'
                                value={time.hour}
                            />
                            <p className="flexDivColumns">:</p>
                            <input readOnly
                                className="twoDigitInput"
                                name='startInfo minute box'
                                value={time.minute}
                            />
                        </div>
            } {
                    <div className="flexDivRows">
                        <p className="flexDivColumns">Event End:</p>
                        <input readOnly
                            className="twoDigitInput"
                            name='endInfo month box'
                            value={time.month}
                        />
                        <p className="flexDivColumns">/</p>
                        <input readOnly
                            className="twoDigitInput"
                            name='endInfo day box'
                            value={time.day}
                        />
                        <p className="flexDivColumns">/</p>
                        <input readOnly
                            className="fourDigitInput"
                            name='endInfo year box'
                            value={time.year}
                        />
                        <p className="flexDivColumns">at</p>
                        <input readOnly
                            className="twoDigitInput"
                            name='endInfo hour box'
                            value={time.hour}
                        />
                        <p className="flexDivColumns">:</p>
                        <input readOnly
                            className="twoDigitInput"
                            name='endInfo minute box'
                            value={time.minute}
                        />
                    </div>
            }
            </div>
        </div>
    );
}

/** HTML element for editing start and end date/time of schedule */
const StartEndInput = ({ local, setLocal, date1, setDate1, date2, setDate2 }) => {

    /** Update date 1 property with inputValue */
    const uponDate1Change = (inputValue, prop) => {
        setDate1(prevState => ({ ...prevState, [prop]: inputValue }));
    }

    /** Update date 2 property with inputValue */
    const uponDate2Change = (inputValue, prop) => {
        setDate2(prevState => ({ ...prevState, [prop]: inputValue }));
    }

    return (
        <div className="flexDivTable">
            <div className="flexDivRows">
                <p className="flexDivColumns">Start:</p>
                <input
                    className="twoDigitInput"
                    name='month1 box'
                    value={date1.month}
                    onChange={(e) => uponDate1Change(e.target.value, 'month')}
                />
                <p className="flexDivColumns">/</p>
                <input
                    className="twoDigitInput"
                    name='day1 box'
                    value={date1.day}
                    onChange={(e) => uponDate1Change(e.target.value, 'day')}
                />
                <p className="flexDivColumns">/</p>
                <input
                    className="fourDigitInput"
                    name='year1 box'
                    value={date1.year}
                    onChange={(e) => uponDate1Change(e.target.value, 'year')}
                />
                <p className="flexDivColumns">at</p>
                <input
                    className="twoDigitInput"
                    name='hour1 box'
                    value={date1.hour}
                    onChange={(e) => uponDate1Change(e.target.value, 'hour')}
                />
                <p className="flexDivColumns">:</p>
                <input
                    className="twoDigitInput"
                    name='minute1 box'
                    value={date1.minute}
                    onChange={(e) => uponDate1Change(e.target.value, 'minute')}
                />
            </div>
            <div className="flexDivRows">
                <p className="flexDivColumns">End:</p>
                <input
                    className="twoDigitInput"
                    name='month2 box'
                    value={date2.month}
                    onChange={(e) => uponDate2Change(e.target.value, 'month')}
                />
                <p className="flexDivColumns">/</p>
                <input
                    className="twoDigitInput"
                    name='day2 box'
                    value={date2.day}
                    onChange={(e) => uponDate2Change(e.target.value, 'day')}
                />
                <p className="flexDivColumns">/</p>
                <input
                    className="fourDigitInput"
                    name='year2 box'
                    value={date2.year}
                    onChange={(e) => uponDate2Change(e.target.value, 'year')}
                />
                <p className="flexDivColumns">at</p>
                <input
                    className="twoDigitInput"
                    name='hour2 box'
                    value={date2.hour}
                    onChange={(e) => uponDate2Change(e.target.value, 'hour')}
                />
                <p className="flexDivColumns">:</p>
                <input
                    className="twoDigitInput"
                    name='minute2 box'
                    value={date2.minute}
                    onChange={(e) => uponDate2Change(e.target.value, 'minute')}
                />
            </div>
            {/** Determine time zone dependency */
                local ?
                    <div>
                        <button
                            className="moreLink"
                            style={{ color: 'gray' }}>
                            Local
                            <span style={{ color: 'black' }} className="more">Selected: Given date and time are absolute and will never be converted.</span>
                        </button>
                        <button
                            className="moreLink"
                            onClick={() => setLocal(false)}>
                            UTC
                            <span className="more">Given date and time will be stored in universal standard time and converted to the local time for use.</span>
                        </button>
                    </div>
                    :
                    <div>
                        <button
                            className="moreLink"
                            onClick={() => setLocal(true)}>
                            Local
                            <span className="more">Given date and time are absolute and will never be converted.</span>
                        </button>
                        <button
                            className="moreLink"
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
const EffectiveTimeRange = ({ end, startDate, setStartDate, endDate, setEndDate, repeatType }) => {

    // Update effective start date property with inputValue
    const uponEffectiveStartChange = (inputValue, prop) => {
        setStartDate(prevState => ({ ...prevState, [prop]: inputValue }));
    };

    // Update effective end date property with inputValue
    const uponEffectiveEndChange = (inputValue, prop) => {
        setEndDate(prevState => ({ ...prevState, [prop]: inputValue }));
    };

    return (
        <div>
            { /** Render unless 'Always' chosen */
                repeatType !== 'none' ?
                    <div>
                        <div className="flexDivRows">
                            <p>Effective Time Range</p>
                            {
                                endDate.month !== 'NA' ?
                                    <button onClick={() => { setEndDate({ month: 'NA', day: 'NA', year: 'NA', hour: 'NA', minute: 'NA' }) }}>Always</button>
                                    :
                                    <button onClick={() => { setEndDate(end); }}>Resest</button>
                            }
                        </div>
                        <div className="flexDivTable">
                            <div className="flexDivRows">
                                <p className="flexDivColumns">Start:</p>
                                <input
                                    className="twoDigitInput"
                                    name='start month box'
                                    value={startDate.month}
                                    onChange={(e) => { setStartDate(prevState => ({ ...prevState, month: e.target.value })) }}
                                />
                                <p className="flexDivColumns">/</p>
                                <input
                                    className="twoDigitInput"
                                    name='start day box'
                                    value={startDate.day}
                                    onChange={(e) => uponEffectiveStartChange(e.target.value, 'day')}
                                />
                                <p className="flexDivColumns">/</p>
                                <input
                                    className="fourDigitInput"
                                    name='start year box'
                                    value={startDate.year}
                                    onChange={(e) => uponEffectiveStartChange(e.target.value, 'year')}
                                />
                                <p className="flexDivColumns">at</p>
                                <input
                                    className="twoDigitInput"
                                    name='start hour box'
                                    value={startDate.hour}
                                    onChange={(e) => uponEffectiveStartChange(e.target.value, 'hour')}
                                />
                                <p className="flexDivColumns">:</p>
                                <input
                                    className="fourDigitInput"
                                    name='start minute box'
                                    value={startDate.minute}
                                    onChange={(e) => uponEffectiveStartChange(e.target.value, 'minute')}
                                />
                            </div>
                            <div className="flexDivRows">
                                <p className="flexDivColumns">End:</p>
                                <input
                                    className="twoDigitInput"
                                    name='end month box'
                                    value={endDate.month}
                                    onChange={(e) => uponEffectiveEndChange(e.target.value, 'month')}
                                />
                                <p className="flexDivColumns">/</p>
                                <input
                                    className="twoDigitInput"
                                    name='end day box'
                                    value={endDate.day}
                                    onChange={(e) => uponEffectiveEndChange(e.target.value, 'day')}
                                />
                                <p className="flexDivColumns">/</p>
                                <input
                                    className="fourDigitInput"
                                    name='end year box'
                                    value={endDate.year}
                                    onChange={(e) => uponEffectiveEndChange(e.target.value, 'year')}
                                />
                                <p className="flexDivColumns">at</p>
                                <input
                                    className="twoDigitInput"
                                    name='end hour box'
                                    value={endDate.hour}
                                    onChange={(e) => uponEffectiveEndChange(e.target.value, 'hour')}
                                />
                                <p className="flexDivColumns">:</p>
                                <input
                                    className="fourDigitInput"
                                    name='end minute box'
                                    value={endDate.minute}
                                    onChange={(e) => uponEffectiveEndChange(e.target.value, 'minute')}
                                />
                            </div>
                        </div>
                    </div>
                    :
                    <div className="flexDivRows">
                        <p>In effect starting today.</p>
                    </div>
            }
        </div>
    )
}

/** HTML element for displaying schedules that will be saved with UI */
const ScheduleDisplay = ({ obj, setObj, setScheduleToggle, setDate1, setDate2, setStartDate, setEndDate }) => {

    /** Remove content from obj.options.schedule */
    const removeSchedule = (index) => {
        // Make copy
        const updatedSchedule = [...obj.options.schedule];
        // Remove content at index
        updatedSchedule.splice(index, 1);
        setObj(prevState => ({ ...prevState, options: { ...prevState.options, schedule: updatedSchedule } }));
    }

    return (
        obj.options && obj.options.schedule && obj.options.schedule.length > 0 &&
            obj.options.schedule.map((schedule, index) => (
                <div key={'fullSchedule' + index}>
                    <div className="flexDivRows" key={"schedule" + index}>
                        <p>Schedule {index+1}</p>
                        <button onClick={() => {removeSchedule(index)}}>Remove</button>
                        <button onClick={() => {
                            setScheduleToggle(true);
                            setDate1(schedule.start);
                            setDate2(schedule.end);
                            setStartDate(schedule.effectiveStart);
                            setEndDate(schedule.effectiveEnd);
                            removeSchedule(index);}}>
                            Edit
                        </button>
                    </div>
                    {
                        schedule.repeatType !== 'none' &&
                        <div className="flexDivRows" key={'effectiveSchedule' + index}>
                            <p>
                                {schedule.effectiveEnd.month !== 'NA' ? (<>
                                    Effective from {schedule.effectiveStart.month}/{schedule.effectiveStart.day}/{schedule.effectiveStart.year} at {schedule.effectiveStart.hour}:{schedule.effectiveStart.minute}
                                    &nbsp;- {schedule.effectiveEnd.month}/{schedule.effectiveEnd.day}/{schedule.effectiveEnd.year} at {schedule.effectiveEnd.hour}:{schedule.effectiveEnd.minute}
                                </>) : (<>Effective indefinitely after {schedule.effectiveStart.month}/{schedule.effectiveStart.day}/{schedule.effectiveStart.year} at {schedule.effectiveStart.hour}:{schedule.effectiveStart.minute}</>)
                                }
                            </p>
                        </div>
                    }
                    <div className="flexDivRows" key={'referenceSchedule' + index}>
                        <p>
                            Reference Dates:&nbsp;
                            {schedule.start.month}/{schedule.start.day}/{schedule.start.year}&nbsp;
                            {schedule.start.hour}:{schedule.start.minute}&nbsp;
                            -&nbsp;
                            {schedule.start.month === schedule.end.month &&
                                schedule.start.day === schedule.end.day &&
                                schedule.start.year === schedule.end.year ? (
                                <span>{schedule.end.hour}:{schedule.end.minute}</span>
                            ) : (
                                <span>
                                    {schedule.end.month}/{schedule.end.day}/{schedule.end.year}&nbsp;
                                    {schedule.end.hour}:{schedule.end.minute}
                                </span>
                            )
                            }
                        </p>
                        {
                            schedule.repeatType === 'specRpt' ? (
                                <span>
                                    &nbsp;repeats every {schedule.repeatInfo} days
                                </span>
                            ) : schedule.repeatType === 'daily' ? (
                                <span>
                                    &nbsp;repeats daily
                                </span>
                            ) : schedule.repeatType === 'weekly' ? (
                                <span>
                                    &nbsp;repeats every {getWeekdayString(parseInt(schedule.repeatInfo))}
                                </span>
                            ) : schedule.repeatType === 'monthly' ? (
                                <span>
                                    &nbsp;repeats monthly
                                </span>
                            ) : schedule.repeatType === 'annually' ? (
                                <span>
                                    &nbsp;repeats annually
                                </span>
                            ) : (null)
                        }
                    </div>
                </div>
        ))
    );
}

/** payload element display including remove, move, and group buttons */
const EditUI = ({ obj, setObj }) => {

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
                    <p className="flexDivRows">Group {element.group?.toString()}</p>
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
