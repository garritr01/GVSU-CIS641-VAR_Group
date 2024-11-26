import React, { useState, useEffect
} from 'react';

import { FileAccess } from './Components';

import { getDateString, getTimeString, logCheck
} from './oddsAndEnds';

import { newFetchText, newSaveText
} from './generalFetch';


export const Journal = ({ printLevel, preselectedObj }) => {

    // Use object and replace payload with empty string if null
    const [obj, setObj] = useState({ ...preselectedObj, payload: preselectedObj.payload || ''});
    // Retains file information from loaded file
    const [loadedInfo, setLoadedInfo] = useState({ dir: preselectedObj.dir, filename: preselectedObj.filename, dateTime: preselectedObj.dateTime });
    // Retains file information from savedFile
    const [savedInfo, setSavedInfo] = useState(null);

    /** Get payload and options and apply to obj given relevant arguments */
    const getJournal = async () => {
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
                if (logCheck(printLevel, ['d', 'b']) === 1) { console.log(`Succesfully retrieved ${obj.dir}/${obj.filename} (${obj.dateTime.date}-${obj.dateTime.time})`)}
                if (logCheck(printLevel, ['o']) === 1) {console.log('obj updated by fetch')}
                else if (logCheck(printLevel, ['o']) === 2) {console.log('obj updated by fetch\n obj:', updatedObj)}
                setObj(updatedObj);
                setLoadedInfo({ dir: updatedObj.dir, filename: updatedObj.filename, dateTime: updatedObj.dateTime });
            }
        } catch (err) {
            console.error('Error getting journal:', err);
        }
    }

    /** Save the journal entry and set variables relevant to displaying result
     * @param {boolean} overwrite - determines whether to save new with current time or overwrite previous with previous time
     */
    const saveJournal = async (overwrite) => {
        try {
            if (overwrite) {
                const response = await newSaveText(obj);
                if (response.truth) {
                    if (response.status === 200) {
                        if (logCheck(printLevel,['d','b']) > 0) {console.log(`Overwrote file '${obj.dir}/${obj.filename}' version: (${obj.dateTime.date}-${obj.dateTime.time}) in '${obj.table}' with new entry`)}
                        setSavedInfo({ table: obj.table, dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime, message: 'Overwrote', truth: true });
                    } else {
                        setSavedInfo({ table: obj.table, dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime, message: 'Unexpected overwrite method. Investigate', truth: false });
                        throw new Error(`${response.status} Unexpected success attempting to overwrite file '${obj.dir}/${obj.filename}' version: (${obj.dateTime.date}-${obj.dateTime.time}) in '${obj.table}' with new entry:\n ${response.msg}`)
                    }
                } else {
                    setSavedInfo({ table: obj.table, dir: obj.dir, filename: obj.filename, dateTime: obj.dateTime, message: 'Failed to overwrite', truth: false });
                    throw new Error(`${response.status} Error attempting to overwrite file '${obj.dir}/${obj.filename}' version: (${obj.dateTime.date}-${obj.dateTime.time}) in '${obj.table}' with new entry:\n ${response.msg}`);
                }
            } else {
                const objToSave = { ...obj, dateTime: { date: getDateString(), time: getTimeString() } };
                const response = await newSaveText(objToSave);
                // Update currently used object to reflect version it was saved under
                if (response.truth) {
                    if (response.status === 201) {
                        if (logCheck(printLevel, ['d','b'])) {console.log(`Successfully created '${objToSave.dir}/${objToSave.filename}' version: (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in '${objToSave.table}':\n ${response.msg}`)}
                        setSavedInfo({ table: objToSave.table, dir: objToSave.dir, filename: objToSave.filename, dateTime: objToSave.dateTime, message: 'Saved', truth: true });
                    } else {
                        setSavedInfo({ table: objToSave.table, dir: objToSave.dir, filename: objToSave.filename, dateTime: objToSave.dateTime, message: 'Unexpected save method. Investigate', truth: false });
                        throw new Error(`${response.status} Unexpected success attempting to save '${objToSave.dir}/${objToSave.filename}' version: (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in '${objToSave.table}':\n ${response.msg}`);
                    }
                } else {
                    setSavedInfo({ table: objToSave.table, dir: objToSave.dir, filename: objToSave.filename, dateTime: objToSave.dateTime, message: 'Failed to save', truth: false });
                    throw new Error(`${response.status} Error attempting to save '${objToSave.dir}/${objToSave.filename}' version: (${objToSave.dateTime.date}-${objToSave.dateTime.time}) in '${objToSave.table}':\n ${response.msg}`);
                }
            }
        } catch (err) {
            console.error('Error saving journal:', err);
        }
    }

    /** Returns journal UI */
    return(
        <div className="mainContainer">
            <FileAccess
                printLevel={printLevel}
                defaultPayload={''}
                obj={obj}
                setObj={setObj}
                loadedInfo={loadedInfo}
                savedInfo={savedInfo}
                getFile={getJournal}
                saveFile={saveJournal} />
            <textarea
                className="postFileAccessContainer"
                name="journal box"
                value={obj.payload}
                onChange={(e) => setObj(prevState => ({ ...prevState, payload: e.target.value }))}
            />
        </div>
    );
}