import React, { useState, useEffect, useRef 
} from 'react';

import {convertUTCstringsToLocal
} from './oddsAndEnds';

import { fetchDateTimes, fetchDirsAndFiles, deleteEntry,
    fetchText, fetchObject, fetchStringInstances
} from './generalFetch';

import { EditMiscObject 
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
            const dirsAndFiles = await fetchDirsAndFiles(table, 'Garrit');
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
        console.log('handling deletion of ', selectedTable, selectedDirectory, title, version);
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
                <EditMiscObject selectFn={selectFn}
                    preselectedTable={selectedTable}
                    preselectedDir={selectedDirectory}
                    preselectedTitle={selectedTitle}
                    preselectedVersion={selectedVersion} />
            }
        </div>
    );
}