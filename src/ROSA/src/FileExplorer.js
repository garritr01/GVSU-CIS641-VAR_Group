import React, {
    useState, useEffect, useRef
} from 'react';

import {
    chooseMostRecent,
    convertUTCstringsToLocal,
    newChooseMostRecent,
    newChooseMostRecentSimple,
    logCheck
} from './oddsAndEnds';

import {
    fetchDateTimes, fetchDirsAndFiles, deleteEntry,
    fetchText, fetchObject, fetchStringInstances,
    newFetchDirsAndFiles, newFetchText, newFetchObject,
    newDeleteEntry
} from './generalFetch';

import {
    EditMiscObject
} from './DirectEdit';


/** Allows user to access their files easily */
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
            const dirsAndFiles = await fetchDirsAndFiles(table, 'garritr01');
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
            const relevantFiles = await fetchStringInstances(selectedTable, 'garritr01', searchString);
            setDiscoveredFiles(relevantFiles);
        } catch (err) {
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
                            const content = await fetchText(selectedTable, listOfVersionsTemp[0], 'garritr01', selectedDirectory, file.title);
                            setFileContent(content);
                        } else {
                            const content = await fetchObject(selectedTable, listOfVersionsTemp[0], 'garritr01', selectedDirectory, file.title);
                            setFileContent(content);
                        }
                    } catch (err) {
                        console.error('Error fetching file content:', err);
                    }
                }
            } else {
                try {
                    console.log('attempting time versions');
                    const content = await fetchDateTimes(selectedTable, 'garritr01', selectedDirectory, file.title);
                    setListOfVersions(content);
                } catch (err) {
                    console.log('Error fetching file:', err);
                }
            }
        }
        setDblCheckDeleteFile(false);
        setDblCheckDeleteVersion(false);
    };

    const handleVersionClick = async (version) => {
        console.log('selected version:', version);
        if (selectedVersion === version) {
            setSelectedVersion(null);
            setFileContent(null);
        } else {
            setSelectedVersion(version);
            try {
                if (selectedTable === 'journals') {
                    const content = await fetchText(selectedTable, version, 'garritr01', selectedDirectory, selectedTitle);
                    setFileContent(content);
                } else {
                    const content = await fetchObject(selectedTable, version, 'garritr01', selectedDirectory, selectedTitle);
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
        console.log('handling deletion of ', selectedTable, selectedDirectory, title, version);
        setDblCheckDeleteVersion(false);
        setDblCheckDeleteFile(false);
        setDblCheckDeleteDir(false);
        setFileContent(null);
        try {
            const responseMsg = await deleteEntry(selectedTable, version, 'garritr01', directory, title);
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
            if (file.directory.split('/').slice(0, selectedDirectory.split('/').length).join('/') === selectedDirectory) {
                handleFileDeleting(file.directory, file.title);
            }
        }
        if (selectedDirectory.split('/').length !== 1) {
            setSelectedDirectory(selectedDirectory.split('/').slice(0, -1).join('/'));
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
                    { title: element.split('/').slice(0, selectedDirectory.split('/').length + 1).join('/'), isFile: false }
                ))
            );
            const filteredListNoDupes = filteredListNoFiles.filter((obj, index, self) =>
                index === self.findIndex((o) => o.title === obj.title)
            );
            // adds files with dir matching selectedDirectory
            filteredList = filteredListNoDupes.concat(listOfFiles
                .filter((element, index, self) => (
                    element.directory === selectedDirectory &&
                    index === self.findIndex((o) => o.directory === element.directory && o.title === element.title)
                )).map((element) => ({ ...element, isFile: true })
                ));
        } else {
            // initial list of directories
            filteredList = listOfDirs.map((element) => {
                if (element.split('/').length === 1) {
                    // if no subdirs
                    return { title: element, isFile: false };
                } else if (!listOfDirs.includes(element.split('/')[0])) {
                    // leading dir if not present alone
                    return { title: element.split('/')[0], isFile: false };
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
                            {discoveredFiles.length > 0 &&
                                discoveredFiles.map((file, index) =>
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
                            <button onClick={() => handleDirectoryDeleting()}>Yes</button>
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
                        Recursively Delete {selectedDirectory + '/' + selectedTitle}
                    </button>
                    {dblCheckDeleteFile &&
                        <div>
                            <p>Are you sure?</p>
                            <button onClick={() => handleFileDeleting(selectedDirectory, selectedTitle)}>Yes</button>
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
                    <h3>{selectedDirectory + '/' + selectedTitle + ' - ' + convertUTCstringsToLocal(selectedVersion).date + ' ' + convertUTCstringsToLocal(selectedVersion).time}</h3>
                    <button onClick={() => handleContentEditing()}>Edit Content</button>
                    <button onClick={() => setDblCheckDeleteVersion(true)}>Delete File</button>
                    {dblCheckDeleteVersion &&
                        <div>
                            <p>Are you sure?</p>
                            <button onClick={() => handleVersionDeleting(selectedDirectory, selectedTitle, selectedVersion)}>Yes</button>
                            <button onClick={() => setDblCheckDeleteVersion(false)}>No</button>
                        </div>
                    }
                </div>
            }
            {fileContent && selectedTable === 'journals' &&
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
            {fileContent && (selectedTable === 'customInfo' ||
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
            {fileContent && (selectedTable === 'miscDropdowns' ||
                selectedTable === 'timeRecords' ||
                selectedTable === 'quickNote' ||
                selectedTable === 'resolvedEvents' ||
                selectedTable === 'scheduledEvents' ||
                selectedTable === 'miscObject2') &&
                <EditMiscObject 
                    printLevel={printLevel}
                    selectFn={selectFn}
                    preselectedTable={selectedTable}
                    preselectedDir={selectedDirectory}
                    preselectedTitle={selectedTitle}
                    preselectedVersion={selectedVersion} />
            }
        </div>
    );
}

export const NewFileExplorer = ({ printLevel, selectFn, preselectedObj, setCurrentObj }) => {
    
    // Use object
    const [obj, setObj] = useState(preselectedObj);
    // Contains unique directories in table
    const [dirs, setDirs] = useState([]);
    // Contains filename, dir, and dateTime for each entry in table
    const [fileInfo, setFileInfo] = useState([]);

    // reset version, options, and payload upon filename change
    useEffect(() => {
        const updatedObj = { 
            ...obj, 
            dateTime: { date: '', time: '' },
            options: null,
            payload: null
        };
        setObj(updatedObj);
        if (logCheck(printLevel,['o']) === 1) {console.log('obj dateTime, options and payload cleared by filename change.')}
        else if (logCheck(printLevel, ['o']) === 2) {console.log('obj dateTime, options and payload cleared by filename change.', updatedObj)}
    },[obj.filename]);
    // reset filename upon dir change
    useEffect(() => {
        const updatedObj = { ...obj, filename: '' };
        setObj(updatedObj);
        if (logCheck(printLevel, ['o']) === 1) { console.log('obj filename cleared by dir change.') }
        else if (logCheck(printLevel, ['o']) === 2) { console.log('obj filename cleared by dir change.', updatedObj) }
    },[obj.dir]);
    // reset dir upon table change
    useEffect(() => {
        const updatedObj = { ...obj, dir: '' };
        setObj(updatedObj);
        if (logCheck(printLevel, ['o']) === 1) { console.log('obj dir cleared by table change.') }
        else if (logCheck(printLevel, ['o']) === 2) { console.log('obj dir cleared by table change.', updatedObj) }
        getDirsAndFiles(obj.table);
    },[obj.table]);

    const getDirsAndFiles = async (table) => {
        try {
            const response = await newFetchDirsAndFiles(table, obj.userID);
            if (response.truth) {
                setFileInfo(response.files);
                setDirs(response.dirs);
                if (logCheck(printLevel, ['s','d']) === 1) { console.log(`directory and fileInfo of '${obj.table}' returned.`) }
                else if (logCheck(printLevel, ['s','d']) === 2) { console.log(`directory and fileInfo of '${obj.table}' returned.`,'dirs:',response.files,'files:',response.files) }
            } else {
                setFileInfo([]);
                setDirs([]);
                throw new Error(`${response.status} Error: ${response.msg}`);
            }
        } catch (err) {
            console.error(`Error fetching '${table}' dirs and files:`, err);
        }
    };

    const handleDelete = async (deleteLevel) => {
        try {
            let response = { truth: false, status: 999, msg: 'no response' };
            if (deleteLevel === 0) {
                response = await newDeleteEntry(obj.table, obj.dateTime, obj.userID, obj.dir, obj.filename);
            } else if (deleteLevel === 1) {
                response = await newDeleteEntry(obj.table, '', obj.userID, obj.dir, obj.filename);
            } else if (deleteLevel === 2) {
                response = await newDeleteEntry(obj.table, '', obj.userID, obj.dir, '');
            } else {
                throw new Error(`deleteLevel: '${deleteLevel}' is unaccounted for`);
            }
            if (response.truth) {
                console.log(`Successfully deleted ${obj.dir}/${obj.filename} version: (${obj.dateTime.time}-${obj.dateTime.time})`);
                if (deleteLevel === 0) {
                    if (logCheck(printLevel,['d','b']) > 0) {console.log(`file: '${obj.dir}/${obj.filename}' version (${obj.dateTime.date}-${obj.dateTime.time}) in '${obj.table}' successfully deleted.`)}
                    setObj(prevState => ({ ...prevState, dateTime: { date: '', time: '' }, options: null, payload: null }));
                } else if (deleteLevel === 1) {
                    if (logCheck(printLevel, ['d', 'b']) > 0) { console.log(`all versions of file: '${obj.dir}/${obj.filename}' in '${obj.table}' successfully deleted.`)}
                    setObj(prevState => ({ ...prevState, filename: '', dateTime: { date: '', time: '' }, options: null, payload: null }));
                } else if (deleteLevel === 2) {
                    if (logCheck(printLevel, ['d', 'b']) > 0) { console.log(`dir: '${obj.dir} in '${obj.table}' successfully deleted.`)}
                    setObj(prevState => ({ ...prevState, dir: '', dateTime: { date: '', time: '' }, options: null, payload: null }));
                }
                // get updates dirs and files after deletion
                getDirsAndFiles(obj.table);
            } else {
                throw new Error(`${response.status} Error: ${response.message}`);
            }
        } catch (err) {
            if (deleteLevel === 0) {
                console.log(`Error deleting: file: '${obj.dir}/${obj.filename}' version (${obj.dateTime.date}-${obj.dateTime.time}) in '${obj.table}'`, err);
            } else if (deleteLevel === 1) {
                console.log(`Error deleting: all versions of file: '${obj.dir}/${obj.filename}' in '${obj.table}'`, err);
            } else if (deleteLevel === 2) {
                console.log(`Error deleting: dir: '${obj.dir} in '${obj.table}'`, err);
            } else {
                console.error(err);
            }
        }
    };

    return (
        <div className='mainContainer'>
            <button onClick={() => console.log(obj)}>Log</button>
            <button onClick={() => console.log(typeof(obj.payload))}>payload type log</button>
            <h3>Tables</h3>
            <div className="flexDivRows">
                <p  style={{ cursor: 'pointer' }}
                    onClick={() => setObj(prevState => ({ ...prevState, table: 'journal' }))}>
                    Journals
                </p>
                <p  style={{ cursor: 'pointer' }}
                    onClick={() => setObj(prevState => ({ ...prevState, table: 'customUI' }))}>
                    Custom UI
                </p>
                <p  style={{ cursor: 'pointer' }}
                    onClick={() => setObj(prevState => ({ ...prevState, table: 'record' }))}>
                    Records
                </p>
            </div>
            {// Render directory and file selection
                obj.table &&
                    <CascadingDropdown printLevel={printLevel}
                        dirs={dirs} fileInfo={fileInfo} handleDelete={handleDelete}
                        obj={obj} setObj={setObj}/>
            }
            {// Render file versions, options, and payload of text
                obj.filename &&
                    <DisplayFile printLevel={printLevel}
                        fileInfo={fileInfo} handleDelete={handleDelete}
                        obj={obj} setObj={setObj} 
                        setCurrentObj={setCurrentObj} selectFn={selectFn}/>
            }
        </div>
    );
}

/** Display dropdown of directory and files */
const CascadingDropdown = ({ printLevel, dirs, fileInfo, handleDelete, obj, setObj }) => {

    const [outOptions, setOutOptions] = useState([]);
    const [overlay, setOverlay] = useState({});

    // Filter upon new dirs (new table loads new dirs)
    // Or upon new obj.dir (dir clicked)
    useEffect(() => {
        filter();
    },[obj.dir, dirs])

    /** Creates an array of filtered directories
     * includes all dir.split('/').slice(0,x) 
     * where obj.dir.split('/').slice(0,x-1) === dir.split('/').slice(0,x-1)
     */
    const filter = () => {
        let newDirs = [...new Set(
                dirs.map((dir) => (dir.split('/')[0] || null))
                .filter((dir) => (dir !== null))
        )];

        if (obj.dirs !== '') {
            for (let i = 1; i < obj.dir.split('/').length + 1; i++) {
                // Get all subdirectories of obj.dir
                const filteredDirs = dirs.map((dir) => {

                    if ((dir.split('/').slice(0,i).join('/') === 
                        obj.dir.split('/').slice(0,i).join('/'))
                        && dir.split('/').length > i) {
                            return dir.split('/').slice(0, i+1).join('/');
                    } else {
                        return null;
                    }

                }).filter((dir) => (dir !== null));
                newDirs = [...newDirs, ...new Set(filteredDirs)];
            }

            // Add dir+filename fileInfo entries that match directories in newDirs 
            // that are not subdirectories of obj.dir and include type: 'file'
            const newFiles = fileInfo.map((file) => {
                // If obj.dir === file.directory for f.dir's full extent include the file
                if (file.directory === obj.dir.split('/').slice(0, file.directory.split('/').length).join('/')) {
                    return file.directory + '/' + file.filename;
                } else {
                    return null;
                }
            }).filter((file) => file !== null)

            // Add type 'dir' to all before adding files
            newDirs = [...newDirs.map((dir) => ({ type: 'dir', name: dir })), 
                ...[...new Set(newFiles)].map((file) => ({ type: 'file', name: file }))];
        } else {
            newDirs = [...newDirs.map((dir) => ({ type: 'dir', name: dir }))];
        }

        // Sort newDirs by name
        newDirs = newDirs.sort((a, b) => a.name.localeCompare(b.name));

        setOutOptions(newDirs);
        if (logCheck(printLevel,['s']) === 2) {console.log('dirs and files filtered: \n',newDirs)}
    }

    const handleClick = ({ type, name }) => {
        console.log(`selected ${type}: ${name}`);

        if (type === 'dir') {
            // Act like a deselection
            if (name === obj.dir) {
                setObj(prevState => 
                    ({ ...prevState, 
                    dir: name.split('/').slice(0,name.split('/').length - 1).join('/') || '' }));
            } else {
                setObj(prevState => ({ ...prevState, dir: name }));
            }
        } else if (type === 'file') {
            // Act like a deselection
            if (name === obj.dir) {
                setObj(prevState => ({ ...prevState, filename: '' }));
            } else {
                setObj(prevState => ({ ...prevState, filename: name.split('/')[name.split('/').length - 1] }));
            }
        } else {
            console.error(`${name} has type '${type} which is unrecognized.'`);
        }
    }

    return (
        <div>
            <div className="flexDivColumns">
                <button 
                    className="flexDivRows"
                    onClick={() => setOverlay({
                        type: 'delete',
                        deleteLevel: 2
                    })}>
                    Delete {obj.dir} Recursively
                </button>
                { /** Display directories and files currently available */
                    outOptions.length > 0 &&
                    outOptions.map((option, i) => (
                        <div className="flexDivRows" key={i}>
                            {
                                option.name.split('/').slice(1).map((text, iBuffer) => (
                                    <div key={iBuffer} 
                                        style={{
                                        width: '4px',
                                        borderLeft: '1px solid black'
                                    }}/>
                                ))
                            }
                            <p
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleClick(option)}
                                >
                                {option.name.split('/')[option.name.split('/').length - 1]}
                            </p>
                        </div>
                        )
                    )
                }
            </div>
            { /** Overlay with delete inquiry */
                overlay.type === 'delete' &&
                    <div className="overlay">
                        <div className="flexDivColumns">
                            <p>Are you certain you want to delete {obj.dir} and all its contents?</p>
                            <div>
                                <button onClick={() => {
                                    handleDelete(overlay.deleteLevel);
                                    setOverlay({});
                                }}>Yes</button>
                                <button onClick={() => setOverlay({})}>No</button>
                            </div>
                        </div>
                    </div>
            }
        </div>
    );
}

/** Display File, allow version selection, and handle deleting or editing */
const DisplayFile = ({ printLevel, fileInfo, handleDelete, obj, setObj, setCurrentObj, selectFn }) => {

    // Contain dateTimes of selected table, file and dir
    const [versions, setVersions] = useState([]);

    const [overlay, setOverlay] = useState({});

    // Trigger version options grab upon filename existence
    useEffect(() => {
        getVersions();
    },[obj.filename]);

    // Trigger payload grab upon dateTime existence
    useEffect(() => {
        if (obj.dateTime && obj.dateTime.date && obj.dateTime.time) {
            if (obj.table === 'journals') {
                getTextPayload();
            } else {
                getObjectPayload();
            }
        }
    },[obj.dateTime]);

    /** Filter to get all versions matching dir and filename */
    const getVersions = () => {
        const updatedVersions = fileInfo.map((file) => {
            if (obj.dir === file.directory &&
                obj.filename === file.filename) {
                    return file.dateTime;
            } else {
                return null;
            }
        }).filter((v) => v !== null);
        const mostRecent = newChooseMostRecentSimple(updatedVersions);
        setObj(prevState => ({ 
            ...prevState, 
            dateTime: mostRecent
        }));
        setVersions(updatedVersions);
        if(logCheck(printLevel,['s']) === 1) {console.log('versions filtered.')}
        else if(logCheck(printLevel,['s']) === 2) {console.log('versions filtered:\n',updatedVersions)}
        if(logCheck(printLevel,['o']) === 1) {console.log('obj.dateTime set to most recent version.')}
        else if (logCheck(printLevel, ['o']) === 2) { console.log(`obj.dateTime set to most recent version: ${convertUTCstringsToLocal(mostRecent).date}-${convertUTCstringsToLocal(mostRecent).time}`)}
    }

    /** Get payload and options given relevant arguments */
    const getTextPayload = async () => {
        try {
            const response = await newFetchText(obj);

            if (!response.truth) {
                throw new Error(`${response.status} Error getting ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time}):\n ${response.msg}`);
            } else {
                const updatedObj = {
                    ...obj,
                    options: response.options,
                    payload: response.payload
                };
                setObj(updatedObj);
                if (logCheck(printLevel, ['d', 'b']) > 1) { console.log(`Succesfully retrieved ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time})`)}
                if (logCheck(printLevel, ['o']) === 1) {console.log('obj updated by fetch')}
                else if (logCheck(printLevel, ['o']) === 2) {console.log('obj updated by fetch\n obj:', updatedObj)}
            }
        } catch (err) {
            console.error(`Error fetching text from ${obj.table}:`, err);
        }
    }
    
    /** Get payload and options given relevant arguments */
    const getObjectPayload = async () => {
        try {
            const response = await newFetchObject(obj);
            if (!response.truth) {
                throw new Error(`${response.status} Error getting ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time}):\n ${response.msg}`);
            } else {
                const updatedObj = {
                    ...obj,
                    options: response.options,
                    payload: response.payload
                };
                setObj(updatedObj);
                if (logCheck(printLevel, ['d', 'b']) > 1) { console.log(`Succesfully retrieved ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time})`)}
                if (logCheck(printLevel, ['o']) === 1) {console.log('obj updated by fetch')}
                else if (logCheck(printLevel, ['o']) === 2) {console.log('obj updated by fetch\n obj:', updatedObj)}
            }
        } catch (err) {
            console.error(`Error fetching object from ${obj.table}:`, err);
        }
    }

    /** Choose function to reroute to
     * This will need updating constantly as new functions are added
     */
    const handleFunctionSelection = () => {
        if (obj.table === 'journal') {
            if (logCheck(printLevel,['b']) === 2) {console.log(`opening ${obj.table} to edit ${obj.dir}/${obj.filename} version: (${convertUTCstringsToLocal(obj.dateTime).date}-${convertUTCstringsToLocal(obj.dateTime).time}`)}
            selectFn('journal');
        } else if (obj.table === 'customUI') {
            if (logCheck(printLevel,['b']) === 2) {console.log(`opening ${obj.table} to edit ${obj.dir}/${obj.filename} version: (${convertUTCstringsToLocal(obj.dateTime).date}-${convertUTCstringsToLocal(obj.dateTime).time}`)}
            selectFn('customUI');
        } else if (obj.table === 'record') {
            if (logCheck(printLevel,['b']) === 2) {console.log(`opening ${obj.table} to edit ${obj.dir}/${obj.filename} version: (${convertUTCstringsToLocal(obj.dateTime).date}-${convertUTCstringsToLocal(obj.dateTime).time}`)}
            selectFn('record');
        } else {
            console.error(`${obj.table} has no defined reroute to allow editing!`);
        }
    }

    return (
        <div>
            {/** Version Selection Row */}
            <div className="flexDivRows">
                {
                    versions.map((version,i) => (
                        <p  key={'version'+i}
                            style={{ cursor: 'pointer' }}
                            onClick={() => setObj(prevState => ({ ...prevState, dateTime: version }))}>
                            {convertUTCstringsToLocal(version).date}-{convertUTCstringsToLocal(version).time}
                        </p>
                    ))
                }
            </div>
            {/** Provide Delete and Edit Options and display options and payload*/
                obj.payload &&
                <div>
                    <div className="flexDivRows">
                        <button onClick={() => setOverlay({
                            type: 'edit'
                            })}>
                            Edit
                        </button>
                        <button onClick={() => setOverlay({
                            type: 'delete',
                            deleteLevel: 1
                        })}>
                            Delete {obj.filename} Recursively
                        </button>
                        { //Don't render version deletion if only one version
                            versions.length > 1 &&
                                <button onClick={() => setOverlay({
                                    type: 'delete',
                                    deleteLevel: 0
                                    })}>
                                        Delete Version {convertUTCstringsToLocal(obj.dateTime).date}
                                        -{convertUTCstringsToLocal(obj.dateTime).time}
                                </button>
                        }
                    </div>
                    {
                        typeof(obj.payload) !== 'string' ?
                            <div>
                                <p>Options:</p>
                                <DisplayObject objToDisplay={obj.options} depth={0} keyOuter={0} />
                                <p>Payload:</p>
                                <DisplayObject objToDisplay={obj.payload} depth={0} keyOuter={0} />
                            </div>
                        :   typeof(obj.payload) === 'object' ?
                            <div>
                                <p>Options:</p>
                                <DisplayObject objToDisplay={obj.options} depth={0} keyOuter={0} />
                                <p>Payload:</p>
                                <textarea readOnly value={obj.payload}/>
                            </div>
                        :   <p>Cannot Display options and payload</p>
                    }
                </div>
            }
            {/** Overlay content with edit inquiry */
                overlay.type === 'edit' &&
                <div className="overlay">
                    <div className="flexDivColumns">
                        <p>Continue to be redirected to edit {obj.dir}/{obj.filename}, version: 
                            {convertUTCstringsToLocal(obj.dateTime).date}-{convertUTCstringsToLocal(obj.dateTime).time}?</p>
                        <div>
                            <button onClick={() => {
                                setOverlay({});
                                setCurrentObj(obj);
                                handleFunctionSelection();
                            }}>Yes</button>
                            <button onClick={() => setOverlay({})}>No</button>
                        </div>
                    </div>
                </div>
            }
            {/** Overlay content with delete inquiry */
                overlay.type === 'delete' &&
                    <div className="overlay">
                        <div className="flexDivColumns">
                            {   
                                overlay.deleteLevel === 1 ?
                                    <p>Are you certain you want to delete {obj.dir}/{obj.filename} and all its contents?</p>
                                : overlay.deleteLevel === 0 ?
                                    <p>Are you certain you want to delete {obj.dir}/{obj.filename}, version&nbsp;
                                        {convertUTCstringsToLocal(obj.dateTime).date}-{convertUTCstringsToLocal(obj.dateTime).time}&nbsp;
                                        and all its contents?</p>
                                :   <p>Unrecognized delete method. Press No!</p>
                            }
                            <div>
                                <button onClick={() => {
                                    handleDelete(overlay.deleteLevel);
                                    setOverlay({});
                                }}>Yes</button>
                                <button onClick={() => setOverlay({})}>No</button>
                            </div>
                        </div>
                    </div>
            }
        </div>
    );
}

/** Display predicted elements in a defined manner or use best effort attempt */
const DisplayObject = ({ objToDisplay, depth, keyOuter }) => (
    <div style={{ marginLeft: `${depth*2}%`, border: '1px solid black' }} key={keyOuter}>
        {   // Display array in controlled manner or recall DisplayObject
            !objToDisplay ?
                <p>{
                    objToDisplay === false
                    ? 'falsy'
                    : objToDisplay === null
                    ? 'null value'
                    : objToDisplay === undefined
                    ? 'undefined value'
                    : Number.isNaN(objToDisplay)
                    ? 'NaN'
                    : typeof objToDisplay === "symbol"
                    ? 'symbol'
                    : typeof objToDisplay === "bigint"
                    ? 'bigint'
                    : typeof objToDisplay === "string" && objToDisplay.trim() === ""
                    ? 'empty string'
                    : objToDisplay
                }</p>
            :   Array.isArray(objToDisplay) ?
                objToDisplay.map((value, i) => (
                    // Display defined UI elements
                    value.type ?
                        value.type === 'toggle' ?
                            <div className="flexDivRows" key={keyOuter+'-'+i} style={{ border: '1px solid black'}}>
                                <p>Group {value.group} Button Element: </p>
                                <button className="flexDivRows" 
                                    style={{ color: value.value && value.value === true ? 'gray' : undefined }}>
                                    {value.label}
                                </button>
                            </div>
                        : value.type === 'choice' ?
                            <div  key={keyOuter+'-'+i} style={{ border: '1px solid black'}}>
                                <div className="flexDivRows">
                                    <p>Group {value.group} Multiple Choice Element: </p>
                                    <p>{value.label}</p>
                                </div>
                                <div className="flexDivRows">
                                    <p>Options: </p>
                                    {
                                        value.choices.map((choice, iChoice) => (
                                            <button key={keyOuter+'-'+i+'-'+iChoice}
                                                style={{ color: value.value && value.value === choice ? 'gray' : undefined }}>
                                                {choice}
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>
                        : value.type === 'input' ?
                            <div className="flexDivRows" key={keyOuter+'-'+i} style={{ border: '1px solid black'}}>
                                <p>Group {value.group} Input Element: </p>
                                <p>{value.label}:</p>
                                {
                                    value.value.map((inVal, iVal) => (
                                        <input readOnly key={keyOuter+'-'+i+'-'+iVal} value={inVal ? inVal : ''} />
                                    ))
                                }
                            </div>
                        : value.type === 'text' ?
                            <div key={keyOuter+'-'+i}>
                                <div className="flexDivRows" style={{ border: '1px solid black'}}>
                                    <p>Group {value.group} Text Element: </p>
                                    <p>{value.label}:</p>
                                </div>
                                <input readOnly value={value.value ? value.value : ''}/>
                            </div>
                        :   <div key={keyOuter+'-'+i} style={{ border: '1px solid black'}}>
                                <p className="flexDivRows">Unrecognized type: {value.type}</p>
                                <DisplayObject objToDisplay={value} depth={depth+1} keyOuter={keyOuter+1} />
                            </div>
                    : <DisplayObject objToDisplay={value} depth={depth} keyOuter={keyOuter+1} />
                ))
            :   Object.entries(objToDisplay).map(([key, value]) => (
                   <div key={keyOuter+'-'+key} style={{ border: '1px solid black'}}>
                       {typeof value === "object" ? (
                            <div>
                                <p>{key}: </p>
                                <DisplayObject objToDisplay={value} depth={depth + 1} keyOuter={keyOuter+1} />
                            </div>
                       ) : (
                            <p className="flexDivRows">
                                {key}:&nbsp;
                                {
                                    value === true
                                    ? 'truthy'
                                    : value === false
                                    ? 'falsy'
                                    : value === null
                                    ? 'null value'
                                    : value === undefined
                                    ? 'undefined value'
                                    : Number.isNaN(value)
                                    ? 'NaN'
                                    : typeof value === "symbol"
                                    ? 'symbol'
                                    : typeof value === "bigint"
                                    ? 'bigint'
                                    : typeof value === "string" && value.trim() === ""
                                    ? 'empty string'
                                    : value
                                }
                            </p>
                       )}
                   </div>
                ))
        }
    </div>
)