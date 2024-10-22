# Overview
This file contains the software requirements.

# Functional Requirements
1. Filesystem Requirements   
    1. The system shall provide access to a cloud-based filesystem.
    2. The system shall enable the user to access all of their files through the graphical user interface (GUI).
    3. The system shall recursively search for explicitly entered user text within all file contents and file names in the opened directory.
    4. The system shall direct the user to the proper function to edit files based on the file type.
    5. The system shall display files and directories in cascading dropdown menus based on the overarching directories.
    6. The system shall display file contents upon file click.
    7. The system shall force the user to select a table before displaying any files or directories.
    8. The system shall allow users to delete files.

2. Scheduling Requirements
    1. The system shall allow the user to schedule events in a specific or recurring manner.
    2. The system shall allow users to update and remove events made.
    3. The system shall remind the user of their scheduled event an hour before the scheduled time if desired.
    4. The system shall provide a calendar view to visualize future commitments. 
    5. The system shall convert local time to UTC for storage.
    6. The system shall convert UTC to local time upon display if necessary.

3. Recording Requirements
    1. The system shall allow the user to create a user interface with a specific directory, filename, and date/time.
    2. The system shall allow the user to load previous user interfaces of a specific directory and filename to edit.
    3. The system shall allow the user to add buttons, multiple choice questions, text input boxes and large text input boxes with a specified label to display.
    4. The system shall allow the user to add premade elements like start date/time.
    5. The system shall automatically add an end date/time element.
    6. The system shall save the UI with the user specified directory and filename, and the current date/time.
    7. The system shall allow the user to open a specified directory and filename's user interface for recording.
    8. The system shall suggest directories and filenames based on user text input.
    9. The system shall automatically load the most recently created user interface.
    10. The system shall allow the user to choose a more dated user interface.
    11. The system shall allow the user to press buttons that record as true or false.
    12. The system shall allow the user to select multiple choice options that record as the selected option(s).
    13. The system shall allow the user to input text in text inputs and large text inputs.
    14. The system shall allow the user to add additional input boxes.
    15. The system shall allow the user to remove additional input boxes.
    16. The system shall add or remove associated input boxes when grouped input boxes are added or removed.
    17. The system shall allow the user to save the record using the specified directory, filename, and the end date/time.
    18. The system shall remove the previous version of any files upon save when editing.
    19. The system shall allow users to clock into events.
    20. The system shall allow users to clock out of events.
    21. The system shall load data input in the clock in phase when the user chooses to clock out.
    22. The system shall direct the user to create an interface if none exist for the specified directory and filename.

4. Calendar Requirements
    1. The system shall allow the user to choose the range of dates displayed.
    2. The system shall display all scheduled events
    3. The system shall display past events if the user desires.
    4. The system shall allow the user to filter events displayed by directory or filename.
    5. The system shall allow the user to resolve scheduled events.
    6. The system shall open the recording function when the user clicks resolve if there is an associated user interface.
    7. The system shall allow the user to edit scheduled and past events by opening the file in its associated function upon clicking edit.
    8. The system shall allow the user to remove scheduled and past events upon clicking delete.

5. Quick Note Requirements
    1. The system shall allow the user to save a quick note.
    2. The system shall delete quick notes upon resolution.
    3. The system shall include a title, notes, and an urgency level for quick notes.

6. Main Menu Requirements
    1. The system shall allow the user to open the filesystem, clock in,  record, quick note, calendar, and schedule interfaces.
    2. The system shall display today and tomorrow's calendar.
    3. The system shall display events clocked into.
    4. The system shall allow the user to directly clock out of events clocked into.
    5. The system shall display quick notes.
    6. The system shall allow the user to resolve quick notes.

7. Login Requirements
    1. The system shall allow the user to provide a username and password.
    2. The system shall allow login upon correct combination of username and password.
    3. The system shall allow the user to create an account with a unique username and password.
    4. The system shall inform the user of an incorrect username and password combination.

8. Database Requirements
    1. The system shall provide a cloud-based filesystem.
    2. The system shall require a username, table, directory, filename, date/time, options, and payload properties.
    3. The system shall only allow user to access files associated with the username logged in.
    4. The system shall require a unique combination of username, table, directory, filename, and date/time.
    5. The system shall contain only encrypted files.
    6. The system shall decrypt files upon access.