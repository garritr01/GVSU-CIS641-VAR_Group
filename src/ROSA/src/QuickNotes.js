import React, {
  useState, useEffect, useRef
} from 'react';

import { newFetchDirsAndFiles, newSaveObject } from './generalFetch';
import { getCurrentDateTime, logCheck } from './oddsAndEnds';
import { positionMorePopup } from './dynamicDisplays';

export const QuickNotes = ({ rookie, printLevel, userID }) => {

  // Quick note title
  const [title, setTitle] = useState('');
  // Contain titles already in use
  const [titles, setTitles] = useState([]);
  // Makes sure title is not already in use, title doesn't end in '/' and title doesn't contain problematic characters
  const [titleValidity, setTitleValidity] = useState(true);
  // Gives user ability to prioritize quickNotes
  const [prioirty, setPriority] = useState('5');
  // Note intended to use for due dates etc and appearing above the rest of the note
  const [timeNotes, setTimeNotes] = useState('');
  // Note intended to describe goal
  const [notes, setNotes] = useState('');
  // Retains file information from savedFile
  const [savedInfo, setSavedInfo] = useState(null);

  useEffect(() => {
    getDirsAndFiles();
    positionMorePopup();
  },[]);

  /** Gets dirs and files where directories is all unqiue directories and
  * files is an array of objects containing dateTime, directory, and filename
  */
  const getDirsAndFiles = async () => {
    try {
      const response = await newFetchDirsAndFiles('quickNotes', userID);
      if (response.truth) {
        setTitles(response.dirs);
        if (logCheck(printLevel, ['s']) === 1) { console.log(`Successfully got dirs from 'quickNotes'`) }
        else if (logCheck(printLevel, ['s']) === 2) { console.log(`Successfully got dirs from 'quickNotes'.\n dirs`, response.dirs) }
      } else {
        setTitles([]);
        throw new Error(`${response.status} Error getting dirs and files from 'quickNotes': ${response.msg}`);
      }
    } catch (err) {
      console.error(err);
    }
  }

  /** Save quick note in 'quickNotes' table */
  const saveQuickNote = async () => {
    try {
      const objToSave = { 
        userID: userID,
        table: 'quickNotes',
        dir: title,
        filename: 'arbitrary',
        dateTime: getCurrentDateTime(false),
        options: null,
        payload: [{ priority: prioirty, timeNotes: timeNotes, notes: notes }]
      };
      const response = await newSaveObject(objToSave);
      // Update currently used object to reflect version it was saved under
      if (response.truth) {
        if (response.status === 201) {
          if (logCheck(printLevel, ['d', 'b'])) { console.log(`Successfully created '${objToSave.dir}/${objToSave.filename}' version: (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in '${objToSave.table}':\n ${response.msg}`) }
          setSavedInfo({ table: objToSave.table, dir: objToSave.dir, filename: objToSave.filename, dateTime: objToSave.dateTime, message: 'Saved', truth: true });
        } else {
          setSavedInfo({ table: objToSave.table, dir: objToSave.dir, filename: objToSave.filename, dateTime: objToSave.dateTime, message: 'Unexpected save method. Investigate', truth: false });
          throw new Error(`${response.status} Unexpected success attempting to save '${objToSave.dir}/${objToSave.filename}' version: (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in '${objToSave.table}':\n ${response.msg}`);
        }
      } else {
        setSavedInfo({ table: objToSave.table, dir: objToSave.dir, filename: objToSave.filename, dateTime: objToSave.dateTime, message: 'Failed to save', truth: false });
        throw new Error(`${response.status} Error attempting to save '${objToSave.dir}/${objToSave.filename}' version: (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in '${objToSave.table}':\n ${response.msg}`);
      }
    } catch (err) {
      console.error('Error saving journal:', err);
    }
  }

  return (
    <div className="mainContainer">
      {/** Title and save row */}
      <div className="flexDivRows">
        <p className="moreLink">
          Title:&nbsp;
          <span className={ rookie ? "more" : "moreDisabled" }>
            <h3>Quick Note Title</h3>
            <span>This title will be displayed on the main menu</span>
          </span>
        </p>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setTitleValidity(
              e.target.value === '' ||
              (e.target.value[e.target.value.length - 1] !== '/' && 
              !/[\\:*?"<>|#&=]/.test(e.target.value))
            );
          }}
          style={{
            backgroundColor:
              !titleValidity
                ? 'rgba(255, 0, 0, 0.5)'
                : undefined
          }}
        />
        {/** Save button */
          titleValidity && title !== ''
          ?  <button className="moreLink" onClick={() => saveQuickNote()}>
            Save new
            <span className={rookie ? "more" : "moreDisabled"}>
              <h3>Save New Quick Note</h3>
              <p>Quick Note will be saved and displayed on the main menu</p>
            </span>
          </button>
          :  <button className="moreLink" style={{ color: 'gray' }}>
            Save New
              <span className={rookie ? "more" : "moreDisabled"}>
                <h3>Save New Quick Note</h3>
                <p>Quick Note will be saved and displayed on the main menu once you give it a valid name</p>
              </span>
          </button>
        }
        {/** Saved info output */
          savedInfo &&
          <p className="moreLink">
            {savedInfo.message} {savedInfo.dir}
            <span className="more">
              {savedInfo.message} {savedInfo.dir} in {savedInfo.table}
            </span>
          </p>
        }  
      </div>
      {/** Priority row */}
      <div className="flexDivRows">
        <div className="moreLink">
          <p>Priority: </p>
          <div className={rookie ? "more" : "moreDisabled"}>
            <h3>Quick Note Priority</h3>
            <div className="bulletList">
              <p>Priority should be a number</p>
              <p>Using a range of 1-10 is recommended, but you're free to decide</p>
              <p>Quick Notes are displayed in descending order on the main menu according to priority</p>
            </div>
          </div>
        </div>
        <input className="fourDigitInput"
          value={prioirty}
          onChange={(e) => setPriority(e.target.value)}
          style={{ backgroundColor: isNaN(prioirty) ? 'rgba(255, 0, 0, 0.5)' : undefined }}
        />
      </div>
      {/** Timing Notes */}
      <p>Timing: </p>
      <input
        value={timeNotes}
        onChange={(e) => setTimeNotes(e.target.value)}
        style={{ width: '100%' }}
      />
      {/** Notes */}
      <p style={{ verticalAlign: 'top' }}>Note: </p>
      <textarea 
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ width: '100%', height: '50%' }}
      />
    </div>
  );
}