import {
    fetchDateTime, recordDateTime, fetchFiles, fetchDirsAndFiles, saveObject, fetchObject, saveText, fetchText, deleteEntry
} from './generalFetch';

export const testSaveTime = async () => {
    const outMsg = await recordDateTime({date:'09/02/2023',time:'14:30'},'someUserID','someDir','someTitle3');
    console.log(outMsg);
}

export const testCallTime = async () => {
    const dateTime = await fetchDateTime('someUserID', 'someDir', 'someTitle2');
    console.log(dateTime);
}

export const testGetFiles = async () => {
    const files = await fetchFiles('timeRecords', 'someUserID');
    console.log(files);
}

export const testGetDirsAndFiles = async () => {
    const data = await fetchDirsAndFiles('timeRecords', 'someUserID');
    console.log(data.files, data.directories);
}

export const testSaveObject = async () => {
    const UI = [{ prop1: '1', prop2: '2' }, { prop1: '10', prop2: '20' }, { prop1: '100', prop2: '200', prop3: '300' }];
    const outMsg = await saveObject('customInfo', UI, { date: '09/04/2023', time: '14:30' }, 'someUserID', 'someDir', 'someTitle');
    console.log(outMsg);
}

export const testGetObject = async () => {
    const UI = await fetchObject('customInfo','someUserID','someDir','someTitle');
    console.log('UI',UI);
}

export const testSaveText = async () => {
    const entry = 'here is a block of text to placehold for this test';
    const outMsg = await saveText('customText', entry, { date: '09/04/2023', time: '14:30' }, 'someUserID', 'someDir', 'someTitle');
    console.log(outMsg);
}

export const testGetText = async () => {
    const entry = await fetchText('customText', 'someUserID', 'someDir', 'someTitle');
    console.log('entry', entry);
}

export const testDelete = async () => {
    const outMsg = await deleteEntry('customInfo','someUserID','someDir','someTitle');
    console.log(outMsg);
}