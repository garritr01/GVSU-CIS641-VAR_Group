

// GET CURRENT DATE

/** Get {date, time} object based on current time 
 * @param {boolean} local - defaults to true, set to false to get UTC
 */
export const getCurrentDateTime = (local = true) => {
    const now = new Date();
    const day = local ? String(now.getDate()).padStart(2, '0') : String(now.getUTCDate()).padStart(2, '0');
    const month = local ? String(now.getMonth() + 1).padStart(2, '0') : String(now.getUTCMonth() + 1).padStart(2, '0');  // getMonth() is zero-based
    const year = local ? String(now.getFullYear()) : String(now.getUTCFullYear());
    const hour = local ? String(now.getHours()).padStart(2, '0') : String(now.getUTCHours()).padStart(2, '0');
    const minute = local ? String(now.getMinutes()).padStart(2, '0') : String(now.getUTCMinutes()).padStart(2, '0');

    return {
        date: `${month}/${day}/${year}`,   // Format: mm/dd/yyyy
        time: `${hour}:${minute}`          // Format: hh:mm
    };
}

/** Get {month, day, year, hour, minute} object based on current time 
 * @param {boolean} local - defaults to true, set false to get utc
*/
export const getCurrentSplitDate = (local = true) => {
    const now = new Date();
    return {
        day: local ? String(now.getDate()).padStart(2, '0') : String(now.getUTCDate()).padStart(2, '0'),
        month: local ? String(now.getMonth() + 1).padStart(2, '0') : String(now.getUTCMonth() + 1).padStart(2, '0'),  // getMonth() is zero-based
        year: local ? String(now.getFullYear()) : String(now.getUTCFullYear()),
        hour: local ? String(now.getHours()).padStart(2, '0') : String(now.getUTCHours()).padStart(2, '0'),
        minute: local ? String(now.getMinutes()).padStart(2, '0') : String(now.getUTCMinutes()).padStart(2, '0')
    };
}


// CONVERT DATES BETWEEN UTC AND LOCAL

/** Converts {date, time} object from UTC to local. 
 * Any attributes not involved will be returned unchanged. */
export const convertUTCDateTimeToLocal = (inDate) => {
    const { date, time, ...rest } = inDate;
    const utcDate = new Date(date + ' ' + time);
    const localDate = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
    return { ...rest, ...formatDateToDateTime(localDate)};
} 

/** Converts {date, time} object from local to UTC. 
 * Any attributes not involved will be returned unchanged. */
export const convertLocalDateTimeToUTC = (inDate) => {
    const { date, time, ...rest } = inDate;
    const localDate = new Date(date + ' ' + time);
    const utcDate = new Date(localDate.getTime() + (localDate.getTimezoneOffset() * 60000));
    return { ...rest, ...formatDateToDateTime(utcDate)};
}

/** Convert {month, day, year, hour, minute} from local to UTC. 
 * Any attributes not involved will be returned unchanged. */
export const convertLocalSplitDateToUTC = (date) => {
    const { day, month, year, hour, minute, ...rest } = date;

    // Create a new Date object using the local time (month is zero-indexed, hence month - 1)
    const localDate = new Date(year, month - 1, day, hour, minute);

    // Extract the UTC values
    return {
        ...rest,
        day: String(localDate.getUTCDate()).padStart(2, '0'), // Ensures two digits
        month: String(localDate.getUTCMonth() + 1).padStart(2, '0'), // month is 0-indexed, ensures two digits
        year: String(localDate.getUTCFullYear()).padStart(4, '0'), // Ensures four digits
        hour: String(localDate.getUTCHours()).padStart(2, '0'), // Ensures two digits
        minute: String(localDate.getUTCMinutes()).padStart(2, '0'), // Ensures two digits
    };
}

/** Convert {month, day, year, hour, minute} from UTC to local. 
 * Any attributes not involved will be returned unchanged. */
export const convertUTCSplitDateToLocal = (date) => {
    const { day, month, year, hour, minute, ...rest } = date;

    // Create a new Date object using UTC time (Date.UTC ensures it's in UTC)
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

    // Now extract the local time values (JavaScript automatically converts it to local time)
    return {
        ...rest,
        day: String(utcDate.getDate()).padStart(2, '0'), // Local day (two digits)
        month: String(utcDate.getMonth() + 1).padStart(2, '0'), // Local month (two digits)
        year: String(utcDate.getFullYear()).padStart(4, '0'), // Local year (four digits)
        hour: String(utcDate.getHours()).padStart(2, '0'), // Local hour (two digits)
        minute: String(utcDate.getMinutes()).padStart(2, '0'), // Local minute (two digits)
    };
}

/** Convert js date object from UTC to local */
export const convertUTCJsDateToLocal = (date) => {
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate;
}

/** Convert js date object from local to UTC */
export const convertLocalJsDateToUTC = (date) => {
    const utcDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
    return utcDate;
}


// CHANGE THE FORMAT OF DATES

/**  Parse a {date,time} object into a js date object */
export const formatDateTimeToJsDate = (date) => {
    const dateObject = new Date(date.date + ' ' + date.time);
    return dateObject;
}

/** Parse a {month, day, year, hour, minute} object into a js date object */
export const formatSplitDateToJsDate = (inDate) => {

    const date = {
        ...inDate,
        hour: inDate.hour || '00',
        minute: inDate.minute || '00'
    }
    const dateObject = new Date([date.month, date.day, date.year].join('/')+' '+[date.hour, date.minute].join(':'));
    return dateObject;
}

/** Accept js date object and output a {date,time} object */
export const formatDateToDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return { date:`${month}/${day}/${year}`, time:`${hours}:${minutes}` };
}

/** Accept js date object and output a {month, day, year, hour, minute} object */
export const formatDateToSplitDate = (date) => {
    return {
        year: date.getFullYear(),
        month: String(date.getMonth() + 1).padStart(2, '0'),
        day: String(date.getDate()).padStart(2, '0'),
        hours: String(date.getHours()).padStart(2, '0'),
        minutes: String(date.getMinutes()).padStart(2, '0')
    };
}

/** Accept {month, day, year, hour, minute} object and output {date, time} object.
 * Any attributes not involved will return unchanged.
 */
export const formatSplitDateToDateTime = (inDate) => {
    const { month, day, year, hour = '00', minute = '00', ...rest } = inDate;

    return {
        date: [month, day, year].join('/'),
        time: [hour, minute].join(':'),
        ...rest
    };
};

/** Accept {date, time} object and output {month, day, year, hour, minute} object.
 * Any attributes not involved will return unchanged.
 */
export const formatDateTimeToSplitDate = (inDate) => {
    const { date, time = '00:00', ...rest } = inDate;

    return { 
        month: date.date.split('/')[0],
        day: date.date.split('/')[1],
        year: date.date.split('/')[2],
        hour: date.time.split(':')[0],
        minute: date.time.split(':')[1],
        ...rest
    };
}


// DETERMINE WHICH IS MOST RECENT

/**  Accept UI objects with directory and title elements 
 *   where title is MM-DD-YYYY.HH-mm and returns the most
 *   recent one where the directory aand title matches the input name
*/
export const chooseMostRecent = (files, directory, title) => {
    let count = 0;
    let UIdates = [];
    //console.log(files,directory,title);
    for (const possibility of files) {
        if (possibility.directory === directory && possibility.title === title) {
            UIdates.push(possibility);
            count++;
        }
    }
    if (UIdates.length > 0) {
        let mostRecentDateObject = new Date(UIdates[0].dateTime.date + ' ' + UIdates[0].dateTime.time);
        let mostRecentDateTime = UIdates[0].dateTime;
        if (UIdates.length > 1) {
            let testDateObject;
            for (let i = 1; i < count; i++) {
                testDateObject = new Date(UIdates[i].dateTime.date + ' ' + UIdates[i].dateTime.time);
                if (testDateObject > mostRecentDateObject) {
                    mostRecentDateObject = testDateObject;
                    mostRecentDateTime = UIdates[i].dateTime;
                }
            }
        }
        return mostRecentDateTime;
    } else {
        return '';
    }
}

/** 
 * Get the most recent version of a file from a list of file info.
 * 
 * @param {Object[]} fileInfo - An array of file objects containing file details.
 * @param {string} fileInfo[].directory - The directory path of the file.
 * @param {string} fileInfo[].filename - The name of the file.
 * @param {Object} fileInfo[].dateTime - The timestamp of the file.
 * @param {string} fileInfo[].dateTime.date - The date of the file version in 'MM-DD-YYYY' format.
 * @param {string} fileInfo[].dateTime.time - The time of the file version in 'HH:MM' format.
 * 
 * @param {string} dir - The directory to filter the files by.
 * @param {string} filename - The filename to filter the files by.
 * 
 * @returns - {date: '', time: ''} filled or empty if not found
 */
export const newChooseMostRecent = (fileInfo, dir, filename) => {
    let count = 0;
    let dates = [];
    //console.log(files,directory,title);
    for (const possibility of fileInfo) {
        if (possibility.directory === dir && possibility.filename === filename) {
            dates.push(possibility);
            count++;
        }
    }
    if (dates.length > 0) {
        let mostRecentDateObject = new Date(dates[0].dateTime.date + ' ' + dates[0].dateTime.time);
        let mostRecentDateTime = dates[0].dateTime;
        if (dates.length > 1) {
            let testDateObject;
            for (let i = 1; i < count; i++) {
                testDateObject = new Date(dates[i].dateTime.date + ' ' + dates[i].dateTime.time);
                if (testDateObject > mostRecentDateObject) {
                    mostRecentDateObject = testDateObject;
                    mostRecentDateTime = dates[i].dateTime;
                }
            }
        }
        return mostRecentDateTime;
    } else {
        return { date: '', time: ''};
    }
}

/** 
 * Get the most recent version of a file from a list of file info.
 * 
 * @param {Object[]} versions - An array of versions
 * @param {string} versions[].date - The date of the file version in 'MM-DD-YYYY' format.
 * @param {string} versions[].time - The time of the file version in 'HH:MM' format.
 * 
 * @returns - {date: '', time: ''} filled or empty if not found
 */
export const newChooseMostRecentSimple = (versions) => {

    if (versions.length > 0) {
        let mostRecentDateObject = new Date(versions[0].date + ' ' + versions[0].time);
        let mostRecentDateTime = versions[0];
        versions.forEach((version) => {
            let testDateObject = new Date(version.date + ' ' + version.time);
            if (testDateObject > mostRecentDateObject) {
                mostRecentDateObject = testDateObject;
                mostRecentDateTime = version;
            }
        });
        return mostRecentDateTime;
    } else {
        return { date: '', time: '' };
    }
}


// ADD NUM PERIODS TO DATE

/**
 * Adds or subtracts a specified number of periods to a date object.
 *
 * @param {Object} dateIn - {date, time}
 * @param {string} period - The period to add (must be one of 'year', 'month', 'day', 'hour', or 'minute').
 * @param {number} num - The number of periods to add (can be negative to subtract).
 * @returns {Object} The updated {date, time} object.
 */
export function addToDateTime(dateIn, period, num) {

    const date = {
        month: dateIn.date.split('/')[0],
        day: dateIn.date.split('/')[1],
        year: dateIn.date.split('/')[2],
        hour: dateIn.time.split(':')[0],
        minute: dateIn.time.split(':')[1],
    };

    try {

        // Throw error if and of x/y/z not provided or if no x:y provided and calculation requires it
        if (!dateIn.date) {
            throw new Error('No date provided');
        } else if (!dateIn.time) {
            throw new Error('No time provided');
        }

        const newDate = new Date(date.year, date.month - 1, date.day, date.hour, date.minute);

        switch (period) {
            case 'year':
                newDate.setFullYear(newDate.getFullYear() + num);
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() + num);
                break;
            case 'day':
                newDate.setDate(newDate.getDate() + num);
                break;
            case 'hour':
                newDate.setHours(newDate.getHours() + num);
                break;
            case 'minute':
                newDate.setMinutes(newDate.getMinutes() + num);
                break;
            default:
                throw new Error('Invalid period. Use "year", "month", "day", "hour", or "minute".');
        }

        return {
            ...dateIn,
            year: newDate.getFullYear(),
            month: newDate.getMonth() + 1, // getMonth() returns 0-11
            day: newDate.getDate(),
            hour: newDate.getHours(),
            minute: newDate.getMinutes(),
        };
    } catch (err) {
        console.error('Error in addToDate:', err);
    }
}

/**
 * Adds or subtracts a specified number of periods to a date object.
 *
 * @param {Object} dateIn - {month, day, year, hour, minute}
 * @param {string} period - The period to add (must be one of 'year', 'month', 'day', 'hour', or 'minute').
 * @param {number} num - The number of periods to add (can be negative to subtract).
 * @returns {Object} The updated {month, day, year, hour, minute} object.
 */
export function addToSplitDate(dateIn, period, num) {

    const date = {
        ...dateIn,
        hour: dateIn.hour || '00',
        minute: dateIn.minute || '00'
    }

    try {

        // Throw error if and of x/y/z not provided or if no x:y provided and calculation requires it
        if (!dateIn.year) {
            throw new Error('No year provided');
        } else if (!dateIn.month) {
            throw new Error('No month provided');
        } else if (!dateIn.day) {
            throw new Error('No day provided');
        } else if (!dateIn.hour && (period === 'hour' || period === 'minute')) {
            throw new Error(`No hour provided for calculation with period '${period}'`);
        } else if (!dateIn.minute && (period === 'hour' || period === 'minute')) {
            throw new Error(`No minute provided for calculation with period '${period}'`);
        }

        const newDate = new Date(date.year, date.month - 1, date.day, date.hour, date.minute);

        switch (period) {
            case 'year':
                newDate.setFullYear(newDate.getFullYear() + num);
                break;
            case 'month':
                newDate.setMonth(newDate.getMonth() + num);
                break;
            case 'day':
                newDate.setDate(newDate.getDate() + num);
                break;
            case 'hour':
                newDate.setHours(newDate.getHours() + num);
                break;
            case 'minute':
                newDate.setMinutes(newDate.getMinutes() + num);
                break;
            default:
                throw new Error('Invalid period. Use "year", "month", "day", "hour", or "minute".');
        }

        return {
            ...dateIn,
            year: newDate.getFullYear(),
            month: newDate.getMonth() + 1, // getMonth() returns 0-11
            day: newDate.getDate(),
            hour: newDate.getHours(),
            minute: newDate.getMinutes(),
        };
    } catch (err) {
        console.error('Error in addToDate:', err);
    }
}


/** Given int 0-6 returns associated weekday string */
export const getWeekdayString = (weekdayNum) => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (weekdayNum >= 0 && weekdayNum <= 7 && weekdayNum % 1 === 0) {
        return daysOfWeek[weekdayNum];
    } else {
        return 'NA';
    }
}

/**
 * Filters fileInfo objects based on the specified start and end date-time range.
 *
 * @param {Array} fileInfo - Array of objects containing directory, filename, and dateTime.
 * @param {Object} start - Start date-time object with { date: 'mm/dd/yyyy', time: 'hh:mm' }.
 * @param {Object} end - End date-time object with { date: 'mm/dd/yyyy', time: 'hh:mm' }.
 * @returns {Array} Filtered array of fileInfo objects within the date range.
 */
export function filterByRange(fileInfo, start, end) {
    // Convert date-time object to a JavaScript Date object
    const parseDateTime = ({ date, time }) => {
        const [month, day, year] = date.split('/');
        const [hour, minute] = time.split(':');
        return new Date(year, month - 1, day, hour, minute);
    };

    // Parse start and end times into Date objects
    const startDateTime = parseDateTime(start);
    const endDateTime = parseDateTime(end);

    // Filter fileInfo within the date range
    return fileInfo.filter(item => {
        const itemDateTime = parseDateTime(item.dateTime);
        return itemDateTime >= startDateTime && itemDateTime <= endDateTime;
    });
}

/**
 * Determines whether to log and how verbose the logging should be based on the provided log level and characters.
 *
 * @param {string[]} logLevel - An array of strings representing the current logging levels.
 * @param {string[]} characters - The characters to check for in the logging levels.
 * @returns {number} - Returns 2 if the log level includes one of the characters followed by 'v',
 *                     1 if the log level includes just one of the characters,
 *                     and 0 otherwise.
 * 
 * @example 
 * logCheck(['e','bv','o'],['b','e']) = 2
 * 
 * @example
 * logCheck(['ev','bv','o'],['o','d']) = 1
 */
export const logCheck = (logLevel, characters) => {
    
    // return 2 if char+'v' exists
    for (const character of characters) {
        if (logLevel.includes(character+'v')) {
            return 2;
        }
    }

    // return 1 if char+'v' DNE and char exists
    for (const character of characters) {
        if (logLevel.includes(character)) {
            return 1;
        }
    }
        
    // return 0 if char and char+'v' DNE
    return 0;
}