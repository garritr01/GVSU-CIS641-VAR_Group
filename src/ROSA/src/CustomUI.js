import React, { useState, useEffect, useRef 
} from 'react';

import {getDateString, getTimeString, chooseMostRecent, formatDateToObject,
    convertUTCstringsToLocal, convertLocalStringsToUTC
} from './oddsAndEnds';

import { deleteEntry, fetchObject, fetchFiles, saveObject 
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