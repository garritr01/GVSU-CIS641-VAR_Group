import { getDateString, getTimeString } from "./oddsAndEnds";

/**Get dateTime objects from specified table */
export const fetchDateTimes = async (table, userID, directory, title) => {
    try {
        const response = await fetch(`http://localhost:5000/get_times/${table}/${userID}/${directory}/${title}`);
        const data = await response.json();
        if (data.message) {
            throw new Error(data.message);
        }
        return data;
    } catch (err) {
        console.error('Error occured pulling', directory, title, err, '... returning current');
        return { date: getDateString(), time: getTimeString() };
    }
}

// Resolve whether these are the same function
/** Get dateTime object from specified table */
export const fetchDateTime = async (table, userID, directory, title) => {
    try {
        const response = await fetch(`http://localhost:5000/get_time/${table}/${userID}/${directory}/${title}`);
        const data = await response.json();
        if (data.message) {
            throw new Error(data.message);
        }
        return data;
    } catch (err) {
        console.error('Error occured pulling', directory, title, err,'... returning current');
        return { date: getDateString(), time: getTimeString() };
    }
}

/** Record dateTime object in specified table*/
export const recordDateTime = async (tableOut, dateTimeOut, userIDout, directoryOut, titleOut) => {
    try {
        const response = await fetch('http://localhost:5000/record_time', {
            method: 'POST',
            headers: {'Content-Type': 'application/json',},
            body: JSON.stringify({
                table: tableOut,
                userID: userIDout,
                directory: directoryOut,
                title: titleOut,
                dateTime: dateTimeOut,
            }),
        });
        const data = await response.json();
        return data.message;
    } catch (err) { throw err }
}

/** Return array of objects containing directory, title, and dateTime */
export const fetchFiles = async (table, userID) => {
    try {
        const response = await fetch(`http://localhost:5000/get_dirs_and_titles/${table}/${userID}`);
        const data = await response.json();
        if (data.message) {
            throw new Error(data.message);
        }
        return data;
    } catch (err) { throw err }
} 

/** Return array of objects containing directory, title, dateTime AND an array of unique directories in an object*/
export const fetchDirsAndFiles = async (table, userID) => {
    try {
        const response = await fetch(`http://localhost:5000/get_dirs_and_titles/${table}/${userID}`);
        const files = await response.json();
        if (files.message) {
            throw new Error(files.message);
        }
        const dirs = [...new Set(files.map((file) => (file.directory)))];
        return { 'files': files, 'directories': dirs };
    } catch (err) { throw err }
}

/** Return attributes including their UIs
 * * attributes is array of objects
 * * objects contain directory, title, dateTime, userID
 */
export const fetchObjects = async (tableOut, attributes) => {
    try {
        const response = await fetch(`http://localhost:5000/get_listed_objects/${tableOut}`,{
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify({ attributes }),
        })
        const objects = await response.json();
        if (objects.message) {
            throw new Error(objects.message);
        } else {
            return objects.fileInfo;
        }
    } catch(err) { throw err }
}

/** Return object containing UI and dateTime
 * * UI is array of objects
 * * dateTime is object containing date and time
 */
export const fetchObject = async (table, dateTime, userID, directory, file) => {
    try {
        const encodedDateTime = encodeURIComponent(JSON.stringify(dateTime).replace(/\//g, '_'));
        const response = await fetch(`http://localhost:5000/get_object/${table}/${encodedDateTime}/${userID}/${directory}/${file}`);
        const object = await response.json();
        if (object.message) {
            throw new Error(object.message);
        } else {
            return object.UI;
        }
    } catch (err) { throw err }
}

/** save UI and dateTime to tableName, userID, directory, title */
export const saveObject = async (tableNameOut, UIout, dateTimeOut, userIDout, directoryOut, titleOut) => {
    try {
        const response = await fetch(`http://localhost:5000/save_object`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                UI: UIout,
                dateTime: dateTimeOut,
                tableName: tableNameOut,
                userID: userIDout,
                directory: directoryOut,
                title: titleOut,
            }),
        });
        const data = await response.json();
        return data.message;
    } catch (err) { throw err }
}

/** Return object containing entry
 * * entry is a text block
 */
export const fetchText = async (table, dateTime, userID, directory, file) => {
    try {
        const encodedDateTime = encodeURIComponent(JSON.stringify(dateTime).replace(/\//g, '_'));
        const response = await fetch(`http://localhost:5000/get_text/${table}/${encodedDateTime}/${userID}/${directory}/${file}`);
        const text = await response.json();
        if (text.message) {
            throw new Error(text.message);
        } else {
            return text.entry;
        }
    } catch (err) { throw err.message }
}

/** save entry and dateTime to tableName, userID, directory, title */
export const saveText = async (tableNameOut, entryOut, dateTimeOut, userIDout, directoryOut, titleOut) => {
    try {
        const response = await fetch(`http://localhost:5000/save_text`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                entry: entryOut,
                dateTime: dateTimeOut,
                tableName: tableNameOut,
                userID: userIDout,
                directory: directoryOut,
                title: titleOut,
            }),
        });
        const data = await response.json();
        return data.message;
    } catch (err) { throw err }
}

/** Find and return all instances of str in table */
export const fetchStringInstances = async (table, userID, stringOfInterest) => {
    try {
        const response = await fetch(`http://localhost:5000/find_string/${table}/${userID}/${stringOfInterest}`);
        const files = await response.json();
        if (files.message) {
            throw new Error(files.message);
        }
        return files;
    } catch (err) { throw err }
}

/** remove userID, directory, title from table */
export const deleteEntry = async (table, dateTime, userID, directory, title) => {
    console.log('deleting ', table, dateTime, userID, directory, title);
    try {
        const encodedDateTime = encodeURIComponent(JSON.stringify(dateTime).replace(/\//g, '_'));
        const response = await fetch(`http://localhost:5000/remove_entry/${table}/${encodedDateTime}/${userID}/${directory}/${title}`, {
            method: 'DELETE',
        });
        const responseObj = await response.json();
        return responseObj.message;
    } catch(err) {throw err}
}
