import { getDateString, getTimeString } from './oddsAndEnds';
import {
    fetchDateTime, fetchDateTimes, fetchDirsAndFiles, deleteEntry,
    fetchText, fetchObject, fetchObjects, fetchFiles, saveObject, recordDateTime,
    saveText
} from './generalFetch';

import { useState, useEffect } from 'react';

/** Function is used for changing properties in database after they're made
 * * Initially used to change anything about spending to {text: "Spending ($)", type:'spending'}
 */
export const alterMatches = async (table, directory, title, textToFind, updatedText, updatedType) => {

    try {
        const unfilteredFiles = await fetchFiles(table,'Garrit');
        unfilteredFiles.map(async (file) => {
            if ((!directory || directory === file.directory) && (!title || title === file.title)) {
                try {
                    const UI = await fetchObject(table, file.dateTime, 'Garrit', file.directory, file.title);
                    //console.log(table, directory, title, textToFind, updatedText);
                    let ctr = 0;
                    let updatedUI = [];
                    UI.map((element) => {
                        if (element.text === textToFind) {
                            ctr = 1;
                            if ('outVal' in element) {
                                updatedUI.push({ text: 'Category', type: updatedType+'category', outVal: ['none'] });
                                updatedUI.push({ text: 'Item', type: updatedType+'item', outVal: ['none'] });
                                updatedUI.push({ ...element, text: updatedText, type: updatedType, outVal: [element.outVal] });
                            } else {
                                updatedUI.push({ text: 'Category', type: updatedType+'category' });
                                updatedUI.push({ text: 'Item', type: updatedType+'item' });
                                updatedUI.push({ ...element, text: updatedText, type: updatedType });
                            }
                        } else {
                            updatedUI.push(element);
                        }
                    });
                    if (ctr > 0) {
                        try {
                            console.log('updated',updatedUI);
                            const response = await saveObject(table, updatedUI, file.dateTime, 'Garrit', file.directory, file.title);
                            console.log(table, directory, title, textToFind, updatedText, response);
                        } catch (err) {
                            console.log(table, directory, title, textToFind, updatedText,
                                '... Error saving object:', err);
                        }
                    }
                } catch (err) {
                    console.log(table, directory, title, textToFind, updatedText,
                        '... Error fetching object:', err);
                }
            }
        })
    } catch(err) {
        console.log(`Error getting files from ${table}:`,err);
    }

}

export const createCustomUIDropdown = async () => {

    const allTextProps = [];
    try {
        const inFiles = await fetchFiles('CustomUI','Garrit');
        try {
            await Promise.all(inFiles.map(async (file) => {
                const UI = await fetchObject('CustomUI',file.dateTime,'Garrit',file.directory,file.title);
                UI.map((element) => {allTextProps.push(element.text)});
            }));
            const uniqueTextProps = Array.from(new Set(allTextProps));
            try {
                saveObject('miscDropdowns',uniqueTextProps,{ date: getDateString(), time: getTimeString() }, 'Garrit', 'CustomUI', 'textDropdown');
            } catch(err) {
                console.log('Error saving dropdown:',err);
            }
        } catch(err) {
            console.log('Error importing objects from CustomUI',err);
        }
    } catch(err) {
        console.log('Error importing files from CustomUI:',err);
    }
}

export const createCustomInfoDropdowns = async () => {

    try {
        const inFiles = await fetchFiles('CustomInfo', 'Garrit');
        const uniqueFiles = Array.from(new Set(inFiles.map(element => { return { ...element, dateTime: '' } })));
        console.log(uniqueFiles);
        try {
            uniqueFiles.map(async (file) => {
                const dateTimes = await fetchDateTimes('CustomInfo', 'Garrit', file.directory, file.title);
                const textProps = {};
                await Promise.all(dateTimes.map(async (dateTime) => {
                    const UI = await fetchObject('CustomInfo', dateTime, 'Garrit', file.directory, file.title);
                    await Promise.all(
                        UI.map((element) => {
                            if(element.type !== 'text box' && element.type !== 'soloButton' && element.group !== 'start') {
                                if (textProps[element.text]) {
                                    textProps[element.text] = Array.from(new Set([...textProps[element.text], ...element.outVal]));
                                } else {
                                    textProps[element.text] = element.outVal;
                                }
                            }
                        }));
                    for (const prop in textProps) {
                        textProps[prop] = Array.from(new Set(textProps[prop]));
                    }
                }));
                console.log(file,textProps);
                try {
                    saveObject('miscDropdowns', textProps, { date: getDateString(), time: getTimeString() }, 'Garrit', 'CustomInfo/' + file.directory, file.title);
                } catch (err) {
                    console.log('Error saving dropdown:', err);
                }
            })
        } catch (err) {
            console.log('Error importing objects from CustomUI', err);
        }
    } catch (err) {
        console.log('Error importing files from CustomUI:', err);
    }
}

export const convertSchedules = async () => {
    // startCutoff automatically today, end auto NA otherwise getDateTime and saveObject

    const getSchedules = async () => {
        try {
            const schedules = await fetchFiles('resolvedEvents','Garrit');
            return schedules;
        } catch(err) {
            console.error('Issues getting schedules:',err);
        }
    }

    const saveSchedules = async () => {
        const schedules = await getSchedules();

        const reorganized = [];
        await Promise.all(schedules.map((s) => {
            const rindex = reorganized.findIndex((r) => (r.directory === s.directory && r.title === s.title));
            console.log('s',s);
            if (rindex !== -1) {
                reorganized[rindex].dateTimes = [...reorganized[rindex].dateTimes, { ...s.dateTime.dateTime, startCutoff: '10/20/2023', endCutoff: 'NA' }];
            } else {
                reorganized.push({ title: s.title, directory: s.directory, dateTimes: [{ ...s.dateTime.dateTime, startCutoff: '10/20/2023', endCutoff: 'NA' }] });
            }
        }));

        console.log('ro',reorganized);

        reorganized.map((r) => {
            try {
                //console.log('r',r);
                const response = saveObject('miscObject2', r.dateTimes, { date: getDateString(true), time: getTimeString(true) },
                'Garrit',r.directory,r.title);
                console.log(response);
            } catch(err) {
                console.log('Error saving r:',r,err);
            }
        });
    }

    saveSchedules();
}

export const moveTables = async () => {
    const source = 'miscObject2';
    const target = 'resolvedEvents';

    const get = async () => {
        try {
            const attributes = await fetchFiles(source,'Garrit');
            const objs = await fetchObjects(source,attributes.map((att) => {return { ...att, userID: 'Garrit'}}));
            return objs;
        } catch(err) {
            console.error('error fetching objects:',err);
        }
    }

    const save = async () => {
        const objs = await get();

        //console.log('objs',objs);
        objs.map((obj) => {
            try {
                const response = saveObject(target, obj.content, obj.dateTime, obj.userID, obj.directory, obj.title);
                console.log(response);
            } catch(err) {
                console.error('error saving obj:',obj,err);
            }
        })
    }

    save()
}