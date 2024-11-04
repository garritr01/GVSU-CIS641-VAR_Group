import React, { useState, useEffect, useRef 
} from 'react';

import { getDateString, getTimeString, chooseMostRecent, convertUTCstringsToLocal 
} from './oddsAndEnds';

import { fetchDirsAndFiles, deleteEntry, fetchText, saveText 
} from './generalFetch';

/** Renders journal and handles saving  */
export const Journal = ({ printLevel, selectFn, preselectedDir, preselectedTitle, preselectedVersion }) => {

    const selectedDir = preselectedDir || '';
    const selectedTitle = preselectedTitle || '';
    const selectedVersion = preselectedVersion || '';

    const [dir, setDir] = useState(selectedDir);
    const [title, setTitle] = useState(selectedTitle);
    const [version, setVersion] = useState(selectedVersion);
    const [entry, setEntry] = useState('');
    const [listOfFiles, setListOfFiles] = useState([]);
    const [listOfDirs, setListOfDirs] = useState([]);

    useEffect(() => {
        if (preselectedTitle !== null) {
            loadContent();
        };
        callFetchDirsAndFiles();
    }, []);

    useEffect(() => {
        if (listOfDirs.includes(dir) && listOfFiles.map(i => i.title).includes(title)) {
            setVersion(chooseMostRecent(listOfFiles, dir, title));
        }
    }, [title, dir])

    useEffect(() => {
        if (version) {
            loadContent();
        }
    }, [version])

    const uponInputChange = (inputValue, setInputValue) => {
        setInputValue(inputValue);
    };

    const callFetchDirsAndFiles = async () => {
        try {
            const dirsAndFiles = await fetchDirsAndFiles('journals', 'Garrit');
            setListOfFiles(dirsAndFiles.files);
            setListOfDirs(dirsAndFiles.directories);
        } catch (err) {
            console.error('Error fetching dirs and files:', err);
        }
    };

    const loadContent = async () => {
        try {
            const content = await fetchText('journals', version, 'Garrit', dir, title); // Fetch directories and files from the Flask server
            setEntry(content);
        } catch (err) {
            console.error('Error fetching directories and files:', err);
        };
        console.log()
    };

    const closeJournal = async (save) => {
        if (save) {
            try {
                const response = await saveText('journals', entry, { date: getDateString(), time: getTimeString() }, 'Garrit', dir, title);
                console.log(response);
            } catch (err) {
                console.error('Error occurred while saving entry:', err);
            }
            if (selectedDir && selectedTitle &&
                (selectedTitle !== title || selectedDir !== dir)) {
                // The version argument here needs to be updated to correctly discover what the old version was
                try {
                    const response = await deleteEntry('journals', version, 'Garrit', selectedDir, selectedTitle);
                    console.log(response);
                }
                catch (err) {
                    console.error('Error removing entry:', err);
                }
            }
        }
        selectFn('main');
    };

    return (
        <div>
            <h2>Journal Interface</h2>
            <div>
                <input
                    name='directory box'
                    value={dir}
                    list='dirnames'
                    onChange={(e) => uponInputChange(e.target.value, setDir)}
                    style={({ width: '400px', height: '20px' })}
                />
                <datalist id='dirnames'>
                    {listOfDirs.length > 0 &&
                        listOfDirs.map((name, index) => (
                            <option key={index} value={name} />
                        ))}
                </datalist>
                <input
                    name='title box'
                    value={title}
                    list='filenames'
                    onChange={(e) => uponInputChange(e.target.value, setTitle)}
                    style={({ width: '400px', height: '20px' })}
                />
                <datalist id='filenames'>
                    {listOfFiles.length > 0 &&
                        listOfFiles.filter((name) => name.directory === dir)
                            .filter((obj, index, self) =>
                                index === self.findIndex((o) => o.title === obj.title)
                            ).map((name, index) => <option key={index} value={name.title} />)}
                </datalist>
                <select
                    value={JSON.stringify(version)}
                    onChange={(e) => setVersion(JSON.parse(e.target.value))}
                >
                    {listOfFiles.map((option, index) => (
                        option.directory === dir && option.title == title
                        && <option key={index} value={JSON.stringify(option.dateTime)}>
                            {convertUTCstringsToLocal(option.dateTime).date + '-' + convertUTCstringsToLocal(option.dateTime).time}
                        </option>
                    ))}
                </select>
            </div>
            <textarea
                name="journal box"
                value={entry}
                onChange={(e) => uponInputChange(e.target.value, setEntry)}
                style={{ width: '400px', height: '400px' }}
            />
            <button onClick={() => closeJournal(true)}>Save and Close</button>
            <button onClick={() => closeJournal(false)}>Cancel</button>
        </div>
    );
}