

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
        const response = await fetch(`http://localhost:5000/signUp/${userName}/${password}`, { method: 'POST', });
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
            const dirs = [...new Set(data.files.map((file) => (file.dir)))];
            return { truth: true, msg: data.message, status: response.status, files: data.files, dirs: dirs}
        }
    } catch (err) { 
        return { truth: false, msg: err, status: 500, files: null, dirs: null }; 
    }
}

/**
 * Fetches directories and file details from the server, then returns an array of objects containing directory, title, and dateTime,
 * along with an array of unique directories.
 *
 * @param {string} table - The name of the table to fetch data from.
 * @param {string} userID - The unique ID of the user for fetching their specific data.
 * @param {Object} filteredDirs - The dirs which are to be included or excluded.
 * @param {Boolean} include - determines whether filteredDirs are to be included or excluded. (true = include)
 * 
 * @returns {Promise<Object>} - A promise that resolves to an object containing:
 *    - {boolean} truth - Indicates whether the request was successful (`true` for success, `false` for failure).
 *    - {string} msg - A message related to the status of the request.
 *    - {number} status - The HTTP status code of the response.
 *    - {Array|null} files - An array of file objects if successful, otherwise `null`.
 *    - {Array|null} dirs - An array of unique directories if successful, otherwise `null`.
 */
export const newFetchFilteredDirsAndFiles = async (table, userID, filteredDirs, include) => {
    try {
        const response = await fetch('http://localhost:5000/getFilteredDirsAndTitles', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tableName: table,
                userID: userID,
                filteredDirs: filteredDirs,
                include: include,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            return { truth: false, msg: data.message, status: response.status, files: null, dirs: null };
        } else {
            const dirs = [...new Set(data.files.map((file) => (file.dir)))];
            return { truth: true, msg: data.message, status: response.status, files: data.files, dirs: dirs }
        }
    } catch (err) {
        return { truth: false, msg: err, status: 500, files: null, dirs: null };
    }
}

/**
 * Get payload and content of database file
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

/** Fetch content 
 * @param {string} table - The table name
 * @param {string} userID - user ID
 * @param {Object} fileInfo - contains information for finding each file
 * @param {string} fileInfo.dir - directory ('leadDir/subDir')
 * @param {string} fileInfo.filename - filename ('someFilename')
 * @param {Object} fileInfo.dateTime - dateTime {date: 'mm/dd/yyyy', time: 'hh:mm'}
 * @param {Object} contentToRetrieve - defaults to both options and payload but ['options'] will return only options
 * @returns {Promise<{truth: boolean, msg: string, status: number, objects: Object}>}
*/
export const newFetchObjects = async (table, userID, fileInfo, contentToRetrieve = ['options', 'payload']) => {
    try {
        const response = await fetch(`http://localhost:5000/getObjects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tableName: table,
                userID: userID,
                files: fileInfo,
                contentToReturn: contentToRetrieve
            })
        });
        const data = await response.json();
        if (!response.ok) {
            return { truth: false, objects: null, msg: data.message, status: response.status };
        } else {
            return { truth: true, objects: data.objects, msg: data.message, status: response.status };
        }
    } catch (err) {
        return { truth: false, objects: null, msg: err, status: 500 };
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

