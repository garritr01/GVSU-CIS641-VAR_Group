import React, {
  useState, useEffect
} from 'react';

import { 
  logCheck, newChooseMostRecent, convertUTCstringsToLocal 
} from './oddsAndEnds';

import { newFetchDirsAndFiles } from './generalFetch';

/** Renders the buttons for choosing functions on the main menu */
export const Functions = ({ printLevel, selectFn, setUserID }) => {

  // select a function based on funcName
  const anyPress = (funcName) => {
    if (logCheck(printLevel, ['b']) === 2) { console.log(`selected function '${funcName}'`) }
    selectFn(funcName);
  };

  // renders the buttons for selecting different functions on the main menu
  return (
    <div className="stickyHeader">
      <div style={({ width: '90%' })}>
        <button onClick={() => anyPress("main")}>Main Menu</button>
        {/* <button onClick={() => anyPress("file manager")}>File Manager</button> */}
        <button onClick={() => anyPress("fileExplorer")}>File Manager</button>
        {/* <button onClick={() => anyPress("journals")}>Journal</button> */}
        <button onClick={() => anyPress("journal")}>Journal</button>
        {/* <button onClick={() => anyPress("customInfo")}>Custom Record</button> */}
        <button onClick={() => anyPress("record")}>Record</button>
        {/* <button onClick={() => anyPress("customClockIn")}>Clock In</button> */}
        {/* <button onClick={() => anyPress("scheduledEvents")}>Schedule Event</button> */}
        <button onClick={() => anyPress("customUI")}>Custom UI</button>
        {/* <button onClick={() => anyPress("quick note")}>Quick Note</button> */}
        {/* <button onClick={() => anyPress("schedule view")}>Calendar</button> */}

        {/* The below buttons can be rendered for infrequently used functions. Code found in manualEdit.js*/}
        {/*<button onClick={() => alterMatches("CustomUI", null, null,"Earning ($)","Earning ($)", "earning")}>Alter UI</button>*/}
        {/*<button onClick={() => createCustomUIDropdown()}>CustomUI Dropdown</button>*/}
        {/*<button onClick={() => createCustomInfoDropdowns()}>CustomInfo Dropdowns</button>*/}
        {/*<button onClick={() => convertSchedules()}>Convert Schedules</button>*/}
        {/*<button onClick={() => moveTables()}>Move Tables</button>*/}
      </div>
      <div style={({ width: '10%' })}>
        <button
          onClick={() => {
            setUserID('');
            selectFn("login");
          }}>
          Log Out
        </button>
      </div>
    </div>
  );
}

export const FileAccess = ({ printLevel, defaultPayload, obj, setObj, loadedInfo, savedInfo, getFile, saveFile }) => {

  // Info for dropdown menus
  const [dirs, setDirs] = useState([]);
  const [fileInfo, setFileInfo] = useState([]);

  // Fetch dirs and files on load and when savedInfo changes
  // Also empty payload and options on savedInfo changes
  useEffect(() => {
    if (savedInfo?.truth) {
      setObj(prevState => ({ ...prevState, options: null, payload: defaultPayload }));
      if (logCheck(printLevel, ['o']) === 1) { console.log(`obj.options and obj.payload emptied`) }
      else if (logCheck(printLevel, ['o']) === 2) {console.log(`obj.options set to 'null'\n obj.payload set to '${defaultPayload}' ('null' is null, not a string)`)}
    }
    getDirsAndFiles();
  },[savedInfo])

  // Empties filename if dir is changed
  useEffect(() => {
    if (logCheck(printLevel,['o']) === 2) {console.log('obj.filename emptied')}
    setObj(prevObj => ({ ...prevObj, filename: '' }));
  }, [obj.dir]);

  // Autofills or empties dateTime when dir or filename is changed
  useEffect(() => {
    if (fileInfo.map(i => i.directory).includes(obj.dir) && fileInfo.map(i => i.filename).includes(obj.filename)) {
      const mostRecent = newChooseMostRecent(fileInfo, obj.dir, obj.filename);
      if (logCheck(printLevel,['o']) === 2) {console.log(`obj.dateTime set to '${mostRecent.date}'-'${mostRecent.time}'`)}
      setObj(prevState => ({ ...prevState, dateTime: mostRecent }));
    } else {
      setObj(prevState => ({ ...prevState, dateTime: { date: '', time: '' } }));
      if (logCheck(printLevel,['o']) === 2) {console.log(`obj.dateTime emptied`)}
    }
  }, [obj.dir, obj.filename]);

  /** Gets dirs and files where directories is all unqiue directories and
  * files is an array of objects containing dateTime, directory, and filename
  */
  const getDirsAndFiles = async () => {
    try {
      const response = await newFetchDirsAndFiles(obj.table, obj.userID);
      if (response.truth) {
        setFileInfo(response.files);
        setDirs(response.dirs);
        if (logCheck(printLevel,['s']) === 1) {console.log(`Successfully got dirs and files from ${obj.table}`)}
        else if (logCheck(printLevel, ['s']) === 2) { console.log(`Successfully got dirs and files from ${obj.table}.\n dirs`, dirs, '\nfiles:',response.files)}
      } else {
        setFileInfo([]);
        setDirs([]);
        throw new Error(`${response.status} Error getting dirs and files from ${obj.table}: ${response.msg}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /** Update object property with inputValue */
  const uponInputChange = (inputValue, prop) => {
    setObj(prevState => ({ ...prevState, [prop]: inputValue }));
  };

  /** Update object property (which is also an object) with inputValue */
  const uponObjectInputChange = (inputValue, prop) => {
    // Attempt to parse and notify upon uncaught failure
    try {
      const parsedObj = JSON.parse(inputValue);
      setObj(prevState => ({ ...prevState, [prop]: parsedObj }));
      if (logCheck(printLevel, ['o']) === 2) { console.log(`obj.dateTime set to: ${JSON.stringify(parsedObj)}`) }
    } catch (err) {
      if (prop === 'dateTime') {
        const emptyDateTime = { date: '', time: '' };
        setObj(prevState => ({ ...prevState, dateTime: emptyDateTime }));
        if (logCheck(printLevel, ['o']) === 2) {console.log(`obj.dateTime set to: ''-''`)}
      } else {
        console.error(`No catch for unparseable object attempting to alter obj.${prop}`,inputValue,'\n Error',err);
      }
    }
  };

  return (
    <div>
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
            {// Return suggestions for dir, set removes duplicates
              dirs.length > 0 &&
                [...new Set(
                  dirs.map((dir) => {
                    // ignore self
                    if (dir === obj.dir) {
                      return null;
                    } 
                    // return all leading directories
                    else if (obj.dir === '') {
                      return dir.split('/')[0];
                    } 
                    // return directories equal to obj.dir up to its length and subdirectories
                    // if obj.dir's trailing directory is empty
                    else if (dir.startsWith(obj.dir)) {
                      if (obj.dir.split('/')[obj.dir.split('/').length - 1] === '') {
                        return dir.split('/').slice(0, obj.dir.split('/').length + 1).join('/');
                      } else {
                        return dir.split('/').slice(0, obj.dir.split('/').length).join('/');
                      }
                    } 
                    // ignore other cases
                    else {
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
            { // Return all suggested filenames, set removes duplicates
              fileInfo.length > 0 &&
                [...new Set(fileInfo
                  .filter((file) => file.directory === obj.dir) // Filter out files that don't match dir input
                  .filter((file) => file.filename !== obj.filename) // Filter out files with filename exactly equal to obj.filename
                  .filter((file) => file.filename.startsWith(obj.filename)) // Filter out files that don't match obj.filename up to its length
                  .map((file) => file.filename) // Extract the filename
                )].map((filename, index) => (
                  <option key={index} value={filename} />
                ))
            }
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
            { // Create option for each version and order in reverse of database import
              fileInfo.length > 0 && fileInfo.slice().reverse().map((file, index) => {
                if (file.filename === obj.filename && file.directory === obj.dir) {
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
      {/** Button row (saving, loading, resetting) */ }
      <div className="flexDivRows">
      { // Render load content button if all necessary fields are filled
        obj.dir && obj.filename && obj.dateTime.date 
          ? <button onClick={() => getFile()}>Load Content</button>
          : <button style={({ color: 'gray' })}>Load Content</button>
      } { // Conditionally render overwrite button if using previous file version
          // Condition1: file (dir, filename, dateTime) === loaded (dir, filename, dateTime)
          // Condition2: file (dir, filename, dateTime) aren't falsy
          obj.dir && obj.dir === loadedInfo.dir &&
          obj.filename && obj.filename === loadedInfo.filename &&
          obj.dateTime?.date && obj.dateTime.date === loadedInfo.dateTime?.date &&
          obj.dateTime?.time && obj.dateTime.time === loadedInfo.dateTime?.time
        ? <div>
          <button style={({ color: 'gray' })}>Save New</button>
          <button onClick={() => saveFile(true)}>Overwrite</button>
        </div>
        : <div>
          <button onClick={() => saveFile(false)}>Save New</button>
          <button style={({ color: 'gray' })}>Overwrite</button>
        </div>
      }
      </div>
      { /** Display save result with more info available upon hover - disappear when payload or options is not empty*/
        savedInfo && obj.options !== null && obj.payload !== null && obj.payload !== '' && 
          <div className="flexDivRows">
            <p className="moreLink" style={{ cursor: 'default' }}>
              {savedInfo.message} {savedInfo.filename}
              <span className="more">
                {savedInfo.message} {savedInfo.dir}/{savedInfo.filename} version:&nbsp;
                {convertUTCstringsToLocal(savedInfo.dateTime).date}-
                {convertUTCstringsToLocal(savedInfo.dateTime).time}&nbsp;
                in {savedInfo.table}
              </span>
            </p>
          </div>
      }
    </div>
  );
}
