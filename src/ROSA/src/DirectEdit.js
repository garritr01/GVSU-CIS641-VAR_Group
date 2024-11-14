import React, { useState, useEffect, useRef 
} from 'react';

import { fetchObject, saveObject, recordDateTime,
} from './generalFetch';

/** Following two functions used for direct editing without interface assistance (not designed to really be part of the app) */
export const EditMiscObject = ({ printLevel, selectFn, preselectedTable, preselectedDir, preselectedTitle, preselectedVersion }) => {
    const [object, setObject] = useState([]);

    useEffect(() => {
        if ('date' in preselectedVersion) {
            fetchFile();
        } else {
            setObject(preselectedVersion);
        }
    }, []);

    const fetchFile = async () => {
        try {
            const objectIn = await fetchObject(preselectedTable, preselectedVersion, 'Garrit', preselectedDir, preselectedTitle);
            setObject(objectIn);
        } catch (err) {
            console.error(`Error fetching ${preselectedTable}, ${preselectedDir}, ${preselectedTitle}, ${preselectedVersion.date}-${preselectedVersion.time}:`, err);
        }
    };

    const saveFile = () => {
        try {
            let response;
            if ('date' in preselectedVersion) {
                response = saveObject(preselectedTable, object, preselectedVersion, 'Garrit', preselectedDir, preselectedTitle);
            } else {
                response = recordDateTime(preselectedTable, object, 'Garrit', preselectedDir, preselectedTitle);
            }
            console.log(response);
        } catch (err) {
            console.error(`Error saving ${preselectedTable}, ${preselectedDir}, ${preselectedTitle}, ${preselectedVersion.date}-${preselectedVersion.time}:`, err);
        }
    };

    // Define a callback function to update the outer object
    const handleObjectChange = (updatedObject) => {
        setObject(updatedObject);
    };

    return (
        <div>
            <div style={{ display: 'flex' }}>
                <p>{preselectedTable}: {preselectedDir}/{preselectedTitle}/{preselectedVersion.date}-{preselectedVersion.time}</p>
                <button onClick={() => saveFile()}>Save</button>
                <button onClick={() => fetchFile()}>Cancel</button>
            </div>
            <EditValues originalObject={object} onObjectChange={handleObjectChange} />
        </div>
    );
}

export const EditValues = ({ printLevel, originalObject, onObjectChange }) => {
    // Function to handle input changes and update the state

    const handleInputChange = (key, index, value) => {
        const updatedObject = !Array.isArray(originalObject)
            ? { ...originalObject } : [...originalObject];

        if (index === 'NA') {
            updatedObject[key] = value;
        } else {
            updatedObject[key][index] = value;
        }

        // Call the callback function to update the outer object
        onObjectChange(updatedObject);
    };

    const handleTF = (key, index, value) => {
        const updatedObject = !Array.isArray(originalObject)
            ? { ...originalObject } : [...originalObject];

        if (index === 'NA') {
            updatedObject[key] = value;
        } else {
            updatedObject[key][index] = value;
        }

        onObjectChange(updatedObject)
    }

    return (
        <div>
            {!Array.isArray(originalObject)
                ? Object.keys(originalObject).map(key => (
                    typeof originalObject[key] === 'string' ? (
                        <div key={key} style={{ display: 'flex' }}>
                            <p>{key}:</p>
                            <input
                                value={originalObject[key]}
                                onChange={e => handleInputChange(key, 'NA', e.target.value)}
                            />
                        </div>
                    ) : typeof originalObject[key] === 'boolean' ? (
                        <div key={key} style={{ display: 'flex' }}>
                            <p>{key}:</p>
                            <button
                                onClick={() => handleTF(key, 'NA', true)}
                                style={{ color: originalObject[key] ? 'gray' : 'black' }}
                            >
                                True
                            </button>
                            <button
                                onClick={() => handleTF(key, 'NA', false)}
                                style={{ color: !originalObject[key] ? 'gray' : 'black' }}
                            >
                                False
                            </button>
                        </div>
                    ) : (
                        <div key={key} style={{ display: 'flex' }}>
                            <button onClick={() => {
                                const { key, ...updatedObject } = originalObject;
                                onObjectChange(updatedObject);
                            }}>
                                -
                            </button>
                            <p>{key}:</p>
                            {originalObject[key].map((element, index) => (
                                element !== '' &&
                                <input
                                    key={key + index}
                                    value={element}
                                    onChange={e => handleInputChange(key, index, e.target.value)}
                                />
                            ))}
                        </div>
                    )
                ))
                : originalObject.map((element, index) => (
                    typeof originalObject[index] === 'string' ? (
                        <div key={index} style={{ display: 'flex' }}>
                            <p>{index}:</p>
                            <input
                                value={originalObject[index]}
                                onChange={e => handleInputChange(index, 'NA', e.target.value)}
                            />
                        </div>
                    ) : typeof originalObject[index] === 'boolean' ? (
                        <div key={index} style={{ display: 'flex' }}>
                            <p>{index}:</p>
                            <button
                                onClick={() => handleTF(index, true)}
                                style={{ color: originalObject[index] ? 'gray' : 'black' }}
                            >
                                True
                            </button>
                            <button
                                onClick={() => handleTF(index, false)}
                                style={{ color: !originalObject[index] ? 'gray' : 'black' }}
                            >
                                False
                            </button>
                        </div>
                    ) : element !== '' && (
                        <div key={index} style={{ display: 'flex' }}>
                            <button onClick={() => {
                                const updatedObject = originalObject.filter((object, index2) => index !== index2);
                                onObjectChange(updatedObject);
                            }}>
                                -
                            </button>
                            {Object.keys(originalObject[index]).map((key) => (
                                (typeof originalObject[index][key] !== 'boolean'
                                    ? <div key={index + key}>
                                        <p>{key}:</p>
                                        <input
                                            value={originalObject[index][key]}
                                            onChange={e => handleInputChange(index, key, e.target.value)}
                                        />
                                    </div>
                                    : <div key={key} style={{ display: 'flex' }}>
                                        <p>{key}:</p>
                                        <button
                                            onClick={() => handleTF(index, key, true)}
                                            style={{ color: originalObject[index][key] ? 'gray' : 'black' }}
                                        >
                                            True
                                        </button>
                                        <button
                                            onClick={() => handleTF(index, key, false)}
                                            style={{ color: !originalObject[index][key] ? 'gray' : 'black' }}
                                        >
                                            False
                                        </button>
                                    </div>
                                )
                            ))}
                        </div>
                    )
                ))
            }
        </div>
    );
}