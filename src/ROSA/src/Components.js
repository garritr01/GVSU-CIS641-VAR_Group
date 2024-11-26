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
      <div style={({ width: 'calc(100% - 53px)' })}>
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
      <div style={({ width: '53px' })}>
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

/** Handles everything about retrieving and saving a file so the calling function just
 * has to deal with functions and payload
 * 
 * No need to getDirsAndFiles.
 * No need to empty payload.
 * Just straight hands.
 * 
 * @param {Object} props - The properties passed to the component.
 * @param {string[]} props.printLevel - The array of strings defined in App.js to determine what to print
 * @param {any} props.defaultPayload - The default value to set for `obj.payload` when resetting.
 * @param {Object} props.obj - The state object containing information such as directory, filename, and dateTime.
 * @param {Function} props.setObj - A state setter function for updating the `obj` state.
 * @param {Object} props.loadedInfo - Information about the currently loaded file, including directory, filename, and dateTime.
 * @param {Object} props.savedInfo - Information about the most recently saved file, including status and messages.
 * @param {Function} props.getFile - A function to load the selected file's content.
 * @param {Function} props.saveFile - A function to save the current file, accepting a boolean indicating overwrite mode.
 *
 * @returns {JSX.Element} The rendered FileAccess component.
 */
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
  // unless loadedInfo dir, filename, and dateTime are equal to those of obj (load from fileExplorer workaround)
  useEffect(() => {
    if (loadedInfo.dir !== obj.dir 
      || loadedInfo.filename !== obj.filename 
      || loadedInfo.dateTime.date !== obj.dateTime.date 
      || loadedInfo.dateTime.time !== obj.dateTime.time) {
      if (logCheck(printLevel,['o']) === 2) {console.log('obj.filename emptied')}
      setObj(prevObj => ({ ...prevObj, filename: '' }));
    }
  }, [obj.dir]);

  // Autofills or empties dateTime when dir or filename is changed
  // unless loadedInfo dir, filename, and dateTime are equal (load from FileExplorer workaround)
  useEffect(() => {
    if (loadedInfo.dir !== obj.dir
      || loadedInfo.filename !== obj.filename
      || loadedInfo.dateTime.date !== obj.dateTime.date
      || loadedInfo.dateTime.time !== obj.dateTime.time) {
      if (fileInfo.map(i => i.directory).includes(obj.dir) && fileInfo.map(i => i.filename).includes(obj.filename)) {
        const mostRecent = newChooseMostRecent(fileInfo, obj.dir, obj.filename);
        if (logCheck(printLevel,['o']) === 2) {console.log(`obj.dateTime set to '${mostRecent.date}'-'${mostRecent.time}'`)}
        setObj(prevState => ({ ...prevState, dateTime: mostRecent }));
      } else {
        setObj(prevState => ({ ...prevState, dateTime: { date: '', time: '' } }));
        if (logCheck(printLevel,['o']) === 2) {console.log(`obj.dateTime emptied`)}
      }
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
    <div className="fileAccessContainer">
      <div className="flexDivTable">
        {/** Directory row */}
        <div className="flexDivRows">
          <p className="flexDivColumns">Directory:</p>
          <input
            className="flexDivColumns"
            name='directory box'
            value={obj.dir}
            onChange={(e) => uponInputChange(e.target.value, 'dir')}
          />
          <div className="moreRightLink flexDivColumns">
          <span className="moreRight bulletList">
            {// Return suggestions for dir, set removes duplicates
              dirs.length > 0 &&
                [...new Set(
                  dirs.map((dir) => {
                    // return all leading directories
                    if (obj.dir === '') {
                      return dir.split('/')[0];
                    } 
                    // return self
                    else if (dir === obj.dir) {
                      return dir;
                    } 
                    // if obj.dir === dir up to obj.dir's length return something
                    else if (dir.startsWith(obj.dir)) {
                      // return 'dir1/dir2' if 'dir1' or 'dir1/'
                      if (obj.dir.split('/')[obj.dir.split('/').length - 1] === '' || dir[obj.dir.length] === '/') {
                        return dir.split('/').slice(0, obj.dir.split('/').length + 1).join('/');
                      } 
                      // return 'dir1/dir2' if 'dir1/d' or 'dir1/di' etc...
                      else {
                        return dir.split('/').slice(0, obj.dir.split('/').length).join('/');
                      }
                    } 
                    // ignore other cases
                    else {
                      return null;
                    }
                  })
                )].filter((dir) => dir !== null)
                .map((dir, index) => (
                  <p key={index} 
                    onMouseDown={(e) => {
                      e.preventDefault(); 
                      uponInputChange(dir, 'dir');
                    }}>
                    {dir}
                  </p>
                ))}
          </span>
          </div>
        </div>
        {/** Filename row */}
        <div className="flexDivRows">
          <p className="flexDivColumns">Filename:</p>
          <input
            className="flexDivColumns"
            id='filename box'
            value={obj.filename}
            onChange={(e) => uponInputChange(e.target.value, 'filename')}
          />
          <div className="moreRightLink flexDivColumns">
          <span className="moreRight bulletList">
            { // Return all suggested filenames, set removes duplicates
              fileInfo.length > 0 &&
                [...new Set(fileInfo
                  .filter((file) => file.directory === obj.dir) // Filter out files that don't match dir input
                  .filter((file) => file.filename.startsWith(obj.filename)) // Filter out files that don't match obj.filename up to its length
                  .map((file) => file.filename) // Extract the filename
                )].map((filename, index) => (
                  <p key={index} 
                    onMouseDown={(e) => {
                      e.preventDefault();
                      uponInputChange(filename, 'filename');
                    }}>
                      {filename}
                    </p>
                ))
            }
          </span>
          </div>
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
      {/** Button row (saving, loading, notifying) */ }
      <div className="flexDivRows">
      { // Render load content button if all necessary fields are filled
        obj.dir && obj.filename && obj.dateTime.date 
          ? <div>
            <button onClick={() => getFile()}>Load Content</button>
          </div>
          : <div>
            <button style={({ color: 'gray' })}>Load Content</button>
          </div>
      } { // Conditionally render overwrite button if dateTime is defined
        obj.dateTime.date
        ? 
        <div>
          <button style={({ color: 'gray' })}>Save New</button>
          {
            loadedInfo.dir && 
            (loadedInfo.dir !== obj.dir ||
            loadedInfo.filename !== obj.filename ||
            loadedInfo.dateTime.date !== obj.dateTime.date ||
            loadedInfo.dateTime.time !== obj.dateTime.time)
            ? <button className="moreButton"
                style={{ border: '1px solid red'}}
                onClick={() => saveFile(true)}>
                  Overwrite
                  <span className="more bulletList">
                    <h3>Save location will be different than loaded location</h3>
                    <p>Loaded from {loadedInfo.dir}/{loadedInfo.filename}&nbsp;
                      version: {convertUTCstringsToLocal(loadedInfo.dateTime).date}-{convertUTCstringsToLocal(loadedInfo.dateTime).time}
                    </p>
                    <p>Will save to {obj.dir}/{obj.filename}&nbsp;
                      version: {convertUTCstringsToLocal(obj.dateTime).date}-{convertUTCstringsToLocal(obj.dateTime).time}
                    </p>
                  </span>
              </button>
            : <button onClick={() => saveFile(true)}>Overwrite</button>
          }
        </div>
        : <div>
          { // Do not allow save if dir ends in /, either contain invalud characters, or are just spaces 
            obj.dir && obj.dir[obj.dir.length - 1] !== '/' && obj.dir.trim() !== "" && !/[\\:*?"<>|#&=]/.test(obj.dir) &&
            obj.filename && obj.filename.trim() !== "" && !/[\/\\:*?"<>|#&=]/.test(obj.filename)
            ? <button onClick={() => saveFile(false)}>Save New</button>
            : <button style={({ color: 'gray' })}>Save New</button>
          }
          <button style={({ color: 'gray' })}>Overwrite</button>
        </div>
      } { /** Display save result with more info available upon hover - disappear when payload or options is not empty*/
        savedInfo && (obj.payload === null || obj.payload === '') &&
          <p className="moreButton" style={{ cursor: 'default' }}>
            {savedInfo.message} {savedInfo.filename}
            <span className="more">
              {savedInfo.message} {savedInfo.dir}/{savedInfo.filename} version:&nbsp;
              {convertUTCstringsToLocal(savedInfo.dateTime).date}-
              {convertUTCstringsToLocal(savedInfo.dateTime).time}&nbsp;
              in {savedInfo.table}
            </span>
          </p>
      }
      </div>
    </div>
  );
}
