/**  return date as MM/DD/YYYY for UTC (or local if true passed) */
export function getDateString(local=false) {
    let options;
    if (local) {
        options = { 
            month: '2-digit',
            day: '2-digit',
            year: 'numeric', 
        };
    } else {    
        options = { 
            timeZone: 'UTC',
            month: '2-digit',
            day: '2-digit',
            year: 'numeric', 
        };
    }
    return new Date().toLocaleDateString(undefined, options);
}
/**  return military time as HH:MM for UTC (or local if true passed) */
export function getTimeString(local=false) {
    let options;
    if (local) {
        options = {
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        };
    } else {    
        options = {
            timeZone: 'UTC',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        };
    }

    return new Date().toLocaleTimeString(undefined, options);
}
/** return object containing day, month(Jan=1), year, hour, minute 
 * @param {boolean} [local] - return UTC time by default, but local if true
*/
export const getCurrentDateStrings = (local = true) => {
    const now = new Date();
    return {
        day: local ? String(now.getDate()).padStart(2, '0') : String(now.getUTCDate()).padStart(2, '0'),
        month: local ? String(now.getMonth() + 1).padStart(2, '0') : String(now.getUTCMonth() + 1).padStart(2, '0'),  // getMonth() is zero-based
        year: local ? String(now.getFullYear()) : String(now.getUTCFullYear()),
        hour: local ? String(now.getHours()).padStart(2, '0') : String(now.getUTCHours()).padStart(2, '0'),
        minute: local ? String(now.getMinutes()).padStart(2, '0') : String(now.getUTCMinutes()).padStart(2, '0')
    };
}
/** Given int 0-6 returns associated weekday string */
export function getWeekdayString(weekdayNum) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    if (weekdayNum >= 0 && weekdayNum <= 7 && weekdayNum % 1 === 0) {
        return daysOfWeek[weekdayNum];
    } else {
        return 'NA';
    }
}
/** Accepts object with date MM-DD-YYYY and time HH-mm properties and returns
 * the object converted from UTC to local
 */
export function convertUTCstringsToLocal(dateTime) {

    const utcDate = new Date(dateTime.date + ' ' + dateTime.time);
    const localDate = new Date(utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000));
    return formatDateToObject(localDate);
} 
/** Accepts object with date MM-DD-YYYY and time HH-mm properties and returns
 * the object converted from local to UTC
 */
export function convertLocalStringsToUTC(dateTime) {
    const localDate = new Date(dateTime.date + ' ' + dateTime.time);
    const utcDate = new Date(localDate.getTime() + (localDate.getTimezoneOffset() * 60000));
    return formatDateToObject(utcDate);
}

/** 
 * Converts a local time object to UTC time.
 * @param {Object} localObj - Object representing local time with properties { day, month, year, hour, minute }.
 * @returns {Object} - Object representing the same date and time in UTC with properties { day, month, year, hour, minute }.
 */
export const convertLocalObjToUTC = (localObj) => {
    const { day, month, year, hour, minute } = localObj;

    // Create a new Date object using the local time (month is zero-indexed, hence month - 1)
    const localDate = new Date(year, month - 1, day, hour, minute);

    // Extract the UTC values
    return {
        day: String(localDate.getUTCDate()).padStart(2, '0'), // Ensures two digits
        month: String(localDate.getUTCMonth() + 1).padStart(2, '0'), // month is 0-indexed, ensures two digits
        year: String(localDate.getUTCFullYear()).padStart(4, '0'), // Ensures four digits
        hour: String(localDate.getUTCHours()).padStart(2, '0'), // Ensures two digits
        minute: String(localDate.getUTCMinutes()).padStart(2, '0'), // Ensures two digits
    };
};

/** 
 * Converts a UTC time object to local time.
 * @param {Object} utcObj - Object representing UTC time with properties { day, month, year, hour, minute }.
 * @returns {Object} - Object representing the same date and time in the local time zone with properties { day, month, year, hour, minute }.
 */
export const convertUTCObjToLocal = (utcObj) => {
    const { day, month, year, hour, minute } = utcObj;

    // Create a new Date object using UTC time (Date.UTC ensures it's in UTC)
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

    // Now extract the local time values (JavaScript automatically converts it to local time)
    return {
        day: String(utcDate.getDate()).padStart(2, '0'), // Local day (two digits)
        month: String(utcDate.getMonth() + 1).padStart(2, '0'), // Local month (two digits)
        year: String(utcDate.getFullYear()).padStart(4, '0'), // Local year (four digits)
        hour: String(utcDate.getHours()).padStart(2, '0'), // Local hour (two digits)
        minute: String(utcDate.getMinutes()).padStart(2, '0'), // Local minute (two digits)
    };
};

/**  Parse a {date,time} object into a date object */
export const parseDateObject = (date) => {
    //console.log(dateString);

    const dateObject = new Date(date.date + ' ' + date.time);
    return dateObject;
}

/** Accept any date object and output a {date,time} object */
export const formatDateToObject = (date) => {
    //console.log(date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    //console.log(`${month}-${day}-${year}.${hours}-${minutes}`);
    return { date:`${month}/${day}/${year}`,time:`${hours}:${minutes}` };
}

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

