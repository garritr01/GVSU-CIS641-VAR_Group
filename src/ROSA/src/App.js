import React, { useState, useEffect, version 
} from 'react';

import { LogIn, SignUp } from './LogIn';
import { EditMiscObject } from './DirectEdit';
import { MainMenu } from './MainMenu';
import { Functions } from './Components';
import { Journal } from './Journal';
import { CustomInput, NewCustomInput } from './CustomInput';
import { NewCustomUI } from './CustomUI';
import { ScheduleView } from './Calendar';
import { FileExplorer } from './FileExplorer';
import { logCheck } from './oddsAndEnds';

import './default.css';

// Calls interfaces and handles any passing of variables between them
const App = () => {

  // Variables for passing between functions
  const [open, setOpen] = useState('main');
  // array of strings for logging
  // b (basic) - use generally
  // p (params) - use for parameter logging
  // s (state) - use for state logging (excluding obj)
  // o (object state) - use to specifically log obj state
  // d (database) - use to log database output (errors will always log)
  // e (exceptions) - use to log exceptional cases
  // v (verbose) - add to any character for verbose mode
  const logLevel = ['ev','s']; //['d','e','b','o','p','s'];
  // Remains for old printout conditions
  // const printoutLevel = 1;
  const [userID, setUserID] = useState('garritr01');
  const [currentObj, setCurrentObj] = 
    useState({ 
      userID: userID,
      table: '',
      dir: '',
      filename: '',
      dateTime: { date: '', time: '' },
      options: null,
      payload: null
    });

  /*
  const [table, setTable] = useState(null);
  const [dir, setDir] = useState(null);
  const [title, setTitle] = useState(null);
  const [version, setVersion] = useState(null);
  const [resolutionInfo, setResolutionInfo] = useState(null);
  const [currentMode, setCurrentMode] = useState('record');
  */
  /*
  useEffect(() => {
    if (open === 'login') {
      setCurrentMode('login');
    } else if (open === 'customInfo') {
      setCurrentMode('record');
    } else if (open === 'customEdit') {
      setCurrentMode('edit');
    } else if (open === 'customClockIn') {
      setCurrentMode('clock in');
    } else if (open === 'customClockOut') {
      setCurrentMode('clock out');
    } else if (open === 'schedule event') {
      setCurrentMode('schedule');
    }
  }, [open])
  */

  // Handles selection of the interface to be opened
  const handleOpen = (toOpen, emptyCurrentObj = true) => {
    if (logCheck(logLevel,['b']) > 0) {console.log(`closing '${open}' and opening '${toOpen}'`)}
    
    // Empty object unless otherwise chosen
    if (emptyCurrentObj) {
      setCurrentObj({
        userID: userID,
        table: toOpen,
        dir: '',
        filename: '',
        dateTime: { date: '', time: '' },
        options: null,
        payload: null
      });
    }

    setOpen(toOpen);
    // Only want to have a dir and title selected when opening a function
    // from another function (not main)
    /*if (toOpen === 'main') {
      setDir(null);
      setTitle(null);
      setVersion(null);
      setCurrentObj({
        userID: 'garritr01',
        table: '',
        dir: '',
        filename: '',
        dateTime: { date: '', time: '' },
        options: null,
        payload: null
      });
    }*/
  }

  /*
  // Sets dir and title from one function to be passed into another
  const handleReturnedDirTitleAndVersion = (dirToOpen, titleToOpen, versionToOpen, tableToOpen) => {
    console.log('at dir/title/version:', dirToOpen, '/', titleToOpen, '/', versionToOpen, ' in ', tableToOpen);
    setTable(tableToOpen);
    setDir(dirToOpen);
    setTitle(titleToOpen);
    setVersion(versionToOpen);
    setCurrentObj(prevState => ({
      ...prevState,
      table: tableToOpen,
      dir: dirToOpen,
      filename: titleToOpen,
      dateTime: versionToOpen
    }));
  }

  const handleResolutionInfo = (info) => {
    console.log('scheduled for', info);
    setResolutionInfo(info);
  }
  */
  
  // Handles the opening of interfaces and the variables they need to operate
  return (
    <div>
      {/** Display menu atop screen */}
      {open !== 'logIn' && open !== 'signUp' && <Functions 
        printLevel={logLevel}
        selectFn={handleOpen}
        setUserID={setUserID}/>}
      {/** Login interface */}
      {open === 'logIn' && <LogIn
        printLevel={logLevel}
        selectFn={handleOpen}
        setUserID={setUserID}/>}
      {/** Sign Up interface */}
      {open === 'signUp' && <SignUp
        printLevel={logLevel}
        selectFn={handleOpen} />}
      {/** Main Menu interface*/}
      {open === 'main' && <MainMenu
        printLevel={logLevel}/>}
      {/** File Explorer interface */}
      {open === 'fileExplorer' && <FileExplorer
        printLevel={logLevel}
        selectFn={handleOpen}
        preselectedObj={currentObj}
        setCurrentObj={setCurrentObj} />}
      {/** Journal interface */}
      {open === 'journal' && <Journal
        printLevel={logLevel}
        preselectedObj={currentObj} />}
      {/** Custom UI creation interface */}
      {open === 'customUI' && <NewCustomUI
        printLevel={logLevel}
        preselectedObj={currentObj} />}
      {/** Custom recording interface */}
      {open === 'record' && <NewCustomInput
        printLevel={logLevel}
        preselectedObj={currentObj} />}

      {/** Old functions below

      {open === 'journals' && <Journal
        printLevel={printoutLevel}
        selectFn={handleOpen}
        preselectedDir={dir}
        preselectedTitle={title}
        preselectedVersion={version} />}
      {open === 'customInfo' && <CustomInput
        printLevel={printoutLevel}
        selectFn={handleOpen}
        preselectedDir={dir}
        preselectedTitle={title}
        preselectedVersion={version}
        resolutionInfo={resolutionInfo}
        selectDirTitleAndVersion={handleReturnedDirTitleAndVersion}
        mode={'record'} />}
      {open === 'customClockIn' && <CustomInput
        printLevel={printoutLevel}
        selectFn={handleOpen}
        preselectedDir={dir}
        preselectedTitle={title}
        preselectedVersion={version}
        resolutionInfo={null}
        selectDirTitleAndVersion={handleReturnedDirTitleAndVersion}
        mode={'clock in'} />}
      {open === 'customClockOut' && <CustomInput
        printLevel={printoutLevel}
        selectFn={handleOpen}
        preselectedDir={dir}
        preselectedTitle={title}
        preselectedVersion={version}
        resolutionInfo={null}
        selectDirTitleAndVersion={handleReturnedDirTitleAndVersion}
        mode={'clock out'} />}
      {open === 'customEdit' && <CustomInput
        printLevel={printoutLevel}
        selectFn={handleOpen}
        preselectedDir={dir}
        preselectedTitle={title}
        preselectedVersion={version}
        resolutionInfo={resolutionInfo}
        selectDirTitleAndVersion={handleReturnedDirTitleAndVersion}
        mode={'edit'} />}
      {open === 'resolveSchedule' && <CustomInput
        printLevel={printoutLevel}
        selectFn={handleOpen}
        preselectedDir={dir}
        preselectedTitle={title}
        preselectedVersion={version}
        resolutionInfo={resolutionInfo}
        selectDirTitleAndVersion={handleReturnedDirTitleAndVersion}
        mode={'resolve'} />}
      {open === 'resolveScheduleMain' && <CustomInput
        printLevel={printoutLevel}
        selectFn={handleOpen}
        preselectedDir={dir}
        preselectedTitle={title}
        preselectedVersion={version}
        resolutionInfo={resolutionInfo}
        selectDirTitleAndVersion={handleReturnedDirTitleAndVersion}
        mode={'resolveMain'} />}
      {open === 'customUI' && <CustomUI
        printLevel={printoutLevel}
        selectFn={handleOpen}
        preselectedDir={dir}
        preselectedTitle={title}
        preselectedVersion={version}
        selectDirTitleAndVersion={handleReturnedDirTitleAndVersion}
        mode={currentMode} />}
      {open === 'scheduledEvents' && <CustomUI
        printLevel={printoutLevel}
        selectFn={handleOpen}
        preselectedDir={dir}
        preselectedTitle={title}
        preselectedVersion={version}
        selectDirTitleAndVersion={handleReturnedDirTitleAndVersion}
        mode={'schedule'} />}
      {open === 'quick note' && <CustomUI
        printLevel={printoutLevel}
        selectFn={handleOpen}
        preselectedDir={dir}
        preselectedTitle={title}
        preselectedVersion={version}
        selectDirTitleAndVersion={handleReturnedDirTitleAndVersion}
        mode={'note'} />}
      {open === 'set goals' && <CustomUI
        printLevel={printoutLevel}
        selectFn={handleOpen}
        preselectedDir={dir}
        preselectedTitle={title}
        preselectedVersion={version}
        selectDirTitleAndVersion={handleReturnedDirTitleAndVersion}
        mode={'goals'} />}
      {open === 'file manager' && <FileExplorer
        printLevel={printoutLevel}
        selectFn={handleOpen}
        selectDirTitleAndVersion={handleReturnedDirTitleAndVersion} />}
      {open === 'schedule view' && <ScheduleView
        printLevel={printoutLevel}
        selectFn={handleOpen}
        selectResolutionInfo={handleResolutionInfo}
        selectDirTitleAndVersion={handleReturnedDirTitleAndVersion}
        mode={'calendar'} />}
      {open === 'edit any' && <EditMiscObject
        printLevel={printoutLevel}
        selectFn={handleOpen}
        preselectedTable={table}
        preselectedDir={dir}
        preselectedTitle={title}
        preselectedVersion={version} />}
      */}
    </div>
  );
}

export default App;