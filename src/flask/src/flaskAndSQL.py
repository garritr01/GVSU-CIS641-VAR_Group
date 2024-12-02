from flask import Flask, request, jsonify
from flask_cors import CORS
from urllib.parse import unquote
import os
import sqlite3
import logging
import json

app = Flask(__name__)
app.debug = True
CORS(app)  # Enable CORS for all routes

'''
Utilize the error codes as described here (make notes here if that's easier)
https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
'''

# Database folder path
parent_folder = os.path.dirname(os.path.abspath(__file__))

# Database file path
db_path = os.path.join(parent_folder+'/..', 'database.db')

@app.route('/signUp/<userName>/<password>', methods=['POST'])
def signUp(userName, password):
    '''Creates a username and password in the database'''
    #print(f"signing up {userName}, with password {password}")
    try:
        with sqlite3.connect(db_path) as connection:
            cursor = connection.cursor()
            #Create loginInfo if it doesn't exist with "columns", id (automated), userID, and password
            cursor.execute(f'CREATE TABLE IF NOT EXISTS loginInfo \
                           (id INTEGER PRIMARY KEY AUTOINCREMENT, userID TEXT, password TEXT, \
                           UNIQUE (userID))')
            #Insert username, and password
            cursor.execute(f'INSERT INTO loginInfo (userID, password) \
                            VALUES (?, ?)', (userName, password))
            #Commit changes
            connection.commit()
            return jsonify({'message':f"user {userName} created and assigned password: {password}"}), 201
    except sqlite3.IntegrityError as e:
        return jsonify({'message':str(e)}), 403
    except Exception as e:
        return jsonify({'message':str(e)}), 500

@app.route('/logIn/<userName>/<password>', methods=['GET'])
def logIn(userName, password):
    '''Checks login information and returns success or reason for failure'''
    try:
        #Connect to database
        with sqlite3.connect(db_path) as connection:
            #Create a cursor for use in database
            cursor = connection.cursor()
            #Select password from loginInfo table where userID is the input userID
            cursor.execute(f'SELECT password FROM loginInfo \
                            WHERE userID = ?', 
                            (userName, ))
            #Fetch password from cursor
            truePassword = cursor.fetchone()[0]
            #If password is correct return 200
            if password == truePassword:
                return jsonify({'message': f"{userName}, {password}, is correct"}), 200
            #Else return 403 (Forbidden)
            else:
                return jsonify({'message': f"{userName}, {password}, is incorrect"}), 403
    #Exceptions help determine issues    
    except Exception as e:
        return jsonify({'message': f"{userName}, {password},  Database error"}), 500

def createTable(tableName,tableType):
    '''
    Creates a table called {tableName} if it doesn't exist\n
    Contains text filename, directory, and userID (unique combination req'd), and date object
    - {tableType}
        - 'text' adds text payload
        - 'object' adds object payload
        - 'time' adds nothing
        - 'login' is a different beast (userID and password as TEXT)
    '''
    with sqlite3.connect(db_path) as connection:
        cursor = connection.cursor()
        if (tableType == 'text'):
            cursor.execute(f'CREATE TABLE IF NOT EXISTS {tableName} \
                           (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, directory TEXT, userID TEXT, dateTime JSON, options JSON, payload TEXT, \
                           UNIQUE (filename, directory, userID, dateTime))')
        elif (tableType == 'object'):
            cursor.execute(f'CREATE TABLE IF NOT EXISTS {tableName} \
                           (id INTEGER PRIMARY KEY AUTOINCREMENT, filename TEXT, directory TEXT, userID TEXT, dateTime JSON, options JSON, payload JSON, \
                           UNIQUE (filename, directory, userID, dateTime))')
        elif (tableType == 'login'):
            cursor.execute(f'CREATE TABLE IF NOT EXISTS {tableName} \
                            (id INTEGER PRIMARY KEY AUTOINCREMENT, userID TEXT, password TEXT,  \
                            UNIQUE (userID))')

def removeTable(tableName):
    '''Removes {tableName}'''
    try:
        with sqlite3.connect(db_path) as connection:
            cursor = connection.cursor()
            cursor.execute(f"DROP TABLE IF EXISTS {tableName}")
            connection.commit()
            print(f"Table '{tableName}' removed successfully")
    except sqlite3.Error as e:
        print(f"Error removing table: {e}")

def tablePrintout(fullPrintout=''):
    '''
    Prints out the name and columns of each table\n
    Prints everything from {fullPrintout} table if it exists
    '''

    with sqlite3.connect(db_path) as connection:

        print('\n\n -------- START TABLE PRINTOUT ----------')

        print(f"\nprinting tables based on '{fullPrintout}'")

        cursor = connection.cursor()

        cursor.execute("SELECT name from sqlite_master WHERE type='table'")
        tables = cursor.fetchall()

        for table in tables:
            tableName = table[0]
            cursor.execute(f"PRAGMA table_info({tableName})")
            cols = cursor.fetchall()

            if fullPrintout == '':
                print("\ntable:", tableName)
                colNames = []
                for col in cols:
                    colNames.append(col[1])
                print("columns:", ','.join(colNames))

            if fullPrintout == tableName:
                print(f'\n------- FULL {tableName} PRINTOUT -------')
                cursor.execute(f'SELECT * FROM {tableName}')
                entries = cursor.fetchall()
                for i, entry in enumerate(entries):
                    print(f"Entry {i}:", entry)
                    print('------------------------')
        
        print('\n\n -------- END TABLE PRINTOUT ----------')

@app.route('/getDirsAndTitles/<tableName>/<userID>',methods=['GET'])
def getDirsAndTitles(tableName, userID):
    '''
    Return list of dicts containing directory and filename properties corresponding with input tableName and userID
    '''
    with sqlite3.connect(db_path) as connection:
        cursor = connection.cursor()
        try:
            cursor.execute(f"SELECT filename, directory, dateTime FROM {tableName} WHERE userID = ?",(userID,))
            data = cursor.fetchall()
            files = [{'dateTime':json.loads(row[2]), 'dir': row[1], 'filename': row[0]} for row in data]
            return jsonify({'message': f"GET successful", 'files': files}), 200
        except sqlite3.OperationalError as e:
            return jsonify({'message': f"OperationalError fetching dirs and filenames from {userID}'s {tableName} table: "+str(e)}), 404
        except Exception as e:
            return jsonify({'message': f"Exception fetching dirs and filenames from {userID}'s {tableName} table: "+str(e)}), 500

@app.route('/getObject/<tableName>/<encodedDateTime>/<userID>/<path:directory>/<filename>', methods=['GET'])
def getObject(tableName, encodedDateTime, userID, directory, filename):
    '''
    Accept tableName, userID, directory, and filename\n
    Returns object payload and options
    '''
    with sqlite3.connect(db_path) as connection:
        try:
            dateTime = json.dumps(json.loads(encodedDateTime.replace('_','/')))
            cursor = connection.cursor()
            cursor.execute(f'SELECT payload, options FROM {tableName} \
                           WHERE dateTime = ? AND userID = ? AND directory = ? AND filename = ?', 
                           (dateTime, userID, directory, filename))
            data = cursor.fetchone()
            if data is not None:
                payload = json.loads(data[0])
                options = json.loads(data[1])
                return jsonify({ 'payload': payload, 'options': options, 'message': 'GET was successful' }), 200
            else:
                cursor.execute(f'SELECT payload, options FROM {tableName} \
                                WHERE userID = ? AND directory = ? AND filename = ?', 
                                (userID, directory, filename))
                data = cursor.fetchone()
                if data is not None:
                    print('\n\n\ndatetime',dateTime)
                    return jsonify({'message':f"{userID}'s {tableName}, {directory}, {filename} doesn't exist at the given time"}), 404
                else:
                    return jsonify({'message':f"{userID}'s {tableName}, {directory}, {filename} doesn't exist"}), 404

        except Exception as e:
            return jsonify({'message':"An error occurred:"+str(e)}), 500

@app.route('/getObjects', methods=['POST'])
def getObjects():
    '''
    Accepts JSON payload with tableName, userID, files (array), and objectsToReturn (options or payload).\n
    Returns an array of objects containing options and, optionally, payload.
    '''
    args = request.get_json()
    tableName, userID, files, contentToReturn = \
        args.get('tableName'), args.get('userID'), args.get('files'), args.get('contentToReturn')
    
    #contains each object collected
    results = []

    with sqlite3.connect(db_path) as connection:
        try:
            cursor = connection.cursor()

            for file in files:
                directory = file['dir']
                filename = file['filename']
                dateTime = json.dumps(file['dateTime'])

                query = f"""
                    SELECT {', '.join(contentToReturn)} 
                    FROM {tableName}
                    WHERE dateTime = ? AND userID = ? AND directory = ? AND filename = ?
                """
                cursor.execute(query, (dateTime, userID, directory, filename))
                data = cursor.fetchone()

                if data:
                    # Create object with options and possibly payload
                    result = {}
                    if 'options' in contentToReturn:
                        result['options'] = json.loads(data[contentToReturn.index('options')])
                    if 'payload' in contentToReturn:
                        result['payload'] = json.loads(data[contentToReturn.index('payload')])
                    result['dir'] = directory
                    result['filename'] = filename
                    result['dateTime'] = json.loads(dateTime)
                    # only return it if there is something to return
                    if ('payload' in result and result['payload'] and len(result['payload']) > 0) \
                    or ('options' in result and result['options'] and len(result['options']) > 0):
                        results.append(result)
                else:
                    # Handle missing file scenario
                    results.append({
                        'message': f"{userID}'s {tableName}, {directory}, {filename} doesn't exist"
                    })

            return jsonify({'objects': results, 'message': 'Data retrieval successful'}), 200

        except Exception as e:
            # Handle exceptions and return error response
            return jsonify({'message': f"An error occurred: {str(e)}"}), 500

@app.route('/saveObject',methods=['POST'])
def saveObject():
    '''
    Save userID, directory, filename, dateTime, options, and payload to tableName
    '''
    args = request.get_json()
    payload, dateTime, options, tableName, userID, directory, filename = \
        json.dumps(args.get('payload')), json.dumps(args.get('dateTime')), json.dumps(args.get('options')), \
        args.get('table'), args.get('userID'), args.get('dir'), args.get('filename')

    createTable(tableName,'object')

    if payload and tableName and dateTime and options and userID and directory and filename:
        with sqlite3.connect(db_path) as connection:
            cursor = connection.cursor()
    
            try:
                cursor.execute(f'INSERT INTO {tableName} (payload, options, dateTime, userID, directory, filename) \
                                VALUES (?, ?, ?, ?, ?, ?)', (payload, options, dateTime, userID, directory, filename))
                connection.commit()
                return {'message':f"{userID}'s {tableName}, {directory}, {filename} object saved successfully"}, 201
            except sqlite3.IntegrityError as e:
                cursor.execute(f'UPDATE {tableName} SET payload = ?, options = ? \
                               WHERE dateTime = ? AND userID = ? AND directory = ? AND filename = ?', 
                               (payload, options, dateTime, userID, directory, filename))
                print('affected:', cursor.rowcount)
                connection.commit()
                return {'message':f"{userID}'s {tableName}, {directory}, {filename} object updated successfully"}, 200
            except Exception as e:
                return {'message':str(e)}, 500
    else:
        notList = []
        if not payload:
            notList.append('payload')
        if not dateTime:
            notList.append('dateTime')
        if not options:
            notList.append('options')
        if not tableName:
            notList.append('tableName')
        if not userID:
            notList.append('userID')
        if not directory:
            notList.append('dir')
        if not filename:
            notList.append('filename')
        return jsonify({'message': f"missing required data: {', '.join(notList)}"}), 404

@app.route('/getText/<tableName>/<encodedDateTime>/<userID>/<path:directory>/<filename>', methods=['GET'])
def getText(tableName, encodedDateTime, userID, directory, filename):
    '''
    Accept tableName, userID, directory, dateTime and filename\n
    Returns text payload and options
    '''
    with sqlite3.connect(db_path) as connection:
        try:
            dateTime = json.dumps(json.loads(encodedDateTime.replace('_','/')))
            cursor = connection.cursor()
            cursor.execute(f'SELECT payload, options FROM {tableName} \
                           WHERE dateTime = ? AND userID = ? AND directory = ? AND filename = ?', 
                           (dateTime, userID, directory, filename))
            data = cursor.fetchone()
            if data is not None:
                payload = str(data[0])
                options = json.loads(data[1])
                return jsonify({ 'payload': payload, 'options': options, 'message': 'GET was successful' }), 200
            else:
                cursor.execute(f'SELECT payload, options FROM {tableName} \
                                WHERE userID = ? AND directory = ? AND filename = ?', 
                                (userID, directory, filename))
                data = cursor.fetchone()
                if data is not None:
                    print('\n\n\ndatetime',dateTime)
                    return jsonify({'message':f"{userID}'s {tableName}, {directory}, {filename} doesn't exist at the given time"}), 404
                else:
                    return jsonify({'message':f"{userID}'s {tableName}, {directory}, {filename} doesn't exist"}), 404

        except Exception as e:
            return jsonify({'message':"An error occurred:"+str(e)}), 500

@app.route('/saveText',methods=['POST'])
def saveText():
    '''
    Save userID, directory, filename, dateTime, options, and payload to tableName
    '''
    args = request.get_json()
    payload, dateTime, options, tableName, userID, directory, filename = \
        args.get('payload'), json.dumps(args.get('dateTime')), json.dumps(args.get('options')), \
        args.get('table'), args.get('userID'), args.get('dir'), args.get('filename')

    createTable(tableName,'text')

    if payload and tableName and dateTime and options and userID and directory and filename:
        with sqlite3.connect(db_path) as connection:
            cursor = connection.cursor()
    
            try:
                cursor.execute(f'INSERT INTO {tableName} (payload, options, dateTime, userID, directory, filename) \
                                VALUES (?, ?, ?, ?, ?, ?)', (payload, options, dateTime, userID, directory, filename))
                connection.commit()
                return {'message':f"{userID}'s {tableName}, {directory}, {filename} object saved successfully"}, 201
            except sqlite3.IntegrityError as e:
                cursor.execute(f'UPDATE {tableName} SET payload = ?, options = ? \
                               WHERE dateTime = ? AND userID = ? AND directory = ? AND filename = ?', 
                               (payload, options, dateTime, userID, directory, filename))
                print('affected:', cursor.rowcount)
                connection.commit()
                return {'message':f"{userID}'s {tableName}, {directory}, {filename} object updated successfully"}, 200
            except Exception as e:
                return {'message':str(e)}, 500
    else:
        notList = []
        if not payload:
            notList.append('UI')
        if not dateTime:
            notList.append('dateTime')
        if not options:
            notList.append('options')
        if not tableName:
            notList.append('tableName')
        if not userID:
            notList.append('userID')
        if not directory:
            notList.append('dir')
        if not filename:
            notList.append('filename')
        return jsonify({'message': f"missing required data: {', '.join(notList)}"}), 404

@app.route('/find_string/<tableName>/<userID>/<searchStr>')
def find_string(tableName, userID, searchStr):
    '''
    Find all instances of an exact string within a table
    '''
    with sqlite3.connect(db_path) as connection:
        cursor = connection.cursor()

        try:
            cursor.execute(f"SELECT title, directory, dateTime, content FROM {tableName} WHERE userID = ?",(userID,))
            data = cursor.fetchall()
            files = [{'dateTime':json.loads(row[2]), 'dir': row[1], 'title': row[0], 'content': row[3]} for row in data]
            filesWhereStringFound = []
            for file in files:
                if (searchStr in file['content']):
                    indexFound = file['content'].find(searchStr)
                    startDistance = 20
                    if indexFound < 10:
                        startDistance = indexFound
                    endDistance = 20 + len(searchStr)
                    if indexFound + endDistance >= len(file['content']):
                        endDistance = (len(file['content']) - 1) - indexFound
                    sample = file['content'][indexFound-startDistance:indexFound+endDistance]
                    filesWhereStringFound.append({'dateTime': file['dateTime'], 'dir': file['dir'], 'title': file['title'], 'sample': sample})
            if len(filesWhereStringFound) > 0:
                return filesWhereStringFound, 200
            else:
                return jsonify({'message': f"Could not find '{searchStr}' fetching dirs and titles from {userID}'s {tableName} table."}), 404
        except sqlite3.OperationalError as e:
            return jsonify({'message': f"OperationalError fetching dirs and titles from {userID}'s {tableName} table: "+str(e)}), 404
        except Exception as e:
            return jsonify({'message': f"Exception fetching dirs and titles from {userID}'s {tableName} table: "+str(e)}), 500

@app.route('/removeEntry/<tableName>/<encodedFilename>/<encodedDateTime>/<userID>/<path:directory>', methods=['DELETE'])
def removeEntry(tableName,encodedFilename, encodedDateTime, userID, directory):
    '''
    Remove entry from tableName based on userID, directory, filename, and dateTime.
    Removes:
    - All entries with userID and directory if filename isn't defined.
    - All entries with userID, directory, and filename if dateTime isn't defined.
    - The entry with all parameters if all are defined.
    Also remove 'resolve' entry if 'record' contains 'resolved' attribute
    Also remove 'record' entry if removing 'resolved'
    '''
    try:
        with sqlite3.connect(db_path) as connection:
            # Decode the encoded dateTime
            dateTime = json.loads(encodedDateTime.replace('_', '/'))
            filename = json.loads(encodedFilename)
            cursor = connection.cursor()
            resolveCursor = connection.cursor()

            # Determine which conditions to apply:
            if filename and dateTime:
                # If all are defined, delete entry with userID, directory, filename, and dateTime
                cursor.execute(f'SELECT id FROM {tableName} WHERE userID = ? AND directory = ? AND filename = ? AND dateTime = ?',
                               (userID, directory, filename, json.dumps(dateTime)))
            elif filename:
                # If filename is defined, but datetime is not, remove entries with userID, directory, and filename
                cursor.execute(f'SELECT id FROM {tableName} WHERE userID = ? AND directory = ? AND filename = ?',
                               (userID, directory, filename))
            elif dateTime:
                # If dateTime is defined, but filename is not, return an error
                return jsonify({'message': f"Unexpected dateTime definitions. No entries deleted for {userID} in {tableName}, {directory}, {filename if filename else ''}, {dateTime if dateTime else ''}"}), 500
            else:
                # If neither filename nor dateTime are defined, remove entries with userID and directory (including subdirectories)
                cursor.execute(f'SELECT id FROM {tableName} WHERE userID = ? AND (directory = ? OR directory LIKE ?)',
                               (userID, directory, f'{directory}%'))

            # Create new cursor for getting options from 'record' to delete associated 'resolve'
            cursor2 = connection.cursor()
            # Fetch all the rows to delete
            rows = cursor.fetchall()
            rowsAffected = 0
            for row in rows:
                id = row[0]

                # Also delete 'record' where options.resolved is equal to dateTime of deleted 'resolve'
                if tableName == 'resolve':
                    cursor2.execute(f'SELECT directory, filename, dateTime FROM {tableName} WHERE id = ?', (id,))
                    record = cursor2.fetchone()
                    if record:
                        rDirectory, rFilename, rDateTime = record
                        rowsAffected += cursor.execute(f'DELETE FROM record WHERE userID = ? AND directory = ? AND filename = ? AND options LIKE ?', 
                           (userID, rDirectory, rFilename, f'%resolved": {rDateTime}%')).rowcount
                # Also delete 'resolve' where dateTime is equal to options.resolved of deleted 'record'
                elif tableName == 'record':
                    cursor2.execute(f'SELECT directory, filename, dateTime, options FROM {tableName} WHERE id = ?', (id,))
                    resolve = cursor2.fetchone()
                    if resolve:
                        rDirectory, rFilename, rDateTime, rOptions = resolve
                        rOptions = json.loads(rOptions)
                        if 'resolved' in rOptions:
                            rowsAffected += cursor.execute(f'DELETE FROM resolve WHERE userID = ? AND directory = ? AND filename = ? AND dateTime = ?',
                                (userID, rDirectory, rFilename, json.dumps(rOptions['resolved']))).rowcount
                # delete entry at id
                rowsAffected += cursor.execute(f'DELETE FROM {tableName} WHERE id = ?', (id,)).rowcount

            if rowsAffected > 0:
                return jsonify({'message': f"{rowsAffected} entries deleted successfully for {userID} in {tableName}, {directory}, {filename if filename else ''}, {dateTime if dateTime else ''}"}), 200
            else:
                return jsonify({'message': f"No entries found to delete for {userID} in {tableName}, {directory}, {filename if filename else ''}, {dateTime if dateTime else ''}"}), 404
    except Exception as e:
        print('\n\n', e)
        return jsonify({'message': str(e)}), 500


#create_table('miscDropdowns','object')

#Prints out table info
#Use table name for detailed printout of just that table
tablePrintout()
#remove_messed_up_entry('miscDropdowns','Garrit','CustomInfo/Chores','Taking Dogs Out')
#selection_test('loginInfo','Health','Gym')
#find_string('customInfo','Garrit','ldes')

'''IF YOU UNCOMMENT THIS LINE THE FILE WILL RERUN AND TABLE WILL BE DELETED IMMEDIATELY'''
#removeTable('loginInfo')

if __name__ == '__main__':
    app.run(host='localhost', port=5000)
