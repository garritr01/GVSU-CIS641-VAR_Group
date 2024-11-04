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

    //Create empty userName, password, and popup variables
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [popupErr, setPopupErr] = useState('');
    const [popupMsg, setPopupMsg] = useState('');

    //Update input value upon change given variable and setVariable
    const uponInputChange = (inputValue, setInputValue) => {
        setInputValue(inputValue);
    };

    const checkInputs = () => {
        let userNameMeetConstraints = true;
        let passwordMeetConstraints = true;
        let issueLog = '';

        //Add \n if issue log not empty
        const updateIssueLog = (issue) => {
            if (issueLog !== '') {
                issueLog += '\n';
            }
            issueLog += issue;
        }

        //check lengths and password contains caps, lowercase, numbers, and symbols
        if (userName.length < 6) {
            userNameMeetConstraints = false;
            updateIssueLog('Username must be at least 6 characters!');
        } if (password.length < 12) {
            passwordMeetConstraints = false;
            updateIssueLog('Password must be at least 12 characters!');
        } if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
            passwordMeetConstraints = false;
            updateIssueLog('Password must contain at least 1 lowercase and 1 uppercase character!');
        } if (!/[0-9]/.test(password)) {
            passwordMeetConstraints = false;
            updateIssueLog('Password must contain at leat 1 numerical character!');
        } if (!/[^a-zA-Z0-9]/.test(password)) {
            passwordMeetConstraints = false;
            updateIssueLog('Password must contain at least 1 symbol!');
        }
        //Return true if both username and password meet constraints
        if (userNameMeetConstraints && passwordMeetConstraints) {
            return true;
        } else {
            setPopupErr(issueLog);
            return false;
        }
    }

    //Prompt general fetch to sign user up with given userName and password
    const createUser = async () => {
        setPopupErr('');
        setPopupMsg('');
        try {
            //Make sure userName and password exist
            if (userName && password) {
                if (checkInputs()) {
                    const response = await createNewUser(userName, password);
                    if (response.truth) {
                        setPopupMsg(`${userName}'s profile created. Return to login.`);
                    } else if (response.status === 403) {
                        setPopupErr('Username already in use!');
                    } else {
                        setPopupErr(`Unexpected Error occured:\n\n\t ${response.msg}!`);
                    }
                }
            } else {
                if (!userName && password) {
                    setPopupErr('Enter a username!');
                } else if (!password && userName) {
                    setPopupErr('Enter a password!');
                } else {
                    setPopupErr('Enter a username and password!')
                }
            }
        } catch (err) {
            console.error('create user error: ', err);
        }
    }

    return (
        <div className="flexDivColumns">
            {
                popupErr === '' && popupMsg === ''
                    ? <p>Enter Username and Password</p>
                    : popupErr === ''
                        ? <p className="popup">{popupMsg}</p>
                        : <p className="errorPopup">{popupErr}</p>
            }
            <div className="bulletList">
                <p>Username must be at least 6 characters</p>
                <p>Password must be at least 12 characters</p>
                <p>Password must contain at least 1 lowercase, 1 uppercase, 1 numerical, and 1 symbol character</p>
            </div>
            <div className="flexDivRows">
                <p>Username:</p>
                <input
                    value={userName}
                    onChange={(e) => uponInputChange(e.target.value, setUserName)}
                    style={({ width: '400px', height: '20px' })}
                />
            </div>
            <div className="flexDivRows">
                <p>Password:</p>
                <input
                    value={password}
                    onChange={(e) => uponInputChange(e.target.value, setPassword)}
                    style={({ width: '400px', height: '20px' })}
                />
            </div>
            <button onClick={() => createUser()}>Create User</button>
            <button onClick={() => selectFn('login')}>Return to Login</button>
        </div>
    );
}