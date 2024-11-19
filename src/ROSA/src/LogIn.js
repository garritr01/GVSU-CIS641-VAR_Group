import React, { useState, useEffect, useRef 
} from 'react';

import { createNewUser, checkLoginInfo 
} from './generalFetch';

import { logCheck } from './oddsAndEnds';

import { BASE_URL } from './config';

/** Renders the login UI */
export const LogIn = ({ printLevel, selectFn, setUserID }) => {

    //Create empty userName, password, and popup variables
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisibility, setPasswordVisibilty] = useState(false);

    /** Update input value upon change given variable and setVariable */
    const uponInputChange = (inputValue, setInputValue) => {
        setInputValue(inputValue);
    };

    /** Toggle password visibility between true and false */
    const togglePasswordVisibility = () => {
        if (logCheck(printLevel,['s']) === 2) {console.log(`Password visibility toggled to '${!passwordVisibility}'`)}
        setPasswordVisibilty(!passwordVisibility);
    }

    /** Add <p> child to "info" div
     * @param {string} issue - text content within <p>
     * @param {string} pClass - class assigned to <p>
     */
    const updateIssueLog = (issue, pClass = '') => {
        const popupDiv = document.getElementById('info');
        if (popupDiv) {
            const p = document.createElement('p');
            if (logCheck(printLevel,['e']) === 2) {console.log(`Adding info to log with class: '${pClass}'\n info: ${issue}`)}
            if (pClass) {
                p.className = pClass;
            }
            p.textContent = issue;
            popupDiv.appendChild(p);
        } else {
            console.error('popup div (id="info") not found.');
        }
    }

    /**
     * Prompts a general fetch request to the database to check the login information.
     * Clears the popup information and attempts to verify the user's credentials.
     * If successful, it updates the current user ID and navigates to the main menu.
     * In case of failure, it reports the error and throws an error based on the response status.
     *
     * @async
     * @function checkCombo
     * @throws {Error} Throws an error if the login information is incorrect or missing.
     */
    const checkCombo = async () => {

        // Clear popup info upon attempt to create user
        const popupDiv = document.getElementById('info');
        if (popupDiv) {
            popupDiv.innerHTML = '';
        } else {
            console.error('popup div (id="info") not found.');
        }

        //Attempt login info check and report any failures
        try {
            //Make sure userName and password exist
            if (userName && password) {
                //Call checkLoginInfo with inputs userName and password
                const response = await checkLoginInfo(userName, password);
                //Output errors by specific code or open main menu and update userID
                if (response.truth) {
                    if (logCheck(printLevel,['b','d']) > 0) {console.log(`'${userName}' successfully logged in.`)}
                    setUserID(userName);
                    selectFn('main');
                } else if (response.status === 403) {
                    updateIssueLog('Incorrect password provided!','errorP');
                    throw new Error('Incorrect password.');
                } else {
                    updateIssueLog('Error most likely caused by incorrect username!','errorP');
                    if (logCheck(printLevel,['d','e']) === 2) {
                        throw new Error(`Unexpected ${response.status} error occurred:\n ${response.msg}`)
                    } else {throw new Error('Probably incorrect username.')}
                }
            } else {
                if (!userName && password) {
                    updateIssueLog('Enter a username','errorP');
                    throw new Error('No username input');
                } else if (!password && userName) {
                    updateIssueLog('Enter a password','errorP');
                    throw new Error('No password input');
                } else {
                    updateIssueLog('Enter a username and password','errorP');
                    throw new Error('No username or password input');
                }
            }
        } catch (err) {
            console.error('Error loggin in: ', err);
        }
    }

    return (
        <div className="loginContainer">
            <h2>Welcome to ROSA</h2>
            <div className="flexDivTable">
                {/** Username row */}
                <div className="flexDivRows">
                    <p className="flexDivColumns">Username:</p>
                    <input
                        name="user"
                        className="flexDivColumns"
                        onChange={(e) => uponInputChange(e.target.value, setUserName)}
                    />
                </div>
                {/** Password row */}
                <div className="flexDivRows">
                    <p className="flexDivColumns" style={({ height: '20px' })}>Password:</p>
                    <div className="flexDivColumns">
                        <input
                            type={ passwordVisibility ? "text" : "password" }
                            name="password"
                            onChange={(e) => uponInputChange(e.target.value, setPassword)}
                        />
                        <img
                            src={passwordVisibility ? `${BASE_URL}passwordVizIcon.png` : `${BASE_URL}passwordInvizIcon.png`}
                            onClick={togglePasswordVisibility}
                            alt="Viz Icon"
                            style={({ height: '20px', width: 'auto', verticalAlign: 'middle' })}
                        />
                    </div>
                </div>
            </div>
            <div className="flexDivRows">
                <button onClick={() => checkCombo()}>Enter</button>
                <button onClick={() => selectFn('signup')}>Sign Up</button>
            </div>
            <div id="info" className="bulletList"></div>
        </div>
    );
}

/** Renders the sign up UI */
export const SignUp = ({ printLevel, selectFn }) => {

    //Create empty userName, password, password2, and popup variables
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState(''); // New state for re-entering password

    /** Update input value upon change given variable and setVariable */
    const uponInputChange = (inputValue, setInputValue) => {
        setInputValue(inputValue);
    }

    /** Add <p> child to "info" div
     * @param {string} issue - text content within <p>
     * @param {string} pClass - class assigned to <p>
     */
    const updateIssueLog = (issue, pClass = '') => {
        const popupDiv = document.getElementById('info');
        if (popupDiv) {
            const p = document.createElement('p');
            if (logCheck(printLevel,['e']) === 2) {console.log(`Adding info to log with class: '${pClass}'\n info: ${issue}`)}
            if (pClass) {
                p.className = pClass;
            }
            p.textContent = issue;
            popupDiv.appendChild(p);
        } else {
            console.error('popup div (id="info") not found.');
        }
    }

    /**
     * Performs preliminary checks to validate the username and password input.
     * The checks include ensuring the username is at least 6 characters long, 
     * the password is at least 12 characters long, contains both uppercase and lowercase letters, 
     * includes a number and a symbol, and that both passwords match.
     * Logs error messages if any of the checks fail.
     *
     * @function checkInputs
     * @returns {boolean} - Returns true if all input constraints are met, otherwise false.
     */
    const checkInputs = () => {
        let constraintsMet = true;

        // Check lengths and password contains caps, lowercase, numbers, and symbols respectively
        if (userName.length < 6) {
            constraintsMet = false;
            if (logCheck(printLevel, ['e']) === 2) {console.log(`username: '${userName}' shorter than 6 characters.`)} 
            updateIssueLog('Username must be at least 6 characters!','errorP');
        } if (password.length < 12) {
            constraintsMet = false;
            if (logCheck(printLevel, ['e']) === 2) { console.log(`password: '${password}' shorter than 12 characters.`) } 
            updateIssueLog('Password must be at least 12 characters!','errorP');
        } if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
            constraintsMet = false;
            if (logCheck(printLevel, ['e']) === 2) { console.log(`password: '${password}' must contain at least 1 uppercase and lowercase character.\n Uppercase: '${/[A-Z]/.test(password)}'\n Lowercase: '${/[a-z]/.test(password)}'`) } 
            updateIssueLog('Password must contain at least 1 lowercase and 1 uppercase character!','errorP');
        } if (!/[0-9]/.test(password)) {
            constraintsMet = false;
            if (logCheck(printLevel, ['e']) === 2) { console.log(`password: '${password}' must contain at least 1 numerical character.`) } 
            updateIssueLog('Password must contain at least 1 numerical character!','errorP');
        } if (!/[^a-zA-Z0-9]/.test(password)) {
            constraintsMet = false;
            if (logCheck(printLevel, ['e']) === 2) { console.log(`password: '${password}' must contain at least 1 symbol.`) } 
            updateIssueLog('Password must contain at least 1 symbol!','errorP');
        }
        // Check if password2 matches password
        if (password2 !== password) {
            constraintsMet = false;
            if (logCheck(printLevel, ['e']) === 2) { console.log(`passwords must match. '${password}' !== '${password2}'`) } 
            updateIssueLog('Passwords do not match!','errorP');
        }

        // Return true if both username and password meet constraints
        if (constraintsMet) {
            if (logCheck(printLevel, ['e']) === 2) { console.log('Sign up info meets constraints.') } 
            return true;
        } else {
            return false;
        }
    }

    /**
    * Prompts a general fetch request to sign the user up with the provided username and password.
    * It performs preliminary input validation using `checkInputs`. If the inputs meet the constraints,
    * it attempts to create a new user via `createNewUser`. Depending on the response, it logs success, errors,
    * or throws appropriate errors for specific issues like a duplicate username or unexpected errors.
    *
    * @async
    * @function createUser
    * @throws {Error} Throws an error if the username and password do not meet constraints or if an error occurs during user creation.
    */
    const createUser = async () => {
        // Clear popup info upon attempt to create user
        const popupDiv = document.getElementById('info');
        if (popupDiv) {
            popupDiv.innerHTML = '';
        } else {
            console.error('popup div (id="info") not found.');
        }

        try {
            // Output issues or success
            if (userName && password && password2) {
                if (checkInputs()) {
                    const response = await createNewUser(userName, password);
                    if (response.truth) {
                        if (logCheck(printLevel, ['d']) === 1) {console.log(`${userName}'s profile created.`)} else if (logCheck(printLevel, ['d']) === 2) {console.log(`${userName}'s profile created.\n response: ${response.status} - ${response.msg}`)}
                        updateIssueLog(`${userName}'s profile created. Return to login.`);
                    } else if (response.status === 403) {
                        updateIssueLog('Username already in use!', 'errorP');
                        throw new Error(`${userName} already in use.`);
                    } else {
                        updateIssueLog(`Unexpected ${response.status} Error occurred.`, 'errorP');
                        if (logCheck(printLevel,['d','e']) === 2) {
                            throw new Error(`Unexpected ${response.status} error`);
                        } else {
                            throw new Error(`Unexpected ${response.status} error:\n ${response.msg}`);
                        }
                    }
                } else {
                    throw new Error('username and password do not meet constraints.');
                }
            } else {
                if (!userName) {
                    updateIssueLog('Enter a username!', 'errorP');
                    throw new Error(`username DNE`);
                } if (!password) {
                    updateIssueLog('Enter a password!', 'errorP');
                    throw new Error(`password DNE`);
                } if (!password2) {
                    updateIssueLog('Re-enter your password!', 'errorP');
                    throw new Error(`password2 DNE`);
                }
            }
        } catch (err) {
            console.error('Error creating user: ', err);
        }
    }

    return (
        <div className="loginContainer">
            {/** main container adds a margin */}
            <h2>Create New Username and Password</h2>
            {/* flexDivTable shows cell format when flexDivRows and 
            flexDivColumns used in that order */}
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
