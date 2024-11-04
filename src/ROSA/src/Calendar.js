import React, { useState, useEffect, useRef
} from 'react';

import { getWeekdayString, chooseMostRecent, formatDateToObject,
    convertUTCstringsToLocal, convertLocalStringsToUTC, parseDateObject
} from './oddsAndEnds';

import { deleteEntry, fetchObject, fetchObjects, fetchFiles, saveObject
} from './generalFetch';

import { differenceInDays, differenceInMonths, differenceInYears, 
    addDays, addMonths, addYears 
} from 'date-fns';

import { EditMiscObject 
} from './DirectEdit';

export const ScheduleView = ({ printLevel, selectFn, selectResolutionInfo, selectDirTitleAndVersion, mode }) => {

    const today = new Date();
    const [startDateIn, setStartDateIn] = useState('');
    const [endDateIn, setEndDateIn] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [include, setInclude] = useState(false);
    const [specifiedDirectory, setSpecifiedDirectory] = useState('');
    const [specifiedDirectories, setSpecifiedDirectories] = useState([]);
    const [specifiedTitle, setSpecifiedTitle] = useState('');
    const [specifiedTitles, setSpecifiedTitles] = useState([]);
    const initImport = mode === 'mainMenu' ? true : false;
    const [importEvents, setImportEvents] = useState(initImport);
    const [timelineEvents, setTimelineEvents] = useState([]);
    const [scheduleEvents, setScheduleEvents] = useState([]);
    const [resolvedEvents, setResolvedEvents] = useState([]);
    const [colorGradientBasis, setColorGradientBasis] = useState([]);
    const [colorGradient, setColorGradient] = useState([]);
    const [expandedCell, setExpandedCell] = useState(null);
    const [selection, setSelection] = useState(null);
    const [selectionType, setSelectionType] = useState(null);
    const [dblCheckDelete, setDblCheckDelete] = useState(false);
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        const todayMidnight = new Date(today);
        todayMidnight.setHours(0, 0, 0, 0);
        setExpandedCell(todayMidnight);
        const startDateCopy = new Date(today);
        const endDateCopy = new Date(today);
        if (mode === 'calendar') {
            startDateCopy.setDate(today.getDate() - 2);
            endDateCopy.setDate(today.getDate() + 4);
        } else if (mode === 'mainMenu') {
            startDateCopy.setDate(today.getDate());
            endDateCopy.setDate(today.getDate() + 2);
        } else {
            console.log('schedule view mode is unknown');
        }
        setStartDateIn(formatDateToObject(startDateCopy).date);
        setEndDateIn(formatDateToObject(endDateCopy).date);
        fetchFromRange(formatDateToObject(startDateCopy).date, formatDateToObject(endDateCopy).date)
    }, []);

    useEffect(() => {
        setScrollPosition(0);
    }, [expandedCell]);

    const uponInputChange = (inputValue, setInputValue) => {
        setInputValue(inputValue);
    };

    const fetchEventsFromRange = async (start, end) => {
        console.log('importing events from', start, ' to ', end);
        console.time('infoTime');
        try {
            const files = await fetchFiles('customInfo', 'Garrit');
            //console.log('info files:', files);
            if (importEvents) {
                const filteredFiles = files.filter((file) => {
                    const elementDateObj = parseDateObject(convertUTCstringsToLocal({ date: file.dateTime.date, time: file.dateTime.time }));
                    if (include) {
                        return elementDateObj >= start && elementDateObj < end &&
                            (specifiedDirectories.includes(file.directory) || specifiedTitles.includes(file.title));
                    } else {
                        return elementDateObj >= start && elementDateObj < end &&
                            (!specifiedDirectories.includes(file.directory) && !specifiedTitles.includes(file.title))
                    }
                });
                const timelineInit = await callFetchObject('customInfo', 'Garrit', filteredFiles);
                setTimelineEvents(timelineInit);
                console.log('Imported Events:', timelineInit);
            } else {
                setTimelineEvents([]);
            }
            return files;
        } catch (err) {
            console.log('Error fetching info:', err);
            return [];
        } finally {
            console.timeEnd('infoTime');
        }
    }

    const fetchSchedulesFromRange = async (startUTC, endUTC) => {
        console.time('scheduleTime');
        let schedulesBuilt = [];
        try {
            // Import all {title, directory, dateTime} from table
            const scheduleFiles = await fetchFiles('scheduledEvents', 'Garrit');
            //console.log('schFiles',scheduleFiles);
            // Add userID attribute
            const schedulesAttributes = scheduleFiles.map((file) => {
                return { ...file, userID: 'Garrit' };
            });
            //console.log('schAtts',schedulesAttributes);
            // Add content to attributes
            const scheduleContent = await fetchObjects('scheduledEvents', schedulesAttributes);
            //console.log('schCont',scheduleContent);
            // Reduce to one dimension by adding adequate info to each element of content
            const scheduleObjects = scheduleContent.map((file) => {
                return file.content.map((content) => { return { ...content, title: file.title, directory: file.directory, dateTime: file.dateTime } })
            }).reduce((accumulator, schedule) => accumulator.concat(schedule), [])
                .filter((object) =>
                    (include && (specifiedDirectories.includes(object.directory) || specifiedTitles.includes(object.title)))
                    || (!include && (!specifiedDirectories.includes(object.directory) && !specifiedTitles.includes(object.title))));
            //console.log('schObs',scheduleObjects);
            if (scheduleObjects.length > 0) {
                scheduleObjects.map((element, index) => {

                    const convertDateIfNeedBe = (dT) => {
                        if (!element.UTC) {
                            return parseDateObject(convertUTCstringsToLocal(formatDateToObject(dT)));
                        } else {
                            return dT;
                        }
                    }

                    const startCutoff = element.startCutoff === 'NA'
                        ? 'NA'
                        : parseDateObject({ date: element.startCutoff, time: '00:00' });
                    const endCutoff = element.endCutoff === 'NA'
                        ? 'NA'
                        : parseDateObject({ date: element.endCutoff, time: '00:00' });
                    const elementStartObj = element.UTC
                        ? parseDateObject(convertLocalStringsToUTC({ date: element.startDate, time: element.startTime }))
                        : parseDateObject({ date: element.startDate, time: element.startTime });
                    const elementEndObj = element.UTC
                        ? parseDateObject(convertLocalStringsToUTC({ date: element.endDate, time: element.endTime }))
                        : parseDateObject({ date: element.endDate, time: element.endTime });
                    const startDateObj = convertDateIfNeedBe(startUTC);
                    const endDateObj = convertDateIfNeedBe(endUTC);
                    //console.log(index, elementStartObj, elementEndObj);
                    switch (element.repeat) {
                        case 'specifiedDates': {
                            if (parseDateObject({ date: element.startDate, time: element.startTime }) >= startDateObj ||
                                parseDateObject({ date: element.endDate, time: element.endTime }) <= endDateObj) {
                                schedulesBuilt.push({
                                    ...element,
                                    startDate: element.startDate,
                                    endDate: element.endDate,
                                    startTime: element.startTime,
                                    endTime: element.endTime,
                                });
                            }
                            break;
                        } case 'specifiedSplit':
                        case 'weekly': {
                            // Split (in days) between start/next start and end/next end
                            const interval = element.repeat === 'specifiedSplit'
                                ? parseInt(element.interval) : 7;

                            //console.log(parseDateObject({ date: element.endDate, time: element.endTime }));
                            //console.log(parseDateObject({ date: element.startDate, time: element.startTime }));

                            // if earlier date is first, returns negative
                            let dayDiff = differenceInDays(startDateObj, parseDateObject({ date: element.endDate, time: element.endTime }));
                            //console.log('dayDiff',dayDiff);
                            //console.log(parseDateObject({ date: element.endDate, time: element.endTime }), startDateObj,dayDiff);
                            while (dayDiff % interval !== 0) {
                                dayDiff++;
                            }

                            let startDateCopy = addDays(parseDateObject({ date: element.startDate, time: element.startTime }), dayDiff);
                            let endDateCopy = addDays(parseDateObject({ date: element.endDate, time: element.endTime }), dayDiff);

                            //console.log(element.subtitle);
                            //console.log('objs',startDateObj, endDateObj);
                            //console.log('cSD2', startDateCopy, endDateCopy);
                            while (startDateCopy <= endDateObj) {
                                //console.log('outer loop');
                                //console.log(element.UTC, currentStartDate, currentEndDate);
                                //console.log('inner loop');
                                // If not start date or end date I'd like to see 00:00-23:59, so converting that to UTC, so conversion later shows expected time
                                const scheduleElement = {
                                    ...element,
                                    startDate: formatDateToObject(startDateCopy).date,
                                    endDate: formatDateToObject(endDateCopy).date,
                                    startTime: element.startTime,
                                    endTime: element.endTime,
                                };
                                //console.log('sch',scheduleElement);
                                //console.log(element.subtitle,scheduleElement)
                                if ((startCutoff < parseDateObject({ date: scheduleElement.startDate, time: scheduleElement.startTime }) || startCutoff === 'NA') &&
                                    (endCutoff > parseDateObject({ date: scheduleElement.endDate, time: scheduleElement.endTime }) || endCutoff === 'NA')) {
                                    schedulesBuilt.push(scheduleElement);
                                }

                                startDateCopy = addDays(startDateCopy, interval);
                                endDateCopy = addDays(endDateCopy, interval);
                            }
                            break;
                        } case 'monthly': {

                            // if earlier date is first, returns negative
                            let monthDiff = differenceInMonths(startDateObj, parseDateObject({ date: element.endDate, time: element.endTime }));

                            let startDateCopy = addMonths(parseDateObject({ date: element.startDate, time: element.startTime }), monthDiff);
                            let endDateCopy = addMonths(parseDateObject({ date: element.endDate, time: element.endTime }), monthDiff);

                            //console.log('cSD2', startDateCopy, endDateCopy);
                            let ctr = 0;
                            while (addMonths(startDateCopy, ctr) <= endDateObj) {
                                const scheduleElement = {
                                    ...element,
                                    startDate: formatDateToObject(addMonths(startDateCopy, ctr)).date,
                                    endDate: formatDateToObject(addMonths(endDateCopy, ctr)).date,
                                    startTime: element.startTime,
                                    endTime: element.endTime,
                                };
                                if ((startCutoff < parseDateObject({ date: scheduleElement.startDate, time: scheduleElement.startTime }) || startCutoff === 'NA') &&
                                    (endCutoff > parseDateObject({ date: scheduleElement.endDate, time: scheduleElement.endTime }) || endCutoff === 'NA')) {
                                    schedulesBuilt.push(scheduleElement);
                                }
                                ctr++;
                            }
                            break;
                        } case 'yearly': {
                            // if earlier date is first, returns negative
                            let yearDiff = differenceInYears(startDateObj, parseDateObject({ date: element.endDate, time: element.endTime }));

                            let startDateCopy = addYears(parseDateObject({ date: element.startDate, time: element.startTime }), yearDiff);
                            let endDateCopy = addYears(parseDateObject({ date: element.endDate, time: element.endTime }), yearDiff);

                            //console.log('cSD2', startDateCopy, endDateCopy);
                            let ctr = 0;
                            while (addYears(startDateCopy, ctr) <= endDateObj) {
                                const scheduleElement = {
                                    ...element,
                                    startDate: formatDateToObject(addYears(startDateCopy, ctr)).date,
                                    endDate: formatDateToObject(addYears(endDateCopy, ctr)).date,
                                    startTime: element.startTime,
                                    endTime: element.endTime,
                                };
                                if ((startCutoff < parseDateObject({ date: scheduleElement.startDate, time: scheduleElement.startTime }) || startCutoff === 'NA') &&
                                    (endCutoff > parseDateObject({ date: scheduleElement.endDate, time: scheduleElement.endTime }) || endCutoff === 'NA')) {
                                    schedulesBuilt.push(scheduleElement);
                                    console.log('yer', scheduleElement);
                                }
                                ctr++;
                            }
                            break;
                        }
                    }
                });
                console.log('schedules:', schedulesBuilt);
                setScheduleEvents(schedulesBuilt);
                return schedulesBuilt;
            } else {
                console.log('empty boi');
                setScheduleEvents([]);
                return [];
            }
        } catch (err) {
            console.error('Error fetching schedule:', err);
        } finally {
            console.timeEnd('scheduleTime');
        }
    }

    const fetchResolutionsFromRange = async (start, end, startUTC, endUTC) => {
        console.time('resolutionTime');
        try {
            const resolvedFiles = await fetchFiles('resolvedEvents', 'Garrit');
            const resolvedAttributes = resolvedFiles.map((file) => {
                return { ...file, userID: 'Garrit' };
            });
            const resolvedContent = await fetchObjects('resolvedEvents', resolvedAttributes);
            const resolvedObjects = resolvedContent.reduce((accumulator, resolution) => accumulator.concat(resolution), []);
            const resolvedInit = resolvedObjects.filter((file) => {
                const elementStartDateObj = parseDateObject(convertUTCstringsToLocal({ date: file.content.endDate, time: file.content.endTime }));
                const elementEndDateObj = parseDateObject(convertUTCstringsToLocal({ date: file.content.endDate, time: file.content.endTime }));
                if (file.UTC) {
                    return ((elementStartDateObj >= startUTC && elementStartDateObj < endUTC)
                        || (elementEndDateObj >= startUTC && elementEndDateObj < endUTC))
                        && (include && (specifiedDirectories.includes(file.directory) || specifiedTitles.includes(file.title))
                            || (!include && (!specifiedDirectories.includes(file.directory) && !specifiedTitles.includes(file.title)))
                        );
                } else {
                    return ((elementStartDateObj >= start && elementStartDateObj < end)
                        || (elementEndDateObj >= start && elementEndDateObj < end))
                        && (include && (specifiedDirectories.includes(file.directory) || specifiedTitles.includes(file.title))
                            || (!include && (!specifiedDirectories.includes(file.directory) && !specifiedTitles.includes(file.title)))
                        );
                }
            })
            console.log('resolutions imported for calendar', resolvedInit);
            setResolvedEvents(resolvedInit);
        } catch (err) {
            console.error('Error fetching resolutions:', err)
        } finally {
            console.timeEnd('resolutionImportTime');
        }
    }

    // Set relevantEvents to files with .MM-DD-YYYY.HH-mm within range
    const fetchFromRange = async (start, end) => {
        setStartDate({ date: start, time: '00:00' });
        setEndDate({ date: end, time: '00:00' });

        // Create dates with a one day buffer zone to account for a lack of time change when 
        // importing information (Allows me to keep data for years and not take ages to load) 
        const startDateUTC = parseDateObject(convertLocalStringsToUTC({ date: start, time: '00:00' }));
        startDateUTC.setDate(startDateUTC.getDate() - 1);
        const endDateUTC = parseDateObject(convertLocalStringsToUTC({ date: end, time: '00:00' }));
        endDateUTC.setDate(endDateUTC.getDate() + 1);

        const startDate = parseDateObject({ date: start, time: '00:00' });
        startDate.setDate(startDate.getDate() - 1);
        const endDate = parseDateObject({ date: end, time: '00:00' });
        endDate.setDate(endDate.getDate() + 1);

        await fetchResolutionsFromRange(startDate, endDate, startDateUTC, endDateUTC);

        const builtSchedules = await fetchSchedulesFromRange(startDateUTC, endDateUTC);

        const timelineInit = await fetchEventsFromRange(startDateUTC, endDateUTC);

        if (timelineInit && builtSchedules) {
            const cgBasis = Array.from(new Set([...timelineInit.map(element => element.directory),
            ...builtSchedules.map(element => element.directory)]));
            setColorGradientBasis(cgBasis);
            createColorGradient(cgBasis);
        } else if (timelineInit) {
            setColorGradientBasis(timelineInit);
            createColorGradient(timelineInit);
        } else if (builtSchedules) {
            setColorGradientBasis(builtSchedules);
            createColorGradient(builtSchedules);
        }
    }

    const callFetchObject = async (tableOut, userIDout, fileObjects) => {

        /*const events = await Promise.all(fileObjects.map(async (file) => {
            try {
                const UIin = await fetchObject(table,file.dateTime,'Garrit',file.directory,file.title);
                return {...file, UI: UIin};
            } catch(err) {
                console.error('Error fetching',file,'UI:',err);
                return null;
            }
        }));*/

        const attributes = fileObjects.map((file) => { return { ...file, userID: userIDout } });

        const events = await fetchObjects(tableOut, attributes);

        return events.map((event) => {
            const { content, ...restOfEvent } = event;
            return { ...restOfEvent, UI: content };
        });
    }

    const DisplayInfo = ({ info }) => {

        console.log(info);
        return (
            <div>
                {info.UI.map((element, i) => {
                    switch (element.type) {
                        case 'soloButton':
                            return (<button key={i} style={{ color: (element.outVal && element.outVal[0] === 'disabled') ? 'gray' : 'blacak' }}>{element.text}</button>);
                        case 'entry':
                        case 'earning':
                        case 'spending':
                        case 'subtitle':
                            return (
                                <div key={i} style={{ display: 'flex' }}>
                                    <p>{element.text}</p>
                                    {element.outVal
                                        ? element.outVal.map((outValue, j) => (
                                            <input
                                                value={outValue}
                                                key={i + ',' + j}
                                                readOnly
                                            />
                                        ))
                                        : <input
                                            value={''}
                                            key={i + ',0'}
                                            readOnly
                                        />
                                    }
                                </div>
                            );
                        case 'startDate':
                        case 'startTime':
                            return (
                                <div key={i} style={{ display: 'flex' }}>
                                    <p>{element.text}</p>
                                    <input
                                        value={element.outVal || ''}
                                        key={i + ',0'}
                                        readOnly
                                    />
                                </div>
                            );
                        case 'text box':
                            return (
                                <div key={i} style={{ display: 'flex' }}>
                                    <p>{element.text}</p>
                                    {element.outVal
                                        ? <textarea
                                            value={element.outVal}
                                            readOnly
                                        />
                                        : <textarea
                                            value={''}
                                            readOnly
                                        />
                                    }
                                </div>
                            );
                    }
                })}
            </div>
        );
    }

    const DisplayScheduled = ({ info }) => {
        const [objectFile, setObjectFile] = useState([]);
        const [mostRecent, setMostRecent] = useState(null);

        useEffect(() => {
            const fetchData = async () => {
                try {
                    const files = await fetchFiles('CustomUI', 'Garrit');
                    const recent = chooseMostRecent(files, info.directory, info.title);
                    setMostRecent(recent);
                    const object = await fetchObject('CustomUI', recent, 'Garrit', info.directory, info.title);
                    setObjectFile(object);
                } catch (err) {
                    console.error('Error Displaying selected schedule UI:', err);
                }
            };

            fetchData();
        }, [info]);

        return (
            <div>
                <button onClick={() => {
                    generateReminder(info);
                    handleScheduleResolution(false, info.directory,
                        info.title, mostRecent, info);
                }}
                >
                    Remind And Resolve
                </button>
                <button onClick={() => handleScheduleResolution(false, info.directory,
                    info.title, mostRecent, info)}
                >
                    Resolve
                </button>
                <button onClick={() => handleScheduleResolution(true, info.directory,
                    info.title, mostRecent, info)}
                >
                    Resolve and Input Info
                </button>
                <button onClick={() => handleUnresolving(info)}
                >
                    Unresolve
                </button>
                {mode === 'calendar' &&
                    <EditMiscObject selectFn={selectFn}
                        preselectedTable={'scheduledEvents'}
                        preselectedDir={info.directory}
                        preselectedTitle={info.title}
                        preselectedVersion={info.dateTime} />
                }
            </div>
        );
    };

    const DisplayResolved = ({ info }) => {
        return (
            <div>
                {mode === 'calendar' &&
                    <EditMiscObject selectFn={selectFn}
                        preselectedTable={'resolvedEvents'}
                        preselectedDir={info.directory}
                        preselectedTitle={info.title}
                        preselectedVersion={info.dateTime} />
                }
            </div>
        );
    }

    const plotBar = (type) => {
        if (type === 'time') {
            const labels = Array.from(new Set(timelineEvents.map((event) => (event.title))));
            const data = labels.map((tag) => { return { label: tag, value: 0 } });
            timelineEvents.map((event) => {

                if (event.UI.find((element) => (element.group === 'start'))) {
                    const startTime = event.UI.find((element) => (element.type === 'startTime')).outVal;
                    const startDate = event.UI.find((element) => (element.type === 'startDate')).outVal;
                    const endTime = event.dateTime.time;
                    const endDate = event.dateTime.date;
                    data.find((element) => (element.label === event.title)).value = data.find((element) => (element.label === event.title)).value +
                        (
                            parseDateObject({ date: endDate, time: endTime }) - parseDateObject({ date: startDate, time: startTime })
                        ) / (1000 * 60 * 60);
                }
            });
        } /*else if (type === 'finances') {
            const labels = Array.from(new Set(timelineEvents.map((event) => (event.title))));
            const data = labels.map((tag) => { return { label: tag, sublabel:, value: 0 } });
            timelineEvents.map((event) => {

                if (event.UI.find((element) => (element.group === 'earning'))) {

                } if (event.UI.find((element) => (element.group === 'spending'))) {

                }
            });
        }*/
    }

    const handleContentEditing = (functionToOpen, directory, file, version) => {
        console.log('editing ', functionToOpen, directory, file, version, ' content');
        selectDirTitleAndVersion(directory, file, version);
        selectFn(functionToOpen);
    };

    const handleEventDeleting = async (selection) => {
        console.log('deleting event', selection);
        setDblCheckDelete(false);
        try {
            const responseMsg = await deleteEntry('customInfo', selection.dateTime, 'Garrit', selection.directory, selection.title);
            console.log(responseMsg)
            setSelection(null);
            await fetchFromRange(startDateIn, endDateIn);
        } catch (err) {
            console.error('Error fetching directories and files:', err);
        }
    };

    const handleResolutionDeleting = async (selection) => {
        console.log('deleting resolution', selection);
        setDblCheckDelete(false);
        try {
            const responseMsg = await deleteEntry('resolvedEvents', selection.dateTime,
                'Garrit', selection.directory, selection.title);
            console.log(responseMsg);
            setSelection(null);
            setResolvedEvents(resolvedEvents.filter((resolution) => (
                resolution.dateTime.date !== selection.dateTime.date ||
                resolution.dateTime.time !== selection.dateTime.time ||
                resolution.title !== selection.title ||
                resolution.directory !== selection.directory
            )));
        } catch (err) {
            console.error('Error fetching directories and files:', err);
        }
    };

    const handleUnresolving = async (selection) => {
        console.log('deleting resolution', selection);
        setDblCheckDelete(false);
        try {
            const responseMsg = await deleteEntry('resolvedEvents', { date: selection.endDate, time: selection.endTime },
                'Garrit', selection.directory, selection.title);
            console.log(responseMsg);
            setResolvedEvents(resolvedEvents.filter((resolution) => (
                resolution.dateTime.date !== selection.endDate ||
                resolution.dateTime.time !== selection.endTime ||
                resolution.title !== selection.title ||
                resolution.directory !== selection.directory
            )));
        } catch (err) {
            console.error('Error fetching directories and files:', err);
        }
    };

    const handleScheduleResolution = async (enterInfo, directory, title, version, info) => {

        const resolutionInfo = {
            UTC: info.UTC, subtitle: info.subtitle, title: info.title, directory: info.directory,
            startDate: info.startDate, startTime: info.startTime, endDate: info.endDate, endTime: info.endTime
        }
        try {
            const response = await saveObject('resolvedEvents', resolutionInfo,
                { date: info.endDate, time: info.endTime }, 'Garrit', directory, title);
            console.log(response);
        } catch (err) {
            console.log('Error recording resolved dateTime:', err);
        }
        if (enterInfo) {
            selectDirTitleAndVersion(directory, title, version);
            selectResolutionInfo(info);
            console.log('resolving at ', info);
            if (mode === 'calendar') {
                selectFn('resolveSchedule');
            } else if (mode === 'mainMenu') {
                selectFn('resolveScheduleMain');
            }
        } else {
            // Adds to current resolutions, so importing all again not necessary.
            console.log([...resolvedEvents,
            {
                content: resolutionInfo, dateTime: { date: info.endDate, time: info.endTime },
                title: title, directory: directory, userID: 'Garrit'
            }]);
            setResolvedEvents([...resolvedEvents,
            {
                content: resolutionInfo, dateTime: { date: info.endDate, time: info.endTime },
                title: title, directory: directory, userID: 'Garrit'
            }]);
        }
    }

    const generateReminder = async (element) => {
        const subtitleString = (element.subtitle && element.subtitle !== 'NA')
            ? ', ' + element.subtitle + ' '
            : ' ';

        try {
            const noteInfo = {
                subtitle: element.subtitle,
                event: `${element.directory}: ${element.title}` + subtitleString,
                dueDate: element.endDate, urgency: '10', note: 'resolve this in calendar before here (FOR NOW).',
            };
            const dateTime = { date: element.endDate, time: element.endTime };
            if (element.subtitle && element.subtitle !== 'NA') {
                const response = await saveObject('quickNote', noteInfo, dateTime, 'Garrit',
                    element.directory + '/' + element.title, element.subtitle);
                console.log(response);
            } else {
                const response = await saveObject('quickNote', noteInfo, dateTime, 'Garrit',
                    element.directory, element.title);
                console.log(response);
            }
        } catch (err) {
            console.log('Error auto-generating quick note:', err);
        }
    }

    const createColorGradient = (basis) => {

        if (basis.length > 1) {
            const hexToRGB = (hex) => {
                const bigint = parseInt(hex.slice(1), 16);
                const r = (bigint >> 16) & 255;
                const g = (bigint >> 8) & 255;
                const b = bigint & 255;
                return { r, g, b };
            }

            const rgbToHex = (r, g, b) => {
                return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase()}`;
            }

            const colors = ['#FF0000', '#FFA500', '#0000FF', '#00FF00', '#006400'];
            const numSteps = basis.length;
            const gradient = [];

            for (let i = 0; i < numSteps; i++) {
                const startColorIndex = Math.floor((i / (numSteps - 1)) * (colors.length - 1));
                const endColorIndex = Math.min(startColorIndex + 1, colors.length - 1);
                const colorRatio = (i / (numSteps - 1)) * (colors.length - 1) - startColorIndex;

                const startColor = hexToRGB(colors[startColorIndex]);
                const endColor = hexToRGB(colors[endColorIndex]);

                const r = Math.round(startColor.r + (endColor.r - startColor.r) * colorRatio);
                const g = Math.round(startColor.g + (endColor.g - startColor.g) * colorRatio);
                const b = Math.round(startColor.b + (endColor.b - startColor.b) * colorRatio);

                gradient.push(rgbToHex(r, g, b));
            }

            setColorGradient(gradient);
        } else {
            setColorGradient(['black']);
        }
    }

    const DisplayPlot = ({ data }) => {
        return (
            <div className="bar-chart">
                {JSON.stringify(data)}
            </div>
        );
    };

    const Grid = () => {
        // Create reference dates
        const startDateObj = parseDateObject(startDate);
        const endDateObj = parseDateObject(endDate);
        // Find difference
        const numDays = (endDateObj - startDateObj) / (1000 * 60 * 60 * 24);
        // Indent if more than a week shown based on starting weekday
        const indentLength = numDays > 7 ? startDateObj.getDay() : 0;

        // Create cells as an array to display in return value
        // Uses indentLength to determine where empty cells are to be placed
        const cells = Array.from({ length: numDays + indentLength }, (_, index) => {
            const usedIndex = index - indentLength;
            const fullDateUsed = new Date(startDateObj);
            fullDateUsed.setDate(startDateObj.getDate() + (numDays - (numDays - usedIndex)));
            const dateUsing = formatDateToObject(fullDateUsed).date;
            if (usedIndex < 0) {
                return <EmptyCell
                    key={usedIndex}
                    num={numDays - (numDays - usedIndex)}
                    maxNum={numDays}
                    origin={startDateObj}
                />
            } else {
                return <Cell

                    key={usedIndex}
                    num={numDays - (numDays - usedIndex)}
                    maxNum={numDays}
                    origin={startDateObj}

                    daysEvents={timelineEvents.filter((event) => {
                        // filter by specified dates
                        const date = convertUTCstringsToLocal({ date: event.dateTime.date, time: event.dateTime.time }).date;
                        if (include) {
                            return date === dateUsing && (specifiedDirectories.includes(event.directory) || specifiedTitles.includes(event.title));
                        } else {
                            return date === dateUsing && (!specifiedDirectories.includes(event.directory) && !specifiedTitles.includes(event.title));
                        }
                    }).sort((a, b) => {
                        const aDate =
                            a.UTC
                                ? parseDateObject(convertUTCstringsToLocal({ date: a.dateTime.date, time: a.dateTime.time }))
                                : parseDateObject({ date: a.dateTime.date, time: a.dateTime.time });
                        const bDate =
                            b.UTC
                                ? parseDateObject(convertUTCstringsToLocal({ date: b.dateTime.date, time: b.dateTime.time }))
                                : parseDateObject({ date: b.dateTime.date, time: b.dateTime.time });
                        return aDate - bDate
                    })}

                    daysSchedule={scheduleEvents.filter((event) => {
                        let startDate;
                        let endDate;
                        if (event.UTC) {
                            startDate = parseDateObject(convertUTCstringsToLocal({ date: event.startDate, time: event.startTime }));
                            endDate = parseDateObject(convertUTCstringsToLocal({ date: event.endDate, time: event.endTime }));
                        } else {
                            startDate = parseDateObject({ date: event.startDate, time: event.startTime });
                            endDate = parseDateObject({ date: event.endDate, time: event.endTime });
                        }
                        if (include) {
                            return ((formatDateToObject(startDate).date === dateUsing ||
                                formatDateToObject(endDate).date === dateUsing ||
                                (startDate <= fullDateUsed && endDate >= fullDateUsed)))
                                && (specifiedDirectories.includes(event.directory) || specifiedTitles.includes(event.title));
                        } else {
                            /*if (dateUsing === '12/31/2023') {
                                console.log('sDeD', startDate, endDate,event);
                                console.log('dU',dateUsing);
                                console.log('fDU',fullDateUsed);
                                console.log('truths', startDate <= fullDateUsed, endDate >= fullDateUsed);
                            }*/

                            // return if (date string is equal to end OR start date string 
                            // OR if date object is between start date object AND end date object)
                            // AND meets inclusivity by name criteria
                            return ((formatDateToObject(startDate).date === dateUsing ||
                                formatDateToObject(endDate).date === dateUsing ||
                                (startDate <= fullDateUsed && endDate >= fullDateUsed)))
                                && (!specifiedDirectories.includes(event.directory) && !specifiedTitles.includes(event.title));
                        }
                    }).sort((a, b) => {
                        const aDate =
                            a.UTC
                                ? parseDateObject(convertUTCstringsToLocal({ date: a.startDate, time: a.startTime }))
                                : parseDateObject({ date: a.startDate, time: a.startTime });
                        const bDate =
                            b.UTC
                                ? parseDateObject(convertUTCstringsToLocal({ date: b.startDate, time: b.startTime }))
                                : parseDateObject({ date: b.startDate, time: b.startTime });
                        return aDate - bDate
                    })}

                    daysResolutions={resolvedEvents.filter((event) => {
                        //returns if date is included in range of dates of event
                        const convertedStart = event.UTC
                            ? convertUTCstringsToLocal({ date: event.content.startDate, time: event.content.startTime })
                            : { date: event.content.startDate, time: event.content.startTime };
                        const convertedEnd = event.UTC
                            ? convertUTCstringsToLocal({ date: event.content.endDate, time: event.content.endTime })
                            : { date: event.content.endDate, time: event.content.endTime };
                        if (include) {
                            return ((convertedStart.date === dateUsing || convertedEnd.date === dateUsing)
                                || (convertedStart.date <= dateUsing && convertedEnd.date >= dateUsing))
                                && (specifiedDirectories.includes(event.directory) || specifiedTitles.includes(event.title));
                        } else {
                            return ((convertedStart.date === dateUsing || convertedEnd.date === dateUsing)
                                || (convertedStart.date <= dateUsing && convertedEnd.date >= dateUsing))
                                && (!specifiedDirectories.includes(event.directory) && !specifiedTitles.includes(event.title));
                        }
                    }).sort((a, b) => {
                        const aDate =
                            a.UTC
                                ? parseDateObject(convertUTCstringsToLocal({ date: a.startDate, time: a.startTime }))
                                : parseDateObject({ date: a.startDate, time: a.startTime });
                        const bDate =
                            b.UTC
                                ? parseDateObject(convertUTCstringsToLocal({ date: b.startDate, time: b.startTime }))
                                : parseDateObject({ date: b.startDate, time: b.startTime });
                        return aDate - bDate
                    })}
                />
            }
        });
        return (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', overflow: 'auto' }}>
                {cells}
            </div>
        );
    }

    const Cell = ({ num, maxNum, origin, daysEvents, daysSchedule, daysResolutions }) => {
        const [localScrollPosition, setLocalScrollPosition] = useState(scrollPosition);
        const dateObject = new Date(origin);
        const todaysDate = new Date();
        todaysDate.setHours(0, 0, 0, 0);
        dateObject.setDate(origin.getDate() + num);
        //daysSchedule.length > 0 && console.log('dS',daysSchedule, dateObject);
        const divRef = useRef(null);

        // Use useEffect to update the scrollTop when localScrollPosition changes
        useEffect(() => {
            if (divRef.current && expandedCell && ((formatDateToObject(expandedCell).date === formatDateToObject(dateObject).date))) {
                divRef.current.scrollTop = localScrollPosition;
            }
        }, [localScrollPosition]);

        const cellStyle = {
            boxSizing: 'border-box',
            width: expandedCell
                ? (formatDateToObject(expandedCell).date === formatDateToObject(dateObject).date ? (
                    `50%`
                ) : ((sameWeek(expandedCell, dateObject)
                    ? (maxNum < 8 ? `${50 / maxNum}%` : `calc(50% / 6)`)
                    : (maxNum < 8 ? `${50 / maxNum}%` : `calc(100% / 7)`)
                )
                ))
                : (maxNum < 8 ? `${100 / maxNum}%` : `calc(100% / 7)`),
            height: expandedCell
                ? ((formatDateToObject(expandedCell).date === formatDateToObject(dateObject).date)
                    ? '35vh' : '20vh') : '20vh',
            border: '1px solid black',
            display: 'inline-block',
            padding: '2px',
            overflow: 'auto',
        };
        const dateStyle = {
            margin: '0',
            position: 'relative',
            fontSize: '2vh',
        }
        const listStyle = {
            paddingInlineStart: '2px',
            position: 'relative',
            marginLeft: dateStyle.margin,
            fontSize: '1.5vh',
            whiteSpace: 'nowrap',
            listStyleType: 'none',
        }

        return (
            <div ref={divRef} style={cellStyle} onScroll={(e) => setLocalScrollPosition(e.target.scrollTop)}>
                <p
                    style={dateStyle}
                    onClick={() => {
                        expandedCell
                            ? formatDateToObject(expandedCell).date !== formatDateToObject(dateObject).date
                                ? setExpandedCell(dateObject)
                                : setExpandedCell(false)
                            : setExpandedCell(dateObject)
                    }}
                >
                    {formatDateToObject(dateObject).date.split('/').slice(0, -1).join('/') + ' ' + getWeekdayString(dateObject.getDay())}
                </p>
                <div style={{ borderTop: '1px solid orange', borderBottom: '1px solid orange', marginBottom: '5px' }}>
                    {daysSchedule && (
                        <ul style={listStyle}>
                            {daysSchedule.map((element, index) => {
                                //console.log('beginning of map',dateObject,element);

                                const subtitleString = (element.subtitle && element.subtitle !== 'NA')
                                    ? ', ' + element.subtitle + ' '
                                    : ' ';

                                let objectResolved = false;
                                for (let i = 0; i < daysResolutions.length; i++) {
                                    //console.log('res',daysResolutions[i]);
                                    let truth = true;
                                    for (const prop in daysResolutions[i].content) {
                                        if (prop !== 'dateTime' && (daysResolutions[i].content[prop] !== element[prop])) {
                                            truth = false;
                                            //if (subtitleString === ', Remind ') {
                                            //    console.log('res2', dateObject, prop, daysResolutions[i][prop] === element[prop]);
                                            //}
                                            break;
                                        }
                                    }
                                    //console.log(element.subtitle, daysResolutions[i].dateTime.dateTime);
                                    if (truth && (!element.subtitle || (element.subtitle === daysResolutions[i].content.subtitle))) {
                                        objectResolved = true;
                                        break;
                                    }
                                }

                                if (!objectResolved && element.remind && todaysDate > dateObject) {
                                    handleScheduleResolution(false, element.directory, element.title, null, element)
                                    generateReminder(element);
                                }

                                const handleClick = () => {
                                    setScrollPosition(localScrollPosition);
                                    setSelection(daysSchedule[index]); // Update selection with the index of the clicked element
                                    setSelectionType('schedule');
                                    console.log('schedule selection', daysSchedule[index], 'at', element);
                                };

                                const createString = () => {
                                    let displayString = `${element.directory}: ${element.title}` + subtitleString;
                                    if (element.UTC) {
                                        if (convertUTCstringsToLocal({ date: element.startDate, time: element.startTime }).date !== formatDateToObject(dateObject).date) {
                                            displayString += convertUTCstringsToLocal({ date: element.startDate, time: element.startTime }).date + ', ';
                                        }
                                        displayString += convertUTCstringsToLocal({ date: element.startDate, time: element.startTime }).time;
                                        if (convertUTCstringsToLocal({ date: element.endDate, time: element.endTime }).date !== formatDateToObject(dateObject).date) {
                                            displayString += convertUTCstringsToLocal({ date: element.endDate, time: element.endTime }).date + ', ';
                                        }
                                        if (element.endDate !== element.startDate || element.endTime !== element.startTime) {
                                            displayString += ' - ' + convertUTCstringsToLocal({ date: element.endDate, time: element.endTime }).time;
                                        }
                                    } else {
                                        if (element.startDate !== formatDateToObject(dateObject).date) {
                                            displayString += element.startDate + ', ';
                                        }
                                        displayString += element.startTime;
                                        if (element.endDate !== formatDateToObject(dateObject).date) {
                                            displayString += element.endDate + ', ';
                                        }
                                        if (element.endDate !== element.startDate || element.endTime !== element.startTime) {
                                            displayString += ' - ' + element.endTime;
                                        }
                                    }
                                    return displayString;
                                }

                                return (
                                    <li key={index} onClick={handleClick}
                                        style={{
                                            color: colorGradient[colorGradientBasis.findIndex((dir) => (dir === element.directory))],
                                            textDecorationColor: 'darkorange',
                                            textDecorationLine: objectResolved ? 'line-through' : 'underline',
                                            fontWeight: selection === daysSchedule[index] && 'bold',
                                            fontSize: selection === daysSchedule[index] && '12px'
                                        }}
                                    >
                                        {createString()}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <div style={{ borderTop: '1px solid blue', borderBottom: '1px solid blue', marginBottom: '5px' }}>
                    {daysEvents && (
                        <ul style={listStyle}>
                            {daysEvents.map((element, index) => {

                                const endDate = element.dateTime.date;
                                const endTime = element.dateTime.time;
                                const startDate = (element.UI.find((UIelement) => UIelement.type === 'startDate') || { outVal: null }).outVal;
                                const startTime = (element.UI.find((UIelement) => UIelement.type === 'startTime') || { outVal: null }).outVal;

                                const handleClick = () => {
                                    setScrollPosition(localScrollPosition);
                                    setSelection(daysEvents[index]); // Update selection with the index of the clicked element
                                    setSelectionType('event');
                                    console.log('event selection', daysEvents[index], 'at', formatDateToObject(dateObject));
                                };

                                const subtitleString = (element.dateTime.subtitle && element.dateTime.subtitle !== 'NA')
                                    ? ', ' + element.dateTime.subtitle + ' '
                                    : ' ';

                                return (
                                    <li key={index} onClick={handleClick}
                                        style={{
                                            color: colorGradient[colorGradientBasis.findIndex((dir) => (dir === element.directory))],
                                            textDecorationColor: 'teal',
                                            textDecorationLine: 'underline',
                                            fontWeight: selection === daysEvents[index] && 'bold',
                                            fontSize: selection === daysEvents[index] && '12px'
                                        }}>
                                        {startTime
                                            ? `${element.directory}: ${element.title}` + subtitleString + `${convertUTCstringsToLocal({
                                                date: startDate,
                                                time: startTime,
                                            }).time}-${convertUTCstringsToLocal({
                                                date: endDate,
                                                time: endTime,
                                            }).time}`
                                            : `${element.directory}: ${element.title.split('.')[0]}` + subtitleString + `${convertUTCstringsToLocal({
                                                date: endDate,
                                                time: endTime,
                                            }).time}`}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <div style={{ borderTop: '1px solid green', borderBottom: '1px solid green' }}>
                    {daysResolutions && (
                        <ul style={listStyle}>
                            {daysResolutions.map((element, index) => {
                                const handleClick = () => {
                                    setScrollPosition(localScrollPosition);
                                    setSelection(element); // Update selection with the index of the clicked element
                                    setSelectionType('resolution');
                                    console.log('resolution selection', element);
                                };
                                //console.log('element.dateTime',element.dateTime);
                                //console.log('daysSchedule.dateTimes',daysSchedule.map((element) => (element.dateTime)));

                                const subtitleString = (element.content.subtitle && element.content.subtitle !== 'NA')
                                    ? ', ' + element.content.subtitle + ' '
                                    : ' ';

                                return (
                                    <li key={index} onClick={handleClick}
                                        style={{
                                            color: colorGradient[colorGradientBasis.findIndex((dir) => (dir === element.directory))],
                                            textDecorationColor: 'green',
                                            textDecorationLine: 'underline',
                                            fontWeight: selection === daysResolutions[index] && 'bold',
                                            fontSize: selection === daysResolutions[index] && '12px'
                                        }}
                                    >
                                        {element.content.UTC
                                            ? `${element.directory}: ${element.title}` + subtitleString + `${convertUTCstringsToLocal({
                                                date: element.content.startDate,
                                                time: element.content.startTime,
                                            }).time}-${convertUTCstringsToLocal({
                                                date: element.content.endDate,
                                                time: element.content.endTime,
                                            }).time}`
                                            : `${element.content.directory}: ${element.content.title}` + subtitleString + `${element.content.startTime}-${element.content.endTime}`
                                        }
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        );
    }

    const EmptyCell = ({ num, maxNum, origin }) => {
        const dateObject = new Date(origin.getTime() + (num * 1000 * 60 * 60 * 24));
        const cellStyle = {
            boxSizing: 'border-box',
            width: (expandedCell && sameWeek(expandedCell, dateObject))
                ? (maxNum < 8 ? `calc(50% / ${maxNum})` : `calc(50% / 6)`)
                : (maxNum < 8 ? `calc(50% / ${maxNum})` : `calc(100% / 7)`),
            height: '20vh',
            padding: '2px',
            display: 'inline-block',
            border: '1px solid white',
        };
        return (
            <div style={cellStyle}>
            </div>
        );
    }

    const sameWeek = (date1, date2) => {

        const diffDates = differenceInDays(date1, date2);

        const diffDays = date1.getDay() - date2.getDay();
        //console.log(date1, date2, diffDates, diffDays);

        // if difference in dates is same as difference in weekdays AND months are at least adjacent
        if (Math.abs(diffDates) === Math.abs(diffDays)) {
            return true;
        } else {
            return false;
        }
    }

    return (
        <div>
            {mode === 'calendar' &&
                <div>
                    <div style={{ display: 'flex' }}>
                        <p>Start</p>
                        <input
                            value={startDateIn}
                            onChange={(e) => uponInputChange(e.target.value, setStartDateIn)}
                        />
                        <p>End</p>
                        <input
                            value={endDateIn}
                            onChange={(e) => uponInputChange(e.target.value, setEndDateIn)}
                        />
                        <button onClick={() => fetchFromRange(startDateIn, endDateIn)}>Apply Dates</button>
                        <button onClick={() => selectFn('scheduledEvents')}>Schedule New Event</button>
                        <button
                            onClick={() => setImportEvents(importEvents ? false : true)}
                            style={{ color: importEvents ? 'gray' : 'black' }}
                        >
                            Include Event Info
                        </button>
                    </div>
                    <div display={{ style: 'flex' }}>
                        <button onClick={() => setInclude(true)}>Include</button>
                        <button onClick={() => setInclude(false)}>Exclude</button>
                        <input
                            value={specifiedDirectory}
                            list='presentDirectories'
                            onChange={(e) => uponInputChange(e.target.value, setSpecifiedDirectory)}
                        />
                        {
                            <datalist id='presentDirectories'>
                                {colorGradientBasis.map((element, index) => (
                                    <option key={index} value={element} />
                                ))
                                }
                            </datalist>
                        }
                        <button onClick={() => setSpecifiedDirectories([...specifiedDirectories, specifiedDirectory])}>Add Directory</button>
                        <input
                            value={specifiedTitle}
                            list='presentTitles'
                            onChange={(e) => uponInputChange(e.target.value, setSpecifiedTitle)}
                        />
                        {
                            <datalist id='presentTitles'>
                                {Array.from(new Set([...timelineEvents.map(element => element.title),
                                ...scheduleEvents.map(element => element.title)]))
                                    .map((element, index) => (
                                        <option key={index} value={element} />
                                    ))
                                }
                            </datalist>
                        }
                        <button onClick={() => setSpecifiedTitles([...specifiedTitles, specifiedTitle])}>Add Title</button>
                    </div>
                    <div>
                        <ul style={{ 'listStyle': 'none', 'display': 'inline', padding: 0, margin: 0 }}>
                            {include ? 'including directories:' : 'excluding directories:'}
                            {specifiedDirectories.map((event, index) => (
                                <li
                                    key={index}
                                    style={{ display: 'inline', cursor: 'pointer' }}
                                    onClick={() => setSpecifiedDirectories(specifiedDirectories.
                                        filter((element) => (element !== event)))}
                                >
                                    {event + ', '}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <ul style={{ 'listStyle': 'none', 'display': 'inline', padding: 0, margin: 0 }}>
                            {include ? 'including titles:' : 'excluding titles:'}
                            {specifiedTitles.map((event, index) => (
                                <li
                                    key={index}
                                    style={{ display: 'inline', cursor: 'pointer' }}
                                    onClick={() => setSpecifiedTitles(specifiedTitles.
                                        filter((element) => (element !== event)))}
                                >
                                    {event + ', '}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div style={{ height: '30vh', overflowY: 'auto', overflowX: 'wrap' }}>
                        {selection &&
                            (selectionType === 'event' ?
                                <div>
                                    <DisplayInfo info={selection} />
                                    <button onClick={() => handleContentEditing('customEdit', selection)}>Edit Content</button>
                                    <button onClick={() => setDblCheckDelete(true)}>Delete File</button>
                                    {dblCheckDelete &&
                                        <div>
                                            <p>Are you sure?</p>
                                            <button onClick={() => handleEventDeleting(selection)}>Yes</button>
                                            <button onClick={() => setDblCheckDelete(false)}>No</button>
                                        </div>
                                    }
                                </div>
                                : (selectionType === 'schedule') ?
                                    <div>
                                        <DisplayScheduled info={selection} />
                                        <button onClick={() => handleContentEditing('scheduledEvents', selection)}>Edit Content</button>
                                    </div>
                                    : (selectionType === 'resolution') ?
                                        <div>
                                            <DisplayResolved info={selection} />
                                            <button onClick={() => setDblCheckDelete(true)}>Delete File</button>
                                            {dblCheckDelete &&
                                                <div>
                                                    <p>Are you sure?</p>
                                                    <button onClick={() => handleResolutionDeleting(selection)}>Yes</button>
                                                    <button onClick={() => setDblCheckDelete(false)}>No</button>
                                                </div>
                                            }
                                        </div>
                                        : (selectionType === 'plot') &&
                                        <DisplayPlot />
                            )
                        }
                    </div>
                    <div style={{ display: 'flex' }}>
                        <button onClick={() => plotBar('finances')}>Plot Finances</button>
                        <button onClick={() => plotBar('time')}>Plot Time Usage</button>
                        <button onClick={() => selectFn('main')}>Return to Main</button>
                    </div>
                </div>
            }
            <div>
                {timelineEvents && scheduleEvents && resolvedEvents &&
                    <Grid />
                }
            </div>
            <div style={{ height: '30vh', overflowY: 'auto', overflowX: 'wrap' }}>
                {selection &&
                    (selectionType === 'event' ?
                        <div>
                            <DisplayInfo info={selection} />
                            <button onClick={() => handleContentEditing('customEdit', selection)}>Edit Content</button>
                            <button onClick={() => setDblCheckDelete(true)}>Delete File</button>
                            {dblCheckDelete &&
                                <div>
                                    <p>Are you sure?</p>
                                    <button onClick={() => handleEventDeleting(selection)}>Yes</button>
                                    <button onClick={() => setDblCheckDelete(false)}>No</button>
                                </div>
                            }
                        </div>
                        : (selectionType === 'schedule') ?
                            <div>
                                <DisplayScheduled info={selection} />
                                <button onClick={() => handleContentEditing('scheduledEvents', selection)}>Edit Content</button>
                            </div>
                            : (selectionType === 'resolution') ?
                                <div>
                                    <DisplayResolved info={selection} />
                                    <button onClick={() => setDblCheckDelete(true)}>Delete File</button>
                                    {dblCheckDelete &&
                                        <div>
                                            <p>Are you sure?</p>
                                            <button onClick={() => handleResolutionDeleting(selection)}>Yes</button>
                                            <button onClick={() => setDblCheckDelete(false)}>No</button>
                                        </div>
                                    }
                                </div>
                                : (selectionType === 'plot') &&
                                <DisplayPlot />
                    )
                }
            </div>
        </div>
    );
}