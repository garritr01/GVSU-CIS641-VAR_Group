import React, { useState, useEffect, useRef 
} from 'react';

import {getDateString, getTimeString, chooseMostRecent, formatDateToObject,
    convertUTCstringsToLocal, convertLocalStringsToUTC, getCurrentDateStrings,
    getWeekdayString
} from './oddsAndEnds';

import { deleteEntry, fetchObject, fetchFiles, fetchDirsAndFiles, saveObject 
} from './generalFetch';

import { Functions } from './MainMenu';

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
export const NewCustomUI = ({ printLevel, selectFn, preselectedObj }) => {
    
    // Get object with local month, day, year, hour, minute
    const time = getCurrentDateStrings(true);

    // Use object
    const [obj, setObj] = useState(preselectedObj);
    // Info for dropdown menus
    const [dirs, setDirs] = useState([]);
    const [fileInfo, setFileInfo] = useState([]);
    // Toggle schedule UI
    const [schedule, setSchedule] = useState(false);
    // Contain repeat type temporarily
    const [repeatType, setRepeatType] = useState('');
    // Contain date being input for later conversion to object (2 for start and end if necessary)
    const [date1, setDate1] = useState(time);
    const [date2, setDate2] = useState(time);
    // Contain effective date being input for later conversion to object
    const [startDate, setStartDate] = useState({ month: time.month, day: time.day, year: time.year });
    const [endDate, setEndDate] = useState({ month: time.month, day: time.day, year: time.year });
    // repeatInfo is only used by weekly to specify which day and specRpt to specify how many days before repeating
    const [repeatInfo, setRepeatInfo] = useState('1');
    // elementType determines the UI to show to create the element
    const [elementType, setElementType] = useState(null);
    // elementInfo contains the text to show describing the input
    const [elementInfo, setElementInfo] = useState(null);

    // Set table to 'customUI' upon load
    useEffect(() => {
        setObj(prevState => ({ ...prevState, table: 'customUI' }));
    }, []);

    // Make sure repeatInfo won't be greater than 6 (Saturday) when changed
    useEffect(() => {
        if (repeatType === 'weekly' && repeatInfo > 6) {
            setRepeatInfo('1');
        }
    },[repeatType])

    /** Update date 1 property with inputValue */
    const uponDate1Change = (inputValue, prop) => {
        setDate1(prevState => ({ ...prevState, [prop]: inputValue }));
    };

    /** Update date 2 property with inputValue */
    const uponDate2Change = (inputValue, prop) => {
        setDate2(prevState => ({ ...prevState, [prop]: inputValue }));
    };

    /** Update effective start date property with inputValue */
    const uponEffectiveStartChange = (inputValue, prop) => {
        setStartDate(prevState => ({ ...prevState, [prop]: inputValue }));
    };

    /** Update effective end date property with inputValue */
    const uponEffectiveEndChange = (inputValue, prop) => {
        setEndDate(prevState => ({ ...prevState, [prop]: inputValue }));
    };

    /** Update object property with inputValue */
    const uponInputChange = (inputValue, prop) => {
        setObj(prevState => ({ ...prevState, [prop]: inputValue }));
    };

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
    };

    /** Update option property with inputValue */
    const uponPayloadInputChange = (inputValue, prop) => {
        setObj(prevState => ({ ...prevState, payload: { ...prevState.payload, [prop]: inputValue } }));
    };

    /** Update option property (which is also an object) with inputValue */
    const uponPayloadObjectInputChange = (inputValue, prop) => {
        let parsedObj;
        // Attempt to parse and notify upon uncaught failure
        try {
            parsedObj = JSON.parse(inputValue);
        } catch (err) {
            console.error("No catch for unparseable object!");
        }
        setObj(prevState => ({ ...prevState, payload: { ...prevState.payload, [prop]: parsedObj } }));
    };

    const addToggle = () => {}

    /** Gets dirs and files where directories is all unqiue directories and
    * files is an array of objects containing dateTime, directory, and title
    */
    const getDirsAndFiles = async () => {
        try {
            const dirsAndFiles = await fetchDirsAndFiles('journals', obj.userID);
            setFileInfo(dirsAndFiles.files);
            setDirs(dirsAndFiles.directories);
        } catch (err) {
            console.error('Error fetching journal dirs and files:', err);
        }
    };

    // Get payload given relevant arguments
    const getPayload = async () => {
        try {
            const content = await fetchObject(obj.table, obj.dateTime, obj.userID, obj.dir, obj.filename);
            setObj(prevState => ({ ...prevState, payload: content }));
        } catch {
            console.error('Error getting content with ', obj);
        }
    }

    /** Add StartEndInput content to obj.options.schedule */
    const scheduleIt = () => {
        const newSchedule = {
            repeatType: repeatType,
            repeatInfo: repeatInfo,
            start: date1,
            end: date2,
            effectiveStart: startDate,
            effectiveEnd: endDate,
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

    /** Remove content from obj.options.schedule */
    const removeSchedule = (index) => {
        // Make copy
        const updatedSchedule = [...obj.options.schedule];
        // Remove content at index
        updatedSchedule.splice(index, 1);
        setObj(prevState => ({ ...prevState, options: { ...prevState.options, schedule: updatedSchedule } }));
    }

    /** HTML element for editing start and end date/time of schedule */
    const StartEndInput = () => (
        <div className="flexDivTable">
            <div className="flexDivRows">
                <p className="flexDivColumns">From:</p>
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
                <p className="flexDivColumns">To:</p>
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
        </div>
    )

    /** HTML element for editing effective start and end date of schedule */
    const EffectiveTimeRange = () => (
        <div>
        { /** Render unless 'Always' chosen */
            startDate.month !== 'NA' ?
                <div>
                    <div className="flexDivRows">
                        <p>Effective Time Range</p>
                        <button
                            onClick={() => {
                                setStartDate({ month: 'NA', day: 'NA', year: 'NA' });
                                setEndDate({ month: 'NA', day: 'NA', year: 'NA' });
                            }}>
                            Always
                        </button>
                    </div>
                    <div className="flexDivTable">
                        <div className="flexDivRows">
                            <p className="flexDivColumns">From:</p>
                            <input
                                className="twoDigitInput"
                                name='start month box'
                                value={startDate.month}
                                onChange={(e) => uponEffectiveStartChange(e.target.value, 'month')}
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
                        </div>
                        <div className="flexDivRows">
                            <p className="flexDivColumns">To:</p>
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
                        </div>
                    </div>
                </div>
                :
                <div className="flexDivRows">
                    <p>Always in effect.</p>
                    <button
                        onClick={() => {
                            setStartDate(time);
                            setEndDate(time);
                        }}>
                        Reset
                    </button>
                </div>
            }
        </div>
    )

    /** HTML element for displaying schedules that will be saved with UI */
    const ScheduleDisplay = ({ schedule, index }) => (
        <div>
            <div className="flexDivRows" key={index}>
                <p
                    style={({ cursor: 'pointer' })}
                    onClick={() => { removeSchedule(index) }}>
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
                    <p
                        style={({ cursor: 'pointer' })}
                        onClick={() => { removeSchedule(index) }}>
                            &nbsp;repeats every {schedule.repeatInfo} days
                        </p>
                    ) : schedule.repeatType === 'daily' ? (
                    <p
                        style={({ cursor: 'pointer' })}
                        onClick={() => { removeSchedule(index) }}>
                            &nbsp;repeats daily
                        </p>
                    ) : schedule.repeatType === 'weekly' ? (
                    <p
                        style={({ cursor: 'pointer' })}
                        onClick={() => { removeSchedule(index) }}>
                            &nbsp;repeats every {getWeekdayString(parseInt(schedule.repeatInfo))}
                        </p>
                    ) : schedule.repeatType === 'monthly' ? (
                    <p
                        style={({ cursor: 'pointer' })}
                        onClick={() => { removeSchedule(index) }}>
                            &nbsp;repeats monthly
                        </p>
                    ) : schedule.repeatType === 'annually' ? (
                    <p
                        style={({ cursor: 'pointer' })}
                        onClick={() => { removeSchedule(index) }}>
                            &nbsp;repeats annually
                        </p>
                    ) : (null)
                }
            </div>
            <div className="flexDivRows" key={index}>
                    <p
                        style={({ cursor: 'pointer' })}
                        onClick={() => { removeSchedule(index) }}>
                        {schedule.effectiveStart.month !== 'NA' ? (<>
                            Effective {schedule.effectiveStart.month}/{schedule.effectiveStart.day}/{schedule.effectiveStart.year}
                            &nbsp;- {schedule.effectiveEnd.month}/{schedule.effectiveEnd.day}/{schedule.effectiveEnd.year}
                        </>) : (<>Effective forever</>)
                        }
                    </p>
            </div>
        </div>
    )

    return (
        <div>
            <Functions printLevel={printLevel} selectFn={selectFn} />
            <div className="mainContainer">
                <button onClick={() => console.log(obj)}>obj</button>
                <button onClick={() => console.log(repeatInfo,typeof(repeatInfo))}>repeatInfo</button>
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
                                dirs.map((name, index) => (
                                    <option key={index} value={name} />
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
                                    index === self.findIndex((o) => o.title === obj.title)
                                ).map((file, index) => (
                                    <option key={index} value={file.title} />
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
                                    if (file.title === obj.filename && file.directory === obj.dir) {
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
                {/** Button row (saving, loading, resetting) */}
                <div className="flexDivRows">
                    { // Render load content button if all necessary fields are filled
                        obj.dir && obj.filename && obj.dateTime.date ?
                            <div>
                                <button onClick={() => getPayload()}>LoadContent</button>
                            </div>
                            :
                            <div>
                                <button style={({ color: 'gray' })}>Load Content</button>
                            </div>
                    } { // Render overwrite button if using previous file version
                        obj.payload && obj.dir && obj.filename ?
                            obj.dateTime.date ?
                                <div className="flexDivRows">
                                    <button>Overwrite</button>
                                    <button>Save New</button>
                                </div>
                                :
                                <div className="flexDivRows">
                                    <button style={({ color: 'gray' })}>Overwrite</button>
                                    <button>Save New</button>
                                </div>
                            :
                            <div className="flexDivRows">
                                <button style={({ color: 'gray' })}>Overwrite</button>
                                <button style={({ color: 'gray' })}>Save New</button>
                            </div>
                    }
                </div>
                {/** Initial Scheduling Row */}
                <div className="flexDivRows">
                        <button 
                            className="flexDivColumns" 
                            onClick={() => setSchedule(!schedule)}>
                                Toggle Schedule
                        </button>
                    {/** Schedule repeat options */
                        schedule &&
                            <div>
                                <p>Repeat Type:</p>
                                <button onClick={() => {setRepeatType('none')}}>Specific</button>
                                <button onClick={() => {setRepeatType('specRpt')}}>Specific Repeat</button>
                                <button onClick={() => {setRepeatType('daily')}}>Daily</button>
                                <button onClick={() => {setRepeatType('weekly')}}>Weekly</button>
                                <button onClick={() => {setRepeatType('monthly')}}>Monthly</button>
                                <button onClick={() => {setRepeatType('annually')}}>Annually</button>
                            </div>
                    }
                </div>
                {/** Display relevant inputs for repeatType */
                    schedule && (
                        repeatType === 'none' ? (
                            <div>
                                <p className="flexDivRows">Scheduled Time</p>
                                <StartEndInput/>
                                <p className="flexDivRows">Never repeat</p>
                                <button onClick={() => scheduleIt()}>Schedule it!</button>
                            </div>
                        ) : repeatType === 'specRpt' ? (
                            <div>
                                <p className="flexDivRows">Scheduled Time</p>
                                <StartEndInput/>
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
                                <EffectiveTimeRange/>
                                <button onClick={() => scheduleIt()}>Schedule it!</button>
                            </div>
                        ) : repeatType === 'daily' ? (
                            <div>
                                <p className="flexDivRows">Scheduled Time</p>
                                <StartEndInput/>
                                <p className="flexDivRows">Repeat daily</p>
                                <EffectiveTimeRange/>
                                <button onClick={() => scheduleIt()}>Schedule it!</button>
                            </div>
                        ) : repeatType === 'weekly' ? (
                            <div>
                                <p className="flexDivRows">Scheduled Time</p>
                                <StartEndInput/>
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
                                <EffectiveTimeRange/>
                                <button onClick={() => scheduleIt()}>Schedule it!</button>
                            </div>
                        ) : repeatType === 'monthly' ? (
                            <div>
                                <p className="flexDivRows">Scheduled Time</p>
                                <StartEndInput/>
                                <p className="flexDivRows">Repeat monthly</p>
                                <EffectiveTimeRange/>
                                <button onClick={() => scheduleIt()}>Schedule it!</button>
                            </div>
                        ) : repeatType === 'annually' ? (
                            <div>
                                <p className="flexDivRows">Scheduled Time</p>
                                <StartEndInput/>
                                <p className="flexDivRows">Repeat annually</p>
                                <EffectiveTimeRange/>
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
                    obj.options && obj.options.schedule && obj.options.schedule.length > 0 &&
                        obj.options.schedule.map((schedule, index) => (
                            <ScheduleDisplay schedule={schedule} index={index} />
                        )
                    )
                }
                {/** Options to create elements */}
                <div className="flexDivRows">
                    <button onClick={() => setElementType('toggle')}>Add Toggle</button>
                    <button onClick={() => setElementType('choice')}>Add Multiple Choice</button>
                    <button onClick={() => setElementType('input')}>Add Input Box</button>
                    <button onClick={() => setElementType('text')}>Add Text Box</button>
                </div>
                {/** Element creation UI */
                    elementType === 'toggle' ? (
                        <div className="flexDivRows">
                            <p>Label:</p>
                            <input
                                className="flexDivColumns"
                                name='toggle label box'
                                value={elementInfo}
                                onChange={(e) => uponPayloadInputChange(e.target.value, 'dir')}
                            />
                        </div>
                    ) : (null)
                }
            </div>
        </div>
    );
}