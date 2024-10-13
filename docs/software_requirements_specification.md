# Overview
This file contains the software requirements prototype. The following requirements, plus those we choose to add in the near future will constitue the basis of our system.
# Functional Requirements
1. Filesytstem Requirements   
    1. The system shall provide a cloud-based filesystem.
    2. The filesystem shall enable the user to access all their files through the graphical user interface (GUI).
    3. The filesystem shall recursively search for explicitly entered user text within in all file contents and file names in the opened directory.
    4. The filesystem shall direct the user to the proper function to edit files based on the file type.

2. Scheduling Requirements
    1. The system shall allow user to schedule events in a specific or recurring manner.
    2. The system shall allow users to update and remove events made.
    3. The system shall remind the user of their scheduled event an hour before the scheduled time if desired.
    4. The system shall provide a calendar view to visualize future commitments. 

3. Data Recording Requirements
    1. The system shall allow users to analyze their recorded data and compare time usage based on properties they define.
    2. The system shall allow the user to customize the properties they wish to record for each event.


# Non-functional Requirements
1. Security Requirements
    1. The system shall only allow users to access files stored in the database associated with their username.
    2. The system shall require the user to set a password upon first login.
    3. The system shall only accept users with the correct username and password combination.
2. Usability Requirements
    1. The system shall have an interface that can be accessed with the help of web browsers on desktop and mobile devices.
    2. The system shall be operational for at least 2 users concurrently, with the ability to scale as needed.
    3. The system shall be available 99.9% of the time to ensure reliability for users.
    4. The system shall update the database each time a file is saved, so the user can simply reload the website if issues arise.
    5. The system should guarantee that event reminders are delivered within 10 seconds from the time set for notification.
