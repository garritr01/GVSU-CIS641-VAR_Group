import React, { useState, useEffect, useRef 
} from 'react';

import { getDateString, getTimeString, chooseMostRecent, convertUTCstringsToLocal, convertLocalStringsToUTC 
} from './oddsAndEnds';

import { fetchDirsAndFiles, deleteEntry, fetchText, saveText 
} from './generalFetch';

import { Functions } from './MainMenu';

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
    }, [title, dir])

    useEffect(() => {
        if (version) {
            loadContent();
        }
    }, [version])

    const uponInputChange = (inputValue, setInputValue) => {
        setInputValue(inputValue);
    };

    const callFetchDirsAndFiles = async () => {
        try {
            const dirsAndFiles = await fetchDirsAndFiles('journals', 'Garrit');
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
        } catch (err) {
            console.error('Error fetching directories and files:', err);
        };
        console.log()
    };

    const closeJournal = async (save) => {
        if (save) {
            try {
                const response = await saveText('journals', entry, { date: getDateString(), time: getTimeString() }, 'Garrit', dir, title);
                console.log(response);
            } catch (err) {
                console.error('Error occurred while saving entry:', err);
            }
            if (selectedDir && selectedTitle &&
                (selectedTitle !== title || selectedDir !== dir)) {
                // The version argument here needs to be updated to correctly discover what the old version was
                try {
                    const response = await deleteEntry('journals', version, 'Garrit', selectedDir, selectedTitle);
                    console.log(response);
                }
                catch (err) {
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

export const NewJournal = ({ printLevel, selectFn, preselectedObj }) => {

    // Use object
    const [obj, setObj] = useState(preselectedObj);
    // Retains file information from loaded file
    const [loaded, setLoaded] = useState({ dir: '', filename: '', dateTime: { date: '', time: '' } });
    // Retains information from last saved file
    const [saved, setSaved] = useState({ dir: '', filename: '', dateTime: { date: '', time: '' } });
    const [notSaved, setNotSaved] = useState({ dir: '', filename: '', dateTime: { date: '', time: '' } });
    // Save response from databse
    const [dbMsg, setDbMsg] = useState('');
    // Shrinks warning or save notification
    const [shrink, setShrink] = useState({ save: false, error: false});
    // Info for dropdown menus
    const [dirs, setDirs] = useState([]);
    const [fileInfo, setFileInfo] = useState([]);

    // Set table to 'journals' and set payload to '' if null upon load
    useEffect(() => {
        if (obj.payload) {
            setObj(prevState => ({
                ...prevState,
                table: 'journals'
            }));
        } else {
            setObj(prevState => ({
                ...prevState,
                table: 'journals',
                payload: ''
            }));
        }
        getDirsAndFiles();
    },[]);

    // Empties filename if dir is changed
    useEffect(() => {
        setObj(prevObj => ({ ...prevObj, filename: '' }));
    }, [obj.dir]);

    // Autofills or empties dateTime when dir or filename is changed
    useEffect(() => {
        if (fileInfo.map(i => i.directory).includes(obj.dir) && fileInfo.map(i => i.title).includes(obj.filename)) {
            const mostRecent = chooseMostRecent(fileInfo, obj.dir, obj.filename);
            setObj(prevState => ({ ...prevState, dateTime: mostRecent }));
        } else {
            setObj(prevObj => ({ ...prevObj, dateTime: { date: '', time: '' } }));
        }
    }, [obj.dir, obj.filename]);

    // Warns of changing save location of loaded content
    useEffect(() => {
        fileChangeWarning();
    }, [loaded, obj.dir, obj.filename, obj.dateTime]);

    // Triggers save notification creation
    useEffect(() => {
        fileSaveNotification();
    }, [saved, notSaved]);

    /** Update object property with inputValue */
    const uponInputChange = (inputValue, prop) => {
        setObj(prevState => ({ ...prevState, [prop]: inputValue}));
    };

    /** Update object property (which is also an object) with inputValue */
    const uponObjectInputChange = (inputValue, prop) => {
        let parsedObj;
        // Attempt to parse and notify upon uncaught failure
        try {
            parsedObj = JSON.parse(inputValue);
        } catch(err) {
            if (prop === 'dateTime') {
                parsedObj = { date: '', time: '' };
            } else {
                console.error("No catch for unparseable object!");
            }
        }
        setObj(prevState => ({ ...prevState, [prop]: parsedObj }));
    };

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
            const content = await fetchText(obj.table, obj.dateTime, obj.userID, obj.dir, obj.filename);
            setObj(prevState => ({ ...prevState, payload: content }));
            setLoaded({ dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime });
        } catch {
            console.error('Error getting content with ',obj);
        }
    }

    /** Outputs warning about changing names if loaded dir, filename, datetime is not equal to its corresponding value in obj */
    const fileChangeWarning = () => {
        if (!loaded.dir ||
            (loaded.dir === obj.dir &&
            loaded.filename === obj.filename &&
            loaded.dateTime.date === obj.dateTime.date &&
            loaded.dateTime.time === obj.dateTime.time)) {
            const errorBox = document.getElementById("fileChange");
            if (errorBox) {
                errorBox.style.display = 'none';
                errorBox.textContent = '';
            } else {
                console.error('id=fileChange element DNE???');
            }
        } else {
            const errorBox = document.getElementById("fileChange");
            if (errorBox) {
                let errText;
                if (shrink.error) {
                    errText = 'Name change warning';
                } else {
                    errText = `Warning: You imported ${loaded.dir}/${loaded.filename} version: ${loaded.dateTime.date}-${loaded.dateTime.time} and changed the location you will save to!`;
                }
                errorBox.style.display = 'block';
                errorBox.textContent = errText;
            } else {
                console.error('id=fileChange element DNE???');
            }
        }
    }
    
    /** Outputs notification of file save  */
    const fileSaveNotification = () => {
        if (notSaved.dir) {
            const saveBox = document.getElementById("fileSave");
            if (saveBox) {
                let saveText;
                if (shrink.save) {
                    saveText = 'Save failed';
                } else {
                    saveText = `${notSaved.dir}/${notSaved.filename} version: ${notSaved.dateTime.date}-${notSaved.dateTime.time} did not save: ${dbMsg}`;
                }
                saveBox.style.display = 'block';
                saveBox.textContent = saveText;
            } else {
                console.error('id=fileSave element DNE???');
            }
        } else if (saved.dir) {
            const saveBox = document.getElementById("fileSave");
            if (saveBox) {
                let saveText;
                if (shrink.save) {
                    saveText = 'Save succeeded';
                } else {
                    saveText = `${saved.dir}/${saved.filename} version: ${saved.dateTime.date}-${saved.dateTime.time} saved successfully`;
                }
                saveBox.style.display = 'block';
                saveBox.textContent = saveText;
            } else {
                console.error('id=fileSave element DNE???');
            }
        } else {
            const saveBox = document.getElementById("fileSave");
            if (saveBox) {
                saveBox.style.display = 'none';
                saveBox.textContent = '';
            } else {
                console.error('id=fileSave element DNE???');
            }
        }
    }

    /** Save the journal entry and set variables relevant to displaying result
     * @param {boolean} overwrite - determines whether to save new with current time or overwrite previous with previous time
     */
    const saveJournal = async (overwrite) => {
        try {
            if (overwrite) {
                const response = await saveText(obj.table, obj.payload, obj.dateTime, obj.userID, obj.dir, obj.filename);
                setDbMsg(response.msg);
                if (response.truth && response.status === 200) {
                    console.log(`Overwrote ${obj.dir}/${obj.filename} version: ${JSON.stringify(obj.dateTime)} with new entry`);
                    setSaved({ dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime });
                    setNotSaved({ dir: '', filename: '', dateTime: { date: '', time: '' } });
                } else {
                    console.error(`Erred overwriting ${obj.dir}/${obj.filename} version: ${JSON.stringify(obj.dateTime)} with new entry: ${response.msg}`);
                    setSaved({ dir: '', filename: '', dateTime: { date: '', time: '' } });
                    getDirsAndFiles();
                    setNotSaved({ dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime });
                }
            } else {
                const newDateTime = { date: getDateString(), time: getTimeString() };
                const response = await saveText(obj.table, obj.payload, newDateTime, obj.userID, obj.dir, obj.filename);
                setDbMsg(response.msg);
                // Update currently used object to reflect version it was saved under
                if (response.truth && response.status === 201) {
                    console.log(`Saved ${obj.dir}/${obj.filename} version: ${JSON.stringify(newDateTime)}`);
                    setSaved({ dir: obj.dir, filename: obj.filename, dateTime: newDateTime });
                    getDirsAndFiles();
                    setNotSaved({ dir: '', filename: '', dateTime: { date: '', time: '' } });
                } else {
                    console.error(`Erred saving ${obj.dir}/${obj.filename} version: ${JSON.stringify(newDateTime)}: ${response.msg}`);
                    setSaved({ dir: '', filename: '', dateTime: { date: '', time: '' } });
                    setNotSaved({ dir: obj.dir, filename: obj.filename, dateTime: newDateTime });
                }
            }
        } catch (err) {
            console.error('Error occurred in saveJournal:', err);
        }
    };

    /** Returns journal UI */
    return(
        <div>
            <Functions printLevel={printLevel} selectFn={selectFn} />
            <div className="mainContainer">
                <button onClick={() => console.log(fileInfo)}>anyLog</button>
                <button onClick={() => console.log(obj)}>Log</button>
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
                            onChange={(e) => uponObjectInputChange(e.target.value, 'dateTime')}
                            >
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
                    { // Render remove content button to remove loaded and empty payload
                        loaded.dir ?
                            <div>
                                <button onClick={() => {
                                    setLoaded({ dir: '', filename: '', dateTime: { date: '', time: '' } });
                                    setObj(prevState => ({ ...prevState, payload: '' }));
                                    }}>
                                        Empty Content
                                </button>
                            </div>
                        :
                        <div>
                            <button style={({ color: 'gray' })}>
                                Empty Content
                            </button>
                        </div>
                    }
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
                                    <button onClick={() => saveJournal(true)}>Overwrite</button>
                                    <button onClick={() => saveJournal(false)}>Save New</button>
                                </div>
                                :
                                <div className="flexDivRows">
                                    <button style={({ color: 'gray' })}>Overwrite</button>
                                    <button onClick={() => saveJournal(false)}>Save New</button>
                                </div>
                            : 
                            <div className="flexDivRows">
                                <button style={({ color: 'gray' })}>Overwrite</button>
                                <button style={({ color: 'gray' })}>Save New</button>
                            </div>
                    }
                </div>
                <p 
                    id="fileChange" 
                    className='errorPopup' 
                    style={({ cursor: 'pointer' })} 
                    onClick={() => {
                        setShrink(prevState => ({ ...prevState, error: !prevState.error }));
                        fileChangeWarning();
                        }}></p>
                <p
                    id="fileSave"
                    className='popup'
                    style={({ cursor: 'pointer' })}
                    onClick={() => {
                        setShrink(prevState => ({ ...prevState, save: !prevState.save }));
                        fileSaveNotification();
                    }}></p>
                <textarea
                    name="journal box"
                    value={obj.payload}
                    onChange={(e) => uponInputChange(e.target.value, 'payload')}
                />
            </div>
        </div>
    );
}