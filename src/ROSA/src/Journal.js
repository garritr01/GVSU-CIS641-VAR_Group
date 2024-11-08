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
    // Info for dropdown menus
    const [dirs, setDirs] = useState([]);
    const [fileInfo, setFileInfo] = useState([]);
    // Used to determine if there is an existing file
    const [editing, setEditing] = useState(false);

    // Set table upon initial load
    useEffect(() => {
        setObj(prevState => ({
            ...prevState,
            table: 'journals'
        }));
        getDirsAndFiles();
    },[]);

    // Get payload each time obj.dateTime changes
    useEffect(() => {
        if (obj.dateTime) {
            getPayload();
        }
    }, [obj.dateTime]);

    // Check whether a file is being edited or not each time dir, filename, or dateTime changes
    useEffect(() => {
        if (fileInfo && obj.dateTime) {
            let editCheck = false;
            fileInfo.forEach((file) => {
                if (file.title === obj.filename &&
                    file.directory === obj.dir &&
                    file.dateTime.date === obj.dateTime.date &&
                    file.dateTime.time === obj.dateTime.time
                ) {
                    editCheck = true;
                }
            });
            setEditing(editCheck);
        }
    }, [obj.dir, obj.filename, obj.dateTime]);

    // set obj.dateTime to the last saved file of the same filename and directory
    useEffect(() => {
        if (fileInfo.length > 0) {
            const firstValidFile = fileInfo.slice().reverse().find((file) => file.title === obj.filename && file.directory === obj.dir);
            if (firstValidFile) {
                uponObjectInputChange(JSON.stringify(firstValidFile.dateTime), 'dateTime');
            }
        }
    }, [fileInfo, obj.filename, obj.dir]); // Runs when these dependencies change

    // Update object property with inputValue
    const uponInputChange = (inputValue, prop) => {
        setObj({ ...obj, [prop]: inputValue});
    };

    // Update object property with inputValue
    const uponObjectInputChange = (inputValue, prop) => {
        setObj({ ...obj, [prop]: JSON.parse(inputValue) });
    };

    // Get payload given relevant arguments
    const getPayload = async () => {
        try {
            const content = await fetchText(obj.table, obj.dateTime, obj.userID, obj.dir, obj.filename);
            setObj({ ...obj, payload: content });
        } catch {
            console.error('Error getting content with ',obj);
        }
    }

    const getDirsAndFiles = async () => {
        try {
            const dirsAndFiles = await fetchDirsAndFiles('journals', obj.userID);
            setFileInfo(dirsAndFiles.files);
            setDirs(dirsAndFiles.directories);
        } catch (err) {
            console.error('Error fetching journal dirs and files:', err);
        }
    };

    const saveJournal = async (overwrite) => {
        try {
            if (overwrite) {
                const response = await saveText(obj.table, obj.payload, obj.dateTime, obj.userID, obj.dir, obj.filename);
            } else {
                setObj({ ...obj, 'dateTime': { date: getDateString(), time: getTimeString() } });
                const response = await saveText(obj.table, obj.payload, { date: getDateString(), time: getTimeString() }, obj.userID, obj.dir, obj.filename);
            }
        } catch (err) {
            console.error('Error occurred while saving entry:', err);
        }
    };

    return(
        <div>
            <Functions printLevel={printLevel} selectFn={selectFn} />
            <div className="mainContainer">
                <button onClick={() => console.log(obj)}>Log</button>
                <div className="flexDivTable">
                    <div className="flexDivRows">
                        <p className="flexDivColumns">Directory:</p>
                        <input
                            className="flexDivColumns"
                            name='directory box'
                            list='dirs'
                            onChange={(e) => uponInputChange(e.target.value, 'dir')}
                        />
                        <datalist id='dirs'>
                            {dirs.length > 0 &&
                                dirs.map((name, index) => (
                                    <option key={index} value={name} />
                                ))}
                        </datalist>
                    </div>
                    <div className="flexDivRows">
                        <p className="flexDivColumns">Filename:</p>
                        <input
                            className="flexDivColumns"
                            name='filename box'
                            list='filenames'
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
                    <div className="flexDivRows">
                        <p className="flexDivColumns">Version:</p>
                        <select 
                            onChange={(e) => uponObjectInputChange(e.target.value, 'dateTime')}
                            >
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
                <textarea
                    name="journal box"
                    value={obj.payload}
                    onChange={(e) => uponInputChange(e.target.value, 'payload')}
                />
                <br></br>
                { // Render overwrite button if using previous file version
                    editing ?
                        <div>
                            <button onClick={() => saveJournal(true)}>Overwrite</button>
                            <button onClick={() => saveJournal(false)}>Save New</button>
                        </div>
                        :
                        <button onClick={() => saveJournal(false)}>Save</button>
                }
            </div>
        </div>
    );
}