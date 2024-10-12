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

