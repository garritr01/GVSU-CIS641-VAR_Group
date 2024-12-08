# Overview

This document provides relevant information about the version of ROSA submitted on 12/7/2024 for CIS641's term project. The software requirements section contains all the requirements that ROSA was designed to meet. The change management plan outlines the process for entrenching ROSA as a staple for organizational use and training users in proper usage. The traceability links provide a concise visual representation of the relationships between requirements and software artifacts. The software artifacts section provides links to the software artifacts created during the development of ROSA.

# Software Requirements

The following section contains six categories of functional requirements and five categories of non-functional requirements.

## Functional Requirements

### File Manager Requirements 
|  ID  |           Requirement           |
| :---:| :-----------------------------: |
| FR1  | The system shall be able to access all database entries in tables 'customUI', 'record', and 'journal' upon user click. |
| FR2  | The system shall enable the user to display the contents of all database entries in 'customUI', 'record', and 'journal'. |
| FR3  | The system shall direct the user to the proper function to edit files based on the table where they were located when the user clicks 'Edit'. |
| FR4  | The system shall allow users to navigate to any entry within the selected table through a cascading dropdown menu. |
| FR5  | The system shall display all versions of a table, filename, and directory combination upon click of the respective filename. |
| FR6  | The system shall display the contents of the most recent version of a table, filename, and directory combination upon click of the respective filename. |
| FR7  | The system shall display contents of any older version of a table, filename, and directory combination upon click of the respective version. |
| FR8  | The system shall allow users to delete all entries with a certain table and directory. |
| FR9  | The system shall allow users to delete all entries with a certain table, directory, and filename. |
| FR10  | The system shall allow users to delete an entry with a certain table, directory, filename, and version. |

### Custom UI Requirements
|  ID   |           Requirement           |
| :---: | :-----------------------------: |
|  FR11  | The system shall allow users to schedule events that do not repeat and events that repeat daily, every xth day, weekly, monthly, and annually. |
|  FR12  | The system shall include an effective range for each repeating schedule. |
|  FR13  | The system shall allow users to specify whether a schedule should change based on the user's time zone. |
|  FR14  | The system shall convert schedules to universal standard time upon save if the user specified the schedule should depend on their local time zone. |
|  FR15  | The system shall allow users to add a toggle, multiple choice, input box, and text box with a custom label to their custom user interface. |
|  FR16  | The system shall allow to choose whether a start time should be included in their custom user interface. |
|  FR17  | The system shall include an end time in every custom user interface. |

### Record Requirements 
|  ID   |           Requirement           |
| :---: | :-----------------------------: |
|  FR18  | The system shall allow users to load custom user interfaces. |
|  FR19  | The system shall allow users to load previous records. |
|  FR20  | The system shall allow users to save or overwrite records. |
|  FR21  | The system shall allow users to click buttons and type in input or text boxes. |
|  FR22  | The system shall allow users to clock into events. |

### Calendar Requirements
|  ID   |           Requirement           |
| :---: | :-----------------------------: |
|  FR23  | The system shall allow the user to choose the range of dates displayed.  |
|  FR24  | The system shall allow the user to include or exclude directories. |
|  FR25  | The system shall redirect the user to the proper function to edit custom user interfaces and records upon clicking 'Edit'.  |
|  FR26  | The system shall allow the user to remove custom user interfaces and records. |
|  FR27  | The system shall calculate scheduled events based on the information in the schedule. |
|  FR28  | The system shall display all events at least partially within a date in that date's cell. |
|  FR29  | The system shall redirect the user to record information in the schedule's respective user interface upon clicking 'record'. |
|  FR30  | The system shall check off a schedule upon clicking 'record' and saving the schedule's respective user interface. |
|  FR31  | The system shall check off a schedule upon clicking the checkbox immediately to its left. |
|  FR32  | The system shall allow users to 'uncheck' a schedule upon clicking the checkbox immediately to its left. |
|  FR33  | The system shall delete the record associated with the schedule upon 'unchecking'. |

### Main Menu Requirements
|  ID   |           Requirement           |
| :---: | :-----------------------------: |
|  FR34  | The system shall display a clock that updates every ten seconds. |
|  FR35  | The system shall display any events that have been clocked into. |
|  FR36  | The system shall redirect the user to record information and clock out upon clicking a button in the clock out menu. |
|  FR37  | The system shall display a calendar from yesterday until two days from now. |
|  FR38  | The system shall display all saved quick notes in descending order by priority. |
|  FR39  | The system shall allow the user to remove quick notes. |

### Log In Requirements
|  ID   | Requirement |
| :---: | :--------: |
| FR40  | The system shall set the user ID to the username that was used to log in |

## Non-Functional Requirements

### Performance
|  ID   |   Requirement   |
| :---: | :-------------: |
|  NFR1  | The system shall load individual entries from the database in less than one second. |
|  NFR2  | The system shall not load options and payloads when not required. |
|  NFR3  | The system shall load directory, filename and version necessary to locate database entries at a rate of at least 100 per second. |
|  NFR4  | The system shall default to a 4-day calendar to prevent automatic loading of vast quantities of data. |
|  NFR5  | The system shall filter records by date and directory name to limit load time to only what is required for necessary data. |

### Security
|  ID     |   Requirement   |
| :-----: | :-------------: |
|  NFR6   | The system shall not allow duplicate usernames. |
|  NFR7   | The system shall enforce a minimum password strength policy requiring at least twelve characters, one uppercase letter, one number, and one special character. |
|  NFR8   | The system shall, by default, hide passwords on the login page. |
|  NFR9   | The system shall store usernames with each database entry. |
|  NFR10  | The system shall only allow users to access database entries associated with the username they used to log in. |

### Usability
|  ID    |   Requirement   |
| :----: | :-------------: |
|  NFR11  | The system shall suggest directories and filenames that exist in the database and match the current user input. |
|  NFR12  | The system shall provide an indication of save success or failure. |
|  NFR13  | The system shall provide functions at the top of the screen that can be accessed at any time. |
|  NFR14  | The system shall allow scrolling in displays with the potential to overflow. |
|  NFR15  | The system shall minimize extensive displays and allow more information to be displayed on hover or click. |
|  NFR16  | The system shall visually indicate toggled options by graying out buttons. |
|  NFR17  | The system shall visually indicate clicks on interactive elements. |

### Reliability
|  ID    |   Requirement   |
| :----: | :-------------: |
|  NFR18  | The system shall not allow invalid directories and filenames to be saved. |
|  NFR19  | The system shall not allow dates and times with non-numerical characters to be saved. |
|  NFR20  | The system shall not allow datea and times that do not exist to be saved. |
|  NFR21  | The system shall never be down, except in cases of device issues unrelated to the system. |
|  NFR22  | The system shall maintain expected data types in data that can be saved to the database. |
|  NFR23  | The system shall only allow editing in the proper interfaces. |
|  NFR24  | The system shall create a table if it does not exist before any attempt to save an entry to the database. |

### Maintainability
|  ID    |   Requirement   |
| :----: | :-------------: |
|  NFR25  | The system shall isolate all functions in capitalized files within src/ROSA/src from interacting with external files, except for Components.js and App.js. |
|  NFR26  | The system shall include an average of one line of comments per 20 lines of code across all JavaScript files. |
|  NFR27  | The system shall limit API calls to generalFetch.js. |
|  NFR28  | The system shall contain comments describing behavior and defining parameters and return values of all API calls. |
|  NFR29  | The system shall return a message and HTTP status code from all API endpoints to the function called the function that initiated the API call. |
|  NFR30  | The system shall return an object containing a boolean attribute called 'truth' to any function that called the function that initiated the API call. |


# Change management plan

This section describes the change management plan for ROSA. More specifically, our plan to entrench ROSA for use in organizations including updates, maintenance, and training.

## Updates

For ROSA to ever become pervasive, the design would need to allow more room for cooperation. To become more cooperative, ROSA will need to allow access to others' files and be deployed to the web. Both of these require further consideration beyond the initial scope of ROSA's intended use. ROSA's current feature base is ripe for cooperative use, but the source code would require significant rehaul to achieve this. This rehaul would include changes to the current database method to improve partitioning. In contrast, deployment is achievable in the near future. A database host, front and backend servers, and a domain name still need to be determined, as well as minimal source code adjustments to fit this new structure.

## Maintenance

Maintenance is minimal in ROSA's current form. If a bug is reported, the source code will be updated to resolve the issue and pushed back to GitHub for users to pull once again. Considering the future case of a web-deployed ROSA, the database would need to include backup methods not currently in place. The servers will be outsourced to a company who would hopefully take care of maintaining these servers. Bugs would still pop up on occasion, and fixing these would fall to VAR Group just as it does in ROSA's current form. Further updates are needed to allow for automatic and user bug reporting. Automatic bug reporting would include unaccounted-for error messages being directly sent to VAR Group in some form when they appear. User bug reporting would best be implemented by posting VAR Group's contact information on ROSA's login page, as well as asking the user for further information about their experience when an automatic bug report is sent. The source code would be updated to resolve the reported issue and the new version of ROSA would be redeployed to the web. Implementing these changes would allow for optimized maintenance due to the increased awareness provided to VAR Group developers.

## Training

Training was considered in the current version of ROSA. The 'rookie mode' toggle, while not yet applied across all source code, is a built-in trainer. In a future case of a web-deployed ROSA working hard to become an industry staple, VAR Group representatives would be sent to clients for brief training. The purpose of ROSA is not immediately clear, so these representatives would be hired for their sales capability above their technical expertise. The representatives would serve the purpose of convincing clients of the advantages of customization ROSA brings. 'Rookie mode' will do the rest. A user can easily return to the main menu and toggle 'rookie mode' to get extra information about any functionality they do not understand by simply hovering over the feature in question. It must be acknowledged that 'rookie mode' makes ROSA incredibly cumbersome to use, but its quick toggling mostly mitigates this issue. With a brigade of salesmen and 'rookie mode' taking care of the technical explanation, clients could quickly become masterful users of ROSA.

# Traceability links

This section contains table visualizations of relationships between ROSA's requirements and UML diagrams created in the development process.

## Use Case Diagram Traceability
| Artifact ID | Artifact Name | Requirement ID |
| :-------------: | :----------: | :----------: |
| 1 | Use Case and Activity Diagrams "Calendar" | FR25 |
| 1 | Use Case and Activity Diagrams "Log In Use Case" | FR40 |

## Class Diagram Traceability
| Artifact ID | Artifact Name | Requirement ID |
| :---------: |:-------------: |:----------: |
| 6 | Early File Class Diagram | FR1-10, FR18-21, FR26-33,FR35-39, NFR10, NFR18-20, NFR22 |
| 7 | File Class Diagram | FR1-10, FR18-21, FR26-33,FR35-39, NFR10, NFR18-20, NFR22 |

## Activity Diagram Traceability
<In this case, it makes more sense (I think, feel free to disagree) to link
to the file and to those requirements impacted>
| Artifact ID | Artifact Name | Requirement ID |
| :-------------: | :----------: | :----------: |
| 1 | Use Case and Activity Diagram "Log In Activity Diagram" | FR40, NFR6-10 |
| 1 | Use Case and Activity Diagram "Load CustomUI" | FR18 |

# Software Artifacts

This section contains links to UML diagrams created during the development of ROSA.

* 1 [Use Case and Activity Diagrams](https://drive.google.com/file/d/1vLcoEO0qD9RL3gbr0cujuZnr71j0ZbIH/view?usp=drive_link)
* 2 [Early File Class Diagram](https://drive.google.com/file/d/1zVTGB22Z49P6rUKa-xhyI2LHCatntrZL/view?usp=drive_link)
* 3 [File Class Diagram](https://drive.google.com/file/d/1cqKOz_UtX-c6lrk87mayA5Be4qvCVebS/view?usp=drive_link)
