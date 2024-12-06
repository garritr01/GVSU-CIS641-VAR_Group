import React, {
    useState, useEffect, useRef
} from 'react';

import {
    convertUTCDateTimeToLocal,
    newChooseMostRecentSimple,
    logCheck,
    formatDateTimeToString,
    formatSplitDateToString,
    convertUTCSplitDateToLocal,
    convertObjTimes
} from './oddsAndEnds';

import {
    newFetchDirsAndFiles, newFetchText, newFetchObject,
    newDeleteEntry
} from './generalFetch';

export const FileExplorer = ({ rookie, printLevel, selectFn, preselectedObj, setCurrentObj }) => {
    
    // Use object
    const [obj, setObj] = useState(preselectedObj);
    // Contains unique directories in table
    const [dirs, setDirs] = useState([]);
    // Contains filename, dir, and dateTime for each entry in table
    const [fileInfo, setFileInfo] = useState([]);

    // reset version, options, and payload when filename is emptied
    useEffect(() => {
        if (!obj.filename) {
            const updatedObj = { 
                ...obj, 
                dateTime: { date: '', time: '' },
                options: null,
                payload: null
            };
            setObj(updatedObj);
            if (logCheck(printLevel,['o']) === 1) {console.log('obj dateTime, options and payload cleared by filename change.')}
            else if (logCheck(printLevel, ['o']) === 2) {console.log('obj dateTime, options and payload cleared by filename change.', updatedObj)}
        }
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
        if (obj.table !== 'fileExplorer') {
            getDirsAndFiles(obj.table);
        }
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
                if (deleteLevel === 0) {
                    if (logCheck(printLevel,['d','b']) > 0) {console.log(`${obj.dir}/${obj.filename} version: (${formatDateTimeToString(obj.dateTime)}) succesfully deleted`)}
                    //unsetting handled for version delete in DisplayFile
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
                console.error(`Error deleting: file: '${obj.dir}/${obj.filename}' version (${obj.dateTime.date}-${obj.dateTime.time}) in '${obj.table}'`, err);
            } else if (deleteLevel === 1) {
                console.error(`Error deleting: all versions of file: '${obj.dir}/${obj.filename}' in '${obj.table}'`, err);
            } else if (deleteLevel === 2) {
                console.error(`Error deleting: dir: '${obj.dir} in '${obj.table}'`, err);
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
                    Custom UIs
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
const CascadingDropdown = ({ rookie, printLevel, dirs, fileInfo, handleDelete, obj, setObj }) => {

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
                // If obj.dir === file.dir for f.dir's full extent include the file
                if (file.dir === obj.dir.split('/').slice(0, file.dir.split('/').length).join('/')) {
                    return file.dir + '/' + file.filename;
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
                const newDir = name.split('/').slice(0, name.split('/').length - 1).join('/');
                setObj(prevState => 
                    ({ ...prevState, 
                    dir: newDir || '' }));
                if(logCheck(printLevel,['o']) === 2) {console.log(`Deselected. obj.dir is now ${newDir}`)}
            } else {
                setObj(prevState => ({ ...prevState, dir: name }));
                if(logCheck(printLevel,['o']) === 2) {console.log(`Selected new obj.dir: ${name}`)}
            }
        } else if (type === 'file') {
            // Act like a deselection
            if (name === obj.dir+'/'+obj.filename) {
                setObj(prevState => ({ ...prevState, filename: '' }));
                if(logCheck(printLevel,['o']) === 2) {console.log(`Deselected. obj.filename is now empty`)}

            } else {
                const newFilename = name.split('/')[name.split('/').length - 1];
                setObj(prevState => ({ ...prevState, filename: newFilename }));
                if(logCheck(printLevel,['o']) === 2) {console.log(`Selected new obj.filename: ${newFilename}`)}
            }
        } else {
            console.error(`${name} has type '${type} which is unrecognized.'`);
        }
    }

    return (
        <div>
            {/** Enable directory delete if it is not empty */
                obj.dir
                ?   <button className="flexDivRows" onClick={() => setOverlay({ type: 'delete', deleteLevel: 2 })}>
                        Delete {obj.dir} Recursively
                    </button>
                :   <button className="flexDivRows" style={{ color: 'gray' }}>
                        Delete {obj.dir} Recursively
                    </button>
            }
            <div className="flexDivColumns">
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
const DisplayFile = ({ rookie, printLevel, fileInfo, handleDelete, obj, setObj, setCurrentObj, selectFn }) => {

    // Contain dateTimes of selected table, file and dir
    const [versions, setVersions] = useState([]);

    const [overlay, setOverlay] = useState({});

    // Trigger version options grab upon filename existence or refreshKey change
    useEffect(() => {
        getVersions();
    },[obj.filename]);

    // Trigger payload grab upon dateTime existence
    useEffect(() => {
        if (obj.dateTime && obj.dateTime.date && obj.dateTime.time) {
            if (obj.table === 'journal') {
                getTextPayload();
            } else {
                getObjectPayload();
            }
        }
    },[obj.dateTime]);

    /** Filter to get all versions matching dir and filename */
    const getVersions = () => {
        const updatedVersions = fileInfo.map((file) => {
            if (obj.dir === file.dir &&
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
        else if (logCheck(printLevel, ['o']) === 2) { console.log(`obj.dateTime set to most recent version: ${convertUTCDateTimeToLocal(mostRecent).date}-${convertUTCDateTimeToLocal(mostRecent).time}`)}
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
                // Prevent endless fetch loop
                setObj(prevState => ({ ...updatedObj, dateTime: prevState.dateTime }));
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
                // prevent endless fetch loop
                setObj(prevState => ({ ...updatedObj, dateTime: prevState.dateTime }));
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
        // Convert any contained schedules and startEnd times
        setCurrentObj(prevState => convertObjTimes(prevState, true, false, true, true));
        if (obj.table === 'journal') {
            if (logCheck(printLevel,['b']) === 2) {console.log(`opening ${obj.table} to edit ${obj.dir}/${obj.filename} version: (${convertUTCDateTimeToLocal(obj.dateTime).date}-${convertUTCDateTimeToLocal(obj.dateTime).time}`)}
            selectFn('journal', false); // false blocks emptying of object
        } else if (obj.table === 'customUI') {
            if (logCheck(printLevel,['b']) === 2) {console.log(`opening ${obj.table} to edit ${obj.dir}/${obj.filename} version: (${convertUTCDateTimeToLocal(obj.dateTime).date}-${convertUTCDateTimeToLocal(obj.dateTime).time}`)}
            selectFn('customUI', false); // false blocks emptying of object
        } else if (obj.table === 'record') {
            if (logCheck(printLevel,['b']) === 2) {console.log(`opening ${obj.table} to edit ${obj.dir}/${obj.filename} version: (${convertUTCDateTimeToLocal(obj.dateTime).date}-${convertUTCDateTimeToLocal(obj.dateTime).time}`)}
            selectFn('record', false); // false blocks emptying of object
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
                            style={{ cursor: 'pointer' , border: obj.version === version ? '1px solid lightblue' : undefined }}
                            onClick={() => setObj(prevState => ({ ...prevState, dateTime: version }))}>
                            {formatDateTimeToString(version)}
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
                                        Delete Version {convertUTCDateTimeToLocal(obj.dateTime).date}
                                        -{convertUTCDateTimeToLocal(obj.dateTime).time}
                                </button>
                        }
                    </div>
                    {
                        typeof(obj.payload) === 'object' ?
                            <div>
                                <p>Options:</p>
                                <DisplayObject objToDisplay={obj.options} depth={0} keyOuter={0} />
                                <p>Payload:</p>
                                <DisplayObject objToDisplay={obj.payload} depth={0} keyOuter={0} />
                            </div>
                        :   typeof(obj.payload) === 'string' ?
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
                            {convertUTCDateTimeToLocal(obj.dateTime).date}-{convertUTCDateTimeToLocal(obj.dateTime).time}?</p>
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
                                        {convertUTCDateTimeToLocal(obj.dateTime).date}-{convertUTCDateTimeToLocal(obj.dateTime).time}&nbsp;
                                        and all its contents?</p>
                                :   <p>Unrecognized delete method. Press No!</p>
                            }
                            <div>
                                <button onClick={() => {
                                    if (overlay.deleteLevel === 0) {
                                        const updatedVersions = versions.filter((version) => (
                                            version.date !== obj.dateTime.date || version.time !== obj.dateTime.time
                                        ));
                                        setVersions(updatedVersions);
                                        const mostRecent = newChooseMostRecentSimple(updatedVersions);
                                        setObj(prevState => ({ ...prevState, dateTime: mostRecent }));
                                        /*if (logCheck(printLevel, ['s']) === 1) { */console.log('versions filtered by delete.');
                                        /*else if (logCheck(printLevel, ['s']) === 2) { */console.log('versions filtered by delete:\n', updatedVersions);
                                        /*if (logCheck(printLevel, ['o']) === 1) { */console.log('obj.dateTime set to most recent version after delete.');
                                        /*else if (logCheck(printLevel, ['o']) === 2) { */console.log(`obj.dateTime set to most recent version after delete: ${convertUTCDateTimeToLocal(mostRecent).date}-${convertUTCDateTimeToLocal(mostRecent).time}`);
                                    }
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
const DisplayObject = ({ rookie, objToDisplay, depth, keyOuter }) => (
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
                        : value.type === 'start' || value.type === 'end' ?
                            <div key={keyOuter+'-'+i}>
                                <p>{value.type}: {formatSplitDateToString(value)}</p>
                            </div>
                        :   <div key={keyOuter+'-'+i} style={{ border: '1px solid black'}}>
                                <p className="flexDivRows">Unrecognized type: {value.type}</p>
                                <DisplayObject objToDisplay={value} depth={depth+1} keyOuter={keyOuter+1} />
                            </div>
                    : <DisplayObject objToDisplay={value} depth={depth} keyOuter={keyOuter+1} />
                ))
            :   Object.entries(objToDisplay).map(([key, value]) => (
                   <div key={keyOuter+'-'+key} style={{ border: '1px solid black'}}>
                       {typeof value === "object" && ['start', 'end', 'effectiveStart', 'effectiveEnd'].includes(key) ? (
                            <div>
                                <p>{key}: {formatSplitDateToString(value)}</p>
                            </div>
                        ) : typeof value === "object" ? (
                        <div>
                            <p>{key}: </p>
                            <DisplayObject objToDisplay={value} depth={depth + 1} keyOuter={keyOuter + 1} />
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