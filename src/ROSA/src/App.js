import React, { useState, useEffect, version 
} from 'react';

import { LogIn, SignUp } from './LogIn';
import { MainMenu } from './MainMenu';
import { Functions } from './Components';
import { Journal } from './Journal';
import { CustomInput } from './CustomInput';
import { CustomUI } from './CustomUI';
import { Calendar } from './Calendar';
import { FileExplorer } from './FileExplorer';
import { QuickNotes } from './QuickNotes';
import { logCheck } from './oddsAndEnds';

import './default.css';

// Calls interfaces and handles any passing of variables between them
const App = () => {

  // Variables for passing between functions
  const [open, setOpen] = useState('main');
  // Deactivates display of .more class
  const [rookieMode, setRookieMode] = useState(false);
  /* array of strings for logging
  * b (basic) - use generally
  * p (params) - use for parameter logging
  * s (state) - use for state logging (excluding obj)
  * o (object state) - use to specifically log obj state
  * d (database) - use to log database output (errors will always log)
  * e (exceptions) - use to log exceptional cases
  * v (verbose) - add to any character for verbose mode
  */
  const logLevel = ['b','e']; //['d','e','b','o','p','s'];
  // contain logged in userID
  const [userID, setUserID] = useState('garritr01');
  // Contains the object passed between functions
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
  }


  // Handles the opening of interfaces and the variables they need to operate
  return (
    <div>
      {/** Display menu atop screen */}
      {open !== 'logIn' && open !== 'signUp' && <Functions 
        rookie={rookieMode}
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
        rookie={rookieMode}
        setRookie={setRookieMode}
        printLevel={logLevel}
        userID={userID}
        selectFn={handleOpen}
        obj={currentObj}
        setCurrentObj={setCurrentObj} />}
      {/** File Explorer interface */}
      {open === 'fileExplorer' && <FileExplorer
        rookie={rookieMode}
        printLevel={logLevel}
        selectFn={handleOpen}
        preselectedObj={currentObj}
        setCurrentObj={setCurrentObj} />}
      {/** Journal interface */}
      {open === 'journal' && <Journal
        rookie={rookieMode}
        printLevel={logLevel}
        preselectedObj={currentObj} />}
      {/** Quick notes interface */}
      {open === 'quickNote' && <QuickNotes
        rookie={rookieMode}
        printLevel={logLevel}
        userID={userID} />}
      {/** Custom UI creation interface */}
      {open === 'customUI' && <CustomUI
        rookie={rookieMode}
        printLevel={logLevel}
        preselectedObj={currentObj} />}
      {/** Custom recording interface */}
      {open === 'record' && <CustomInput
        rookie={rookieMode}
        printLevel={logLevel}
        preselectedObj={currentObj} />}
      {open === 'calendar' && <Calendar
        rookie={rookieMode}
        printLevel={logLevel}
        selectFn={handleOpen}
        setCurrentObj={setCurrentObj} 
        userID={userID} 
        fullDisplay={true}
        externalDetectDelete={null}/>}

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