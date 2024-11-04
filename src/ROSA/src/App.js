import React, { useState, useEffect, version 
} from 'react';

import { LogIn, SignUp } from './LogIn';
import { EditMiscObject } from './DirectEdit';
import { MainMenu } from './MainMenu';
import { Journal } from './Journal';
import { CustomInput } from './CustomInput';
import { CustomUI } from './CustomUI';
import { ScheduleView } from './Calendar';
import { FileExplorer } from './FileExplorer';

import { testSaveTime, testCallTime, testGetFiles, testGetDirsAndFiles, 
  testSaveObject, testGetObject, testSaveText, testGetText, testDelete 
} from './dbChangeTest'

import './default.css';

/** Notes for VAR group 
 * Look up useEffect quickly, necessary to understand all of these functions
 * I know I didn't do a great job of redocumenting, but this should be a reference point so just ask if you want to know where some feature is and how it works
 * por.tia/src/interfaces.js contains the bulk of the code - this is probably the worst documented and least reusable, but most helpful reference to look at for our project
 * por.tia/src/oddsAndEnds.js contains some reusable small functions for more space efficient code (well documented)
 * por.tia/src/generalFetch.js handles all the API business - reusable and well documented
 * por.tia/src/manualEdit.js might come in handy for me to quickly and manually change things in the database. You guys don't need to worry about this
 * flask/src/flaskAndSQL.py is is the other side of the API and handles database interactions - reusable and well documented
*/

// Calls interfaces and handles any passing of variables between them
const App = () => {

  // Variables for passing between functions
  const [open, setOpen] = useState('login');
  // increase printoutLevel for more detailed printouts to use for debugging and tracing
  const [printoutLevel, setPrintoutLevel] = useState(10);
  const [table, setTable] = useState(null);
  const [dir, setDir] = useState(null);
  const [title, setTitle] = useState(null);
  const [version, setVersion] = useState(null);
  const [resolutionInfo, setResolutionInfo] = useState(null);
  const [currentMode, setCurrentMode] = useState('record');

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

  // Handles selection of the interface to be opened (default is main menu)
  const handleOpen = (toOpen) => {
    console.log('Closing', open, '\nOpening', toOpen);
    setOpen(toOpen);
    // Only want to have a dir and title selected when opening a function
    // from another function (not main)
    if (toOpen === 'main') {
      setDir(null);
      setTitle(null);
      setVersion(null);
    }
  }

  // Sets dir and title from one function to be passed into another
  const handleReturnedDirTitleAndVersion = (dirToOpen, titleToOpen, versionToOpen, tableToOpen) => {
    console.log('at dir/title/version:', dirToOpen, '/', titleToOpen, '/', versionToOpen, ' in ', tableToOpen);
    setTable(tableToOpen);
    setDir(dirToOpen);
    setTitle(titleToOpen);
    setVersion(versionToOpen);
  }

  const handleResolutionInfo = (info) => {
    console.log('scheduled for', info);
    setResolutionInfo(info);
  }

  // Handles the opening of interfaces and the variables they need to operate
  return (
    <div>
      {open === 'login' && <LogIn
        printLevel={printoutLevel}
        selectFn={handleOpen}/>}
      {open === 'signup' && <SignUp
        printLevel={printoutLevel}
        selectFn={handleOpen} />}
      {open === 'main' && <MainMenu
        printLevel={printoutLevel}
        selectFn={handleOpen}
        selectResolutionInfo={handleResolutionInfo}
        selectDirTitleAndVersion={handleReturnedDirTitleAndVersion}/>}
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
    </div>
  );
}

export default App;