import { getDateString, getTimeString } from "./oddsAndEnds";

/**
 * Create a Username's account with the given password
 * @param {string} userName - The username input by the user.
 * @param {string} password - The password input by the user.
 * @returns {Promise<{truth: boolean, msg: string, status: number}>}
 */
export const createNewUser = async (userName, password) => {
    //Attempt new user creation and report any failure
    try {
        //Get response given userName and password inputs
        const response = await fetch(`http://localhost:5000/signUp/${userName}/${password}`, { method: ['POST'], });
        const data = await response.json();
        //If fails return failure and reason
        if (!response.ok) {
            console.error(data.message);
            return { truth: false, msg: data.message, status: response.status };
        } else {
             return { truth: true, msg: data.message, status: response.status };
        }
    } catch (err) {
        return { truth: false, msg: err, status: 500};
    }
}

/**
 * Get Username and Password combo then check validity.
 * @param {string} userName - The username input by the user.
 * @param {string} password - The password input by the user.
 * @returns {Promise<{truth: boolean, msg: string, status: number}>}
 */
export const checkLoginInfo = async(userName, password) => {
    //Attempt login process and report issues if fails
    try {
        //Get response from log_in with userName and password inputs
        const response = await fetch(`http://localhost:5000/logIn/${userName}/${password}`);
        const data = await response.json();
        //If response is failure report why else return success
        if (!response.ok) {
            return { truth: false, msg: data.message, status: response.status };
        } else {
            return { truth: true, msg: data.message, status: response.status };
        }
    } catch (err) {
        return { truth: false, msg: err, status: 500 };
    }
}

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

/**
 * Fetches directories and file details from the server, then returns an array of objects containing directory, title, and dateTime,
 * along with an array of unique directories.
 *
 * @param {string} table - The name of the table to fetch data from.
 * @param {string} userID - The unique ID of the user for fetching their specific data.
 * 
 * @returns {Promise<Object>} - A promise that resolves to an object containing:
 *    - {boolean} truth - Indicates whether the request was successful (`true` for success, `false` for failure).
 *    - {string} msg - A message related to the status of the request.
 *    - {number} status - The HTTP status code of the response.
 *    - {Array|null} files - An array of file objects if successful, otherwise `null`.
 *    - {Array|null} dirs - An array of unique directories if successful, otherwise `null`.
 */
export const newFetchDirsAndFiles = async (table, userID) => {
    try {
        const response = await fetch(`http://localhost:5000/getDirsAndTitles/${table}/${userID}`);
        const data = await response.json();
        if (!response.ok) {
            return { truth: false, msg: data.message, status: response.status, files: null, dirs: null };
        } else {
            const dirs = [...new Set(data.files.map((file) => (file.directory)))];
            return { truth: true, msg: data.message, status: response.status, files: data.files, dirs: dirs}
        }
    } catch (err) { 
        return { truth: false, msg: err, status: 500, files: null, dirs: null }; 
    }
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

/**
 * Get full information from database given following location parameters
 * @param {Object} obj - The parameters for the function.
 * @param {string} obj.userID - The user ID.
 * @param {string} obj.table - The table name.
 * @param {string} obj.dir - The directory.
 * @param {string} obj.filename - The filename.
 * @param {string} obj.dateTime - The date and time.
 * @returns {Promise<{truth: boolean, msg: string, status: number, payload: Object, options: Object}>}
 */
export const newFetchObject = async (obj) => {
    try {
        const encodedDateTime = encodeURIComponent(JSON.stringify(obj.dateTime).replace(/\//g, '_'));
        const response = await fetch(`http://localhost:5000/getObject/${obj.table}/${encodedDateTime}/${obj.userID}/${obj.dir}/${obj.filename}`);
        const data = await response.json();
        if (!response.ok) {
            return { truth: false, payload: null, options: null, msg: data.message, status: response.status };
        } else {
            return { truth: true, payload: data.payload, options: data.options, msg: data.message, status: response.status };
        }
    } catch (err) {
        return { truth: false, payload: null, options: null, msg: err, status: 500 };
    }
}

/** Return attributes including their UIs
 * * attributes is array of objects
 * * objects contain directory, title, dateTime, userID
 */
export const newFetchObjects = async (tableOut, attributes) => {
    try {
        const response = await fetch(`http://localhost:5000/get_listed_objects/${tableOut}`, {
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
    } catch (err) { throw err }
}

/**
 * Save obj to database
 * @param {Object} obj - The parameters for the function.
 * @param {string} obj.userID - The user ID.
 * @param {string} obj.table - The table name.
 * @param {string} obj.dir - The directory.
 * @param {string} obj.filename - The filename.
 * @param {Object} obj.dateTime - The date and time.
 * @param {Object} obj.options - Misc options (often includes schedule)
 * @param {Object} obj.payload - Payload
 * @returns {Promise<{truth: boolean, msg: string, status: number}>}
 */
export const newSaveObject = async (obj) => {
    try {
        const response = await fetch(`http://localhost:5000/saveObject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                payload: obj.payload || {},
                options: obj.options || {},
                dateTime: obj.dateTime,
                table: obj.table,
                userID: obj.userID,
                dir: obj.dir,
                filename: obj.filename,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            return { truth: false, msg: data.message, status: response.status };
        } else {
            return { truth: true, msg: data.message, status: response.status };
        }
    } catch (err) { 
        return { truth: false, msg: err, status: 500 };
    }
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
        //If response is failure report why else return success
        if (!response.ok) {
            return { truth: false, msg: data.message, status: response.status };
        } else {
            return { truth: true, msg: data.message, status: response.status };
        }
    } catch (err) {
        return { truth: false, msg: err, status: 500 }
    }
}

/**
 * Get full information from database given following location parameters
 * @param {Object} obj - The parameters for the function.
 * @param {string} obj.userID - The user ID.
 * @param {string} obj.table - The table name.
 * @param {string} obj.dir - The directory.
 * @param {string} obj.filename - The filename.
 * @param {string} obj.dateTime - The date and time.
 * @returns {Promise<{truth: boolean, msg: string, status: number, payload: string, options: Object}>}
 */
export const newFetchText = async (obj) => {
    try {
        const encodedDateTime = encodeURIComponent(JSON.stringify(obj.dateTime).replace(/\//g, '_'));
        const response = await fetch(`http://localhost:5000/getText/${obj.table}/${encodedDateTime}/${obj.userID}/${obj.dir}/${obj.filename}`);
        const data = await response.json();
        if (!response.ok) {
            return { truth: false, payload: '', options: null, msg: data.message.message, status: response.status };
        } else {
            return { truth: true, payload: data.payload, options: data.options, msg: data.message, status: response.status };
        }
    } catch (err) {
        return { truth: false, payload: '', options: null, msg: err, status: 501 };
    }
}

/**
 * Save obj to database
 * @param {Object} obj - The parameters for the function.
 * @param {string} obj.userID - The user ID.
 * @param {string} obj.table - The table name.
 * @param {string} obj.dir - The directory.
 * @param {string} obj.filename - The filename.
 * @param {Object} obj.dateTime - The date and time.
 * @param {Object} obj.options - Misc options (often includes schedule)
 * @param {string} obj.payload - Payload
 * @returns {Promise<{truth: boolean, msg: string, status: number}>}
 */
export const newSaveText = async (obj) => {
    try {
        const response = await fetch(`http://localhost:5000/saveText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                payload: obj.payload,
                options: obj.options || {},
                dateTime: obj.dateTime,
                table: obj.table,
                userID: obj.userID,
                dir: obj.dir,
                filename: obj.filename,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            return { truth: false, msg: data.message.message, status: response.status };
        } else {
            return { truth: true, msg: data.message, status: response.status };
        }
    } catch (err) {
        return { truth: false, msg: err, status: 500 };
    }
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

/**
 * Deletes an entry from the specified table based on userID, directory, optional title, and optional dateTime.
 * 
 * If no dateTime, all entries in file will be deleted.
 * If no filename, all entries in directory will be deleted.
 * 
 * @param {string} table - The name of the table from which the entry should be deleted.
 * @param {Object|string} dateTime - The dateTime object or string to match (optional). If empty, it deletes all entries for the given `userID`, `directory`, and `filename`.
 * @param {string} userID - The ID of the user whose entry is to be deleted.
 * @param {string} directory - The directory in which the entry is located.
 * @param {string} filename - The filename of the entry to delete.
 * 
 * @returns - An object containing the result of the deletion:
 *  - `truth`: A boolean indicating success (`true`) or failure (`false`).
 *  - `msg`: A message describing the result.
 *  - `status`: The HTTP status code of the response.
 */
export const newDeleteEntry = async (table, dateTime, userID, directory, filename) => {
    try {
        const encodedDateTime = encodeURIComponent(JSON.stringify(dateTime).replace(/\//g, '_'));
        const encodedFilename = encodeURIComponent(JSON.stringify(filename));
        const response = await fetch(`http://localhost:5000/removeEntry/${table}/${encodedFilename}/${encodedDateTime}/${userID}/${directory}`, {
            method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) {
            return { truth: false, msg: data.message, status: response.status };
        } else {
            return { truth: true, msg: data.message, status: response.status };
        }
    } catch (err) { 
        return { truth: false, msg: err, status: 500 };
    }
}

