import React, { useState, useEffect } from 'react';
import { getDateString, getTimeString, getWeekdayString,
    parseDateString, formatDateToString,
    chooseMostRecent } from './oddsAndEnds';

import { saveObject, fetchObject, fetchFiles } from './generalFetch';

// interfaces for creating a user interface for custom info
export const CustomUI = ({ selectFn, preselectedDir, selectDirAndTitle, mode }) => {

    // Set as empty if no preselectedDir input
    const selectedDir = preselectedDir || '';

    // Used for knowing what index the object to move is in
    const [editIndex, setEditIndex] = useState(null);
    // Used for knowing whaat index to move the object to
    const [toMoveIndex, setToMoveIndex] = useState(null);
    // The "thing" to be recorded, used as directory in database
    const [consumable, setConsumable] = useState(selectedDir);
    // The version of the UI to be imported if I want a starting point(corresponds to date made)
    const [version, setVersion] = useState('');
    // The array of objects making up the array
    const [customUI, setCustomUI] = useState([]);
    // List of the "things" that have been created
    const [existingNames, setExistingNames] = useState([]);
    // List of objects of "things" that have been created
    // Has directory and title objects
    const [existingFiles, setExistingFiles] = useState([]);
    // Holds the text in the "text:" box to be used for new objects
    const [newElementInput, setNewElementInput] = useState('');
    // If disabled, adds a start date/time object (end date/time always included)
    const [includeStart, setIncludeStart] = useState('enabled');
    const [repeatType, setRepeatType] = useState(null);
    const [repeatInfoElement, setRepeatInfoElement] = useState('');
    const [repeatInfo, setRepeatInfo] = useState([]);

    useEffect(() => {
        callFetchFiles();
    },[editIndex])

    useEffect(() => {

    },[customUI])

    useEffect(() => {
        const mostRecent = chooseMostRecent(existingFiles, consumable);
        setVersion(mostRecent);
    },[consumable]);

    useEffect(() => {
        setRepeatInfo([]);
        if (repeatType === 'specifiedDates') {
            setRepeatInfoElement(getDateString(true));
        } else if (repeatType === 'specifiedSplit') {
            setRepeatInfoElement('10');
        } else if (repeatType === 'weekly') {
            setRepeatInfoElement('4');
        } else if (repeatType === 'monthly') {
            setRepeatInfoElement('23');
        } else if (repeatType === 'yearly') {
            setRepeatInfoElement(getDateString(true).split('/').slice(0,-1).join('/'));
        }
    },[repeatType])

    const uponInputChange = (inputValue, setInputValue) => {
        setInputValue(inputValue);
    }

    const uponCustomTextChange = (inputValue, index) => {
        setCustomUI(customUI.map((element, i) => (i === index ? { ...element, text: inputValue } : element)));
    }

    const addButton = (text) => {
        setCustomUI([...customUI, {'type': 'soloButton', 'text': text} ]);
    }

    const addEntry = (text) => {
        setCustomUI([...customUI, {'type': 'entry', 'text': text} ]);
    }

    const addTextBox = (text) => {
        setCustomUI([...customUI, {'type': 'text box', 'text': text}])
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
        return (<button onClick={() => handleMove(index)}>Move to</button>)
    }

    const EditText = (index) => {
        return (<input
                    value={customUI[index].text}
                    onChange={(e) => uponCustomTextChange(e.target.value, index)}
                    />     
        );
    }

    const handleButton = (buttonValue, setButtonValue) => {
        if (buttonValue === 'enabled') {
            setButtonValue('disabled');
        } else if (buttonValue === 'disabled') {
            setButtonValue('enabled');
        } else {
            console.log("the output is not 'enabled' or 'disabled', it's:", buttonValue);
        }
    }

    const handleEditClick = (index) => {
        console.log('editing',customUI[index].text)
        setEditIndex(index);
    }

    const handleElementRemoval = (index) => {
        console.log('removing',customUI[index].text);
        setCustomUI(prevUI => prevUI.filter((_, i) => i !== index));
    }

    const handleMove = (index) => {
        const elementToMove = customUI.splice(toMoveIndex, 1)[0]; // Remove element at index 1 (2) and store it
        customUI.splice(index, 0, elementToMove);
        setToMoveIndex(index);
        setCustomUI([...customUI]);
    }

    const callFetchFiles = async () => {
        try {
            const data = await fetchFiles(mode === 'schedule' ? 'scheduledEvents' : 'customUI');
            setExistingNames([...new Set(data.map((element) => (element.directory)))]);
            setExistingFiles(data);
        } catch (err) {
            console.error('Error fetching existing names:', err);
        }
    }

    const callFetchObject = async () => {
        try {
            const UIinput = await fetchObject(mode === 'schedule' ? 'scheduledEvents' : 'customUI',
                consumable,version);
            setCustomUI(UIinput);
            console.log('retrieved custom UI');
        } catch (err) {
            console.error('Error fetching UI:', err);
        }
    }

    const closeCustomUI = async (save) => {
        if (save) {
            let updatedUI = customUI;
            if (includeStart === 'disabled') {
                const hasStartDateOrTime = updatedUI.some(item =>
                    item.type === 'startDate' || item.type === 'startTime'
                );
                if (!hasStartDateOrTime) {
                    updatedUI.push(
                        { 'type': 'startDate', 'text': 'Start Date' },
                        { 'type': 'startTime', 'text': 'Start Time' }
                    );
                }
            }
            const hasEndDateOrTime = updatedUI.some(item =>
                item.type === 'endDate' || item.type === 'endTime'
            );
            if (!hasEndDateOrTime) {
                updatedUI.push(
                    { 'type': 'endDate', 'text': 'End Date' },
                    { 'type': 'endTime', 'text': 'End Time' }
                );
            }
            if (mode === 'schedule') {
                updatedUI.push(
                    { 'repeatType': repeatType },
                    { 'repeatInfo': repeatInfo },
                )
            }
            try {
                const dateString = getDateString().split('/').join('-') + '.' + getTimeString().split(':').join('-');
                const response = await saveObject(mode === 'schedule' ? 'scheduledEvents' : 'customUI',
                    consumable,dateString,updatedUI);
                console.log(response);
            } catch (err) {
                console.error('Error saving customUI:', err);
            }
        }
        if (selectedDir === '' || save === false) {
            selectFn('main');
        } else {
            selectDirAndTitle(consumable, null);
            if (mode === 'record') {
                selectFn('customInfo');
            } else if (mode === 'clock in') {
                selectFn('customClockIn');
            } else if (mode === 'clock out') {
                selectFn('customClockOut');
            } else if (mode === 'schedule') {
                selectFn('scheduledEvents');
            }
        }
    }

    return (
        <div>
            <h4>Consumption UI creator</h4>
            <div style={{ display: 'flex'}}>
                <p>Event:</p>
                <input
                    value={consumable}
                    list='prevNames'
                    onChange={(e) => uponInputChange(e.target.value,setConsumable)}
                    />
                <datalist id="prevNames">
                    {[...new Set(existingNames)].map((optionText, index) => (
                        <option key={index} value={optionText} />
                    ))}
                </datalist>
                <p>Version:</p>
                <input
                    value={version}
                    list='versions'
                    onChange={(e) => uponInputChange(e.target.value, setVersion)}
                />
                <button onClick={() => callFetchObject()}>fetch UI</button>
                <datalist id="versions">
                    {existingFiles.map((option, index) => (
                        option.directory === consumable
                        && <option key={index} value={option.title} />
                    ))}
                </datalist>
            </div>
            <div style={{ display: 'flex' }}>
                <p>text:</p>
                <input 
                    value={newElementInput}
                    onChange={(e) => uponInputChange(e.target.value,setNewElementInput)}
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
                <button 
                    onClick={() => handleButton(includeStart,setIncludeStart)}
                    style={{ color: includeStart === 'enabled' ? 'black' : 'gray' }}
                    >
                    Add Start Time
                </button>
            </div>
            <div style={{ display: 'flex' }}>
                <p>Repeat type:</p>
                <button 
                    onClick={() => setRepeatType('specifiedDates')}
                    style={{ color: repeatType !== 'specifiedDates' ? 'black': 'grey' }}
                    >
                    Specified Dates
                </button>
                <button 
                    onClick={() => setRepeatType('specifiedSplit')}
                    style={{ color: repeatType !== 'specifiedSplit' ? 'black': 'grey' }}
                    >
                    Every x days
                </button>
                <button 
                    onClick={() => setRepeatType('weekly')}
                    style={{ color: repeatType !== 'weekly' ? 'black': 'grey' }}
                    >
                    Weekly
                </button>
                <button 
                    onClick={() => setRepeatType('monthly')}
                    style={{ color: repeatType !== 'monthly' ? 'black': 'grey' }}
                    >
                    Monthly
                </button>
                <button 
                    onClick={() => setRepeatType('yearly')}
                    style={{ color: repeatType !== 'yearly' ? 'black': 'grey' }}
                    >
                    Yearly
                </button>
            </div>
            {
                repeatType === 'specifiedDates' 
                ?   (
                        <div style = {{ display: 'flex' }}>
                            <p>Add Specific Dates</p>
                            <input
                                value={repeatInfoElement}
                                onChange={(e) => uponInputChange(e.target.value,setRepeatInfoElement)}
                                />
                            <button onClick={() => setRepeatInfo([...repeatInfo, repeatInfoElement])}>
                                Add
                            </button>
                            <p>On </p>
                            <ul style={{ 'listStyle': 'none', 'display': 'inline', paddingLeft: '2px', paddingRight: '2px' }}>
                                {repeatInfo.map((date, index) => (
                                    <li
                                        key={index}
                                        style={{ display: 'inline', cursor: 'pointer' }}
                                        onClick={() => setRepeatInfo(repeatInfo.
                                            filter((element) => (element !== date)))}
                                    >
                                        {date + ', '}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                : repeatType === 'specifiedSplit'
                ?   (
                        <div style = {{ display: 'flex' }}>
                            <p>Add Specific Dates</p>
                            <input
                                value={repeatInfoElement}
                                onChange={(e) => uponInputChange(e.target.value,setRepeatInfoElement)}
                                />
                            <button onClick={() => setRepeatInfo([...repeatInfo, repeatInfoElement])}>
                                Add
                            </button>
                            <p>Every </p>
                            <ul style={{ 'listStyle': 'none', 'display': 'inline', paddingLeft: '2px', paddingRight: '2px' }}>
                                {repeatInfo.map((split, index) => (
                                    <li
                                        key={index}
                                        style={{ display: 'inline', cursor: 'pointer' }}
                                        onClick={() => setRepeatInfo(repeatInfo.
                                            filter((element) => (element !== split)))}
                                    >
                                        {split + ', '}
                                    </li>
                                ))}
                            </ul>
                            <p> days</p>
                        </div>
                    )
                : repeatType === 'weekly'
                ?   (
                        <div style = {{ display: 'flex' }}>
                            <p>Add Specific Dates</p>
                            <input
                                value={repeatInfoElement}
                                onChange={(e) => uponInputChange(e.target.value,setRepeatInfoElement)}
                                />
                            <button onClick={() => setRepeatInfo([...repeatInfo, repeatInfoElement])}>
                                Add
                            </button>
                            <p>Every </p>
                            <ul style={{ 'listStyle': 'none', 'display': 'inline', paddingLeft: '2px', paddingRight: '2px' }}>
                                {repeatInfo.map((day, index) => (
                                    <li
                                        key={index}
                                        style={{ display: 'inline', cursor: 'pointer' }}
                                        onClick={() => setRepeatInfo(repeatInfo.
                                            filter((element) => (element !== day)))}
                                    >
                                        {getWeekdayString(day) + ', '}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                : repeatType === 'monthly'
                ?   (
                        <div style = {{ display: 'flex' }}>
                            <p>Add Specific Dates</p>
                            <input
                                value={repeatInfoElement}
                                onChange={(e) => uponInputChange(e.target.value,setRepeatInfoElement)}
                                />
                            <button onClick={() => setRepeatInfo([...repeatInfo, repeatInfoElement])}>
                                Add
                            </button>
                            <p>On the </p>
                            <ul style={{ 'listStyle': 'none', 'display': 'inline', paddingLeft: '2px', paddingRight: '2px' }}>
                                {repeatInfo.map((day, index) => (
                                    <li
                                        key={index}
                                        style={{ display: 'inline', cursor: 'pointer' }}
                                        onClick={() => setRepeatInfo(repeatInfo.
                                            filter((element) => (element !== day)))}
                                    >
                                        {day + ', '}
                                    </li>
                                ))}
                            </ul>
                            <p> of the month</p>
                        </div>
                    )
                : repeatType === 'yearly'
                ?   (
                        <div style = {{ display: 'flex' }}>
                            <p>Add Specific Dates</p>
                            <input
                                value={repeatInfoElement}
                                onChange={(e) => uponInputChange(e.target.value,setRepeatInfoElement)}
                                />
                            <button onClick={() => setRepeatInfo([...repeatInfo, repeatInfoElement])}>
                                Add
                            </button>
                            <p>Every year on </p>
                            <ul style={{ 'listStyle': 'none', 'display': 'inline', paddingLeft: '2px', paddingRight: '2px' }}>
                                {repeatInfo.map((date, index) => (
                                    <li
                                        key={index}
                                        style={{ display: 'inline', cursor: 'pointer' }}
                                        onClick={() => setRepeatInfo(repeatInfo.
                                            filter((element) => (element !== date)))}
                                    >
                                        {date + ','}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )
                : null
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
                                { toMoveIndex !== null && moveToButton(index) }
                            </div>
                        );
                    case 'entry':
                        return (
                            <div key={index} style={{ display:'flex' }}>
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
                                { toMoveIndex !== null && moveToButton(index) }
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
                            </div>
                        );
                    case 'startTime':
                    case 'endTime':
                        return (
                            <div key={index} style={{ display: 'flex' }}>
                                <p>{element.text}</p>
                                <input value={getTimeString(true)} readOnly />
                                {editButton(index)}
                                {removeButton(index)}
                                {moveButton(index)}
                                {editIndex === index &&
                                    <>
                                        {EditText(index)}
                                        {commitButton()}
                                    </>
                                }
                                { toMoveIndex !== null && moveToButton(index) }
                            </div>
                        );
                    case 'startDate':
                    case 'endDate':
                        return (
                            <div key={index} style={{ display: 'flex' }}>
                                <p>{element.text}</p>
                                <input value={getDateString(true)} readOnly />
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
                            </div>
                        );
                    default:
                        return null;
                }
            })}
            </div>
            <button 
                onClick={() => ((mode !== 'schedule' || (repeatType && repeatInfo.length > 0))
                    ? closeCustomUI(true) : null)}
                style={{ color: (mode !== 'schedule' || (repeatType && repeatInfo.length > 0)) ? 'black' : 'gray' }}
                >
                Create UI
            </button>
            <button onClick={() => closeCustomUI(false)}>
                Return to Main
            </button>
        </div>
    );
}