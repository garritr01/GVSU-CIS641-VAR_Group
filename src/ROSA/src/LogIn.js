import React, { useState, useEffect, useRef 
} from 'react';

import { createNewUser, checkLoginInfo 
} from './generalFetch';

/** Renders the login UI */
export const LogIn = ({ printLevel, selectFn }) => {

    //Create empty userName, password, and popup variables
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [popupErr, setPopupErr] = useState('');

    //Update input value upon change given variable and setVariable
    const uponInputChange = (inputValue, setInputValue) => {
        setInputValue(inputValue);
    };

    //Prompt general fetch to prompt database to check login information
    const checkCombo = async () => {
        //Attempt login info check and report any failures
        try {
            //Make sure userName and password exist
            if (userName && password) {
                //Call checkLoginInfo with inputs userName and password
                const response = await checkLoginInfo(userName, password);
                //Output errors by specific code
                if (response.truth) {
                    selectFn('main');
                } else if (response.status === 403) {
                    setPopupErr('Incorrect password provided!');
                } else {
                    setPopupErr('Error most likely caused by incorrect username!');
                }
            } else {
                if (!userName && password) {
                    setPopupErr('Enter a username');
                } else if (!password && userName) {
                    setPopupErr('Enter a password');
                } else {
                    setPopupErr('Enter a username and password');
                }
            }
        } catch (err) {
            console.error('login error: ', err);
        }
    }

    return (
        <div>
            <h2>Welcome to ROSA</h2>
            {
                popupErr === '' ? <p>Enter Username and Password</p>
                    : <p className="errorPopup">{popupErr}</p>
            }
            <div className="flexDivColumns">
                <div className="flexDivRows">
                    <p>Username:</p>
                    <input
                        value={userName}
                        onChange={(e) => uponInputChange(e.target.value, setUserName)}
                    />
                </div>
                <div className="flexDivRows">
                    <p>Password:</p>
                    <input
                        value={password}
                        onChange={(e) => uponInputChange(e.target.value, setPassword)}
                    />
                </div>
                <button onClick={() => checkCombo()}>Enter</button>
                <button onClick={() => selectFn('signup')}>Sign Up</button>
            </div>
        </div>
    );
}

/** Renders the sign up UI */
export const SignUp = ({ printLevel, selectFn }) => {

    //Create empty userName, password, password2, and popup variables
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState(''); // New state for re-entering password

    //Update input value upon change given variable and setVariable
    const uponInputChange = (inputValue, setInputValue) => {
        setInputValue(inputValue);
    };

    const updateIssueLog = (issue, pClass = '') => {
        const popupDiv = document.getElementById('info');
        const p = document.createElement('p');
        if (pClass) {
            p.className = pClass;
        }
        p.textContent = issue;
        popupDiv.appendChild(p);
    }

    const checkInputs = () => {
        let constraintsMet = true;

        // Check lengths and password contains caps, lowercase, numbers, and symbols respectively
        if (userName.length < 6) {
            constraintsMet = false;
            updateIssueLog('Username must be at least 6 characters!','errorP');
        } 
        if (password.length < 12) {
            constraintsMet = false;
            updateIssueLog('Password must be at least 12 characters!','errorP');
        } 
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
            constraintsMet = false;
            updateIssueLog('Password must contain at least 1 lowercase and 1 uppercase character!','errorP');
        } 
        if (!/[0-9]/.test(password)) {
            constraintsMet = false;
            updateIssueLog('Password must contain at least 1 numerical character!','errorP');
        } 
        if (!/[^a-zA-Z0-9]/.test(password)) {
            constraintsMet = false;
            updateIssueLog('Password must contain at least 1 symbol!','errorP');
        }
        // Check if password2 matches password
        if (password2 !== password) {
            constraintsMet = false;
            updateIssueLog('Passwords do not match!','errorP');
        }

        // Return true if both username and password meet constraints
        if (constraintsMet) {
            return true;
        } else {
            return false;
        }
    }

    //Prompt general fetch to sign user up with given userName and password
    const createUser = async () => {
        const popupDiv = document.getElementById('info');
        popupDiv.innerHTML = '';
        try {
            //Make sure userName and password exist
            if (userName && password && password2) {
                if (checkInputs()) {
                    const response = await createNewUser(userName, password);
                    if (response.truth) {
                        updateIssueLog(`${userName}'s profile created. Return to login.`);
                    } else if (response.status === 403) {
                        updateIssueLog('Username already in use!', 'errorP');
                    } else {
                        updateIssueLog(`Unexpected Error occurred:\n\n\t ${response.msg}!`, 'errorP');
                    }
                }
            } else {
                if (!userName) {
                    updateIssueLog('Enter a username!', 'errorP');
                } if (!password) {
                    updateIssueLog('Enter a password!', 'errorP');
                } if (!password2) {
                    updateIssueLog('Re-enter your password!', 'errorP');
                }
            }
        } catch (err) {
            console.error('create user error: ', err);
        }
    }

    return (
        <div className="mainContainer">
            <h2>Create New Username and Password</h2>
            <div className="flexDivTable">
                <div className="flexDivRows">
                    <p className="flexDivColumns">Username:</p>
                    <input
                        className="flexDivColumns"
                        onChange={(e) => uponInputChange(e.target.value, setUserName)}
                    />
                </div>
                <div className="flexDivRows">
                    <p className="flexDivColumns">Password:</p>
                    <input
                        className="flexDivColumns"
                        onChange={(e) => uponInputChange(e.target.value, setPassword)}
                    />
                </div>
                <div className="flexDivRows">
                    <p className="flexDivColumns">Re-enter Password:</p>
                    <input
                        className="flexDivColumns"
                        onChange={(e) => uponInputChange(e.target.value, setPassword2)}
                    />
                </div>
            </div>
            <div className="flexDivColumns">
                {/* Removes current children for updated information when "Create User" is run */}
                <div id='info' className="bulletList" style={({ paddingLeft: '0px' })}>
                    <p>Username must be at least 6 characters</p>
                    <p>Password must contain at least...</p>
                    <div className="bulletList">
                        <p>12 characters</p>
                        <p>1 lowercase character</p>
                        <p>1 uppercase character</p>
                        <p>1 symbol</p>
                        <p>1 number</p>
                    </div>
                </div>
                <button onClick={() => createUser()}>Create User</button>
                <button onClick={() => selectFn('login')}>Return to Login</button>
            </div>
        </div>
    );
}
