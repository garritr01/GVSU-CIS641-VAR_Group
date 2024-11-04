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

@app.route('/sign_up/<userName>/<password>', methods=['POST'])
def sign_up(userName, password):
    '''Enters username and password in database'''
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

@app.route('/log_in/<userName>/<password>', methods=['GET'])
def log_in(userName, password):
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

def create_table(tableName,tableType):
    '''
    Creates a table called {tableName} if it doesn't exist\n
    Contains text title, directory, and userID (unique combination req'd), and date object
    - {tableType}
        - 'text' adds text content
        - 'object' adds object content
        - 'time' adds nothing
        - 'login' is a different beast (userID and password as TEXT)
    '''
    with sqlite3.connect(db_path) as connection:
        cursor = connection.cursor()
        if (tableType == 'text'):
            cursor.execute(f'CREATE TABLE IF NOT EXISTS {tableName} \
                           (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, directory TEXT, userID TEXT, dateTime JSON, content TEXT, \
                           UNIQUE (title, directory, userID, dateTime))')
        elif (tableType == 'object'):
            cursor.execute(f'CREATE TABLE IF NOT EXISTS {tableName} \
                           (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, directory TEXT, userID TEXT, dateTime JSON, content JSON, \
                           UNIQUE (title, directory, userID, dateTime))')
        elif (tableType == 'time'):
            cursor.execute(f'CREATE TABLE IF NOT EXISTS {tableName} \
                            (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, directory TEXT, userID TEXT, dateTime JSON, \
                            UNIQUE (title, directory, userID))')
        elif (tableType == 'schedule'):
            cursor.execute(f'CREATE TABLE IF NOT EXISTS {tableName} \
                            (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, directory TEXT, userID TEXT, dateTime JSON) ')
        elif (tableType == 'login'):
            cursor.execute(f'CREATE TABLE IF NOT EXISTS {tableName} \
                            (id INTEGER PRIMARY KEY AUTOINCREMENT, userID TEXT, password TEXT,  \
                            UNIQUE (userID))')
       
def remove_table(tableName):
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

def selection_test(tableName, dir, name):
    '''
    Prints out titles with directory == {dir}\n
    Prints out content with directory == {dir} and title == {name}
    '''
    with sqlite3.connect(db_path) as connection:
        cursor = connection.cursor()

        cursor.execute(f'SELECT title FROM {tableName} WHERE directory = ?', (dir,))
        data = cursor.fetchall()
        print(f'\n\ntitles from {tableName}, {dir}:', {str(data)})

        cursor.execute(f'SELECT content FROM {tableName} WHERE title = ? AND directory = ?', (name, dir,))
        data = cursor.fetchone()
        print(f'\n\ncontent from {tableName}, {dir}, {name}',data,'\n\n')

def remove_messed_up_entry(tableName, userID, directory, title, dateTime):
    '''
    remove userID, directory, and title entry from tableName
    '''
    with sqlite3.connect(db_path) as connection:
        cursor = connection.cursor()
        cursor.execute(f'DELETE FROM {tableName} \
            WHERE userID = ? AND directory = ? AND title = ?',
            (userID, directory, title))

@app.route('/get_times/<table>/<userID>/<path:directory>/<title>', methods=['GET'])
def get_times(table, userID, directory, title):
    '''
    Accept userID, directory, and title\n
    Output corresponding dictionary from timeRecords
    '''
    print(table, userID, directory, title)
    try:
        with sqlite3.connect(db_path) as connection:
            cursor = connection.cursor()
            cursor.execute(f'SELECT dateTime FROM {table} \
                            WHERE userID = ? AND directory = ? AND title = ?', 
                            (userID, directory, title,))
            dateTime = cursor.fetchall()
            print(dateTime)
            dateTimes = [json.loads(row[0]) for row in dateTime]
            print('dateTimes',dateTimes)

            if dateTime is not None:
                try:
                    return jsonify(dateTimes), 200
                except json.JSONDecodeError as e:
                    return jsonify({'message': f"{userID}'s {table}, {directory}, {title} Invalid JSON in dateTime field", 'error': str(e)}), 500
            else:
                return jsonify({'message': 'Data not found'}), 404
            
    except sqlite3.Error as e:
        return jsonify({'message': f"{userID}'s {table}, {directory}, {title} Database error", 'error': str(e)}), 500
    except Exception as e:
        return jsonify({'message': f"{userID}'s {table}, {directory}, {title} error", 'error': str(e)}), 500

@app.route('/get_time/<table>/<userID>/<path:directory>/<title>', methods=['GET'])
def get_time(table, userID, directory, title):
    '''
    Accept userID, directory, and title\n
    Output corresponding dictionary from timeRecords
    '''
    print(table, userID, directory, title)
    try:
        with sqlite3.connect(db_path) as connection:
            cursor = connection.cursor()
            cursor.execute(f'SELECT dateTime FROM {table} \
                            WHERE userID = ? AND directory = ? AND title = ?', 
                            (userID, directory, title,))
            dateTime = cursor.fetchone()

            if dateTime is not None:
                try:
                    return jsonify(json.loads(dateTime[0])), 200
                except json.JSONDecodeError as e:
                    return jsonify({'message': f"{userID}'s {table}, {directory}, {title} Invalid JSON in dateTime field", 'error': str(e)}), 500
            else:
                return jsonify({'message': 'Data not found'}), 404
            
    except sqlite3.Error as e:
        return jsonify({'message': f"{userID}'s {table}, {directory}, {title} Database error", 'error': str(e)}), 500
    except Exception as e:
        return jsonify({'message': f"{userID}'s {table}, {directory}, {title} Database error", 'error': str(e)}), 500

@app.route('/record_time', methods=['POST'])
def record_time():
    '''
    Accept dateTime dict, userID, directory, and title from body\n
    Save to timeRecords table
    '''
    args = request.get_json()
    if not args:
        return jsonify({'message': 'Invalid request data'}), 404
    
    table, dateTime, userID, directory, title = \
        args.get('table'), json.dumps(args.get('dateTime')), \
        args.get('userID'), args.get('directory'), args.get('title')

    print(table, dateTime, userID, directory, title)

    if(table == 'timeRecords'):
        create_table(table, 'time')
    else:
        create_table(table, 'schedule')

    if table and dateTime and userID and directory and title:
        with sqlite3.connect(db_path) as connection:
            cursor = connection.cursor()
            try:
                cursor.execute(f'INSERT INTO {table} (dateTime, userID, directory, title) \
                                VALUES (?, ?, ?, ?)',
                                (dateTime, userID, directory, title))
                connection.commit()
                return jsonify({'message': f"{userID}'s {table}, {directory}, {title}  saved successfully"}), 200
            except sqlite3.IntegrityError:
                cursor.execute('UPDATE timeRecords SET dateTime = ? \
                                WHERE userID = ? AND directory = ? AND title = ?',
                                (dateTime, userID, directory, title))
                connection.commit()
                return jsonify({'message': f"{userID}'s {table}, {directory}, {title}  updated successfully"}), 200
            except Exception as e:
                return {'message':str(e)}, 500
    else:
        notList = []
        if not table:
            notList.append("table")
        if not dateTime:
            notList.append('dateTime')
        if not userID:
            notList.append('userID')
        if not directory:
            notList.append('directory')
        if not title:
            notList.append('title')
        return jsonify({'message': f"missing required data: {', '.join(notList)}"}), 404

@app.route('/get_dirs_and_titles/<tableName>/<userID>',methods=['GET'])
def get_dirs_and_titles(tableName, userID):
    '''
    Return list of dicts containing directory and title properties corresponding with input tableName and userID
    '''
    with sqlite3.connect(db_path) as connection:
        cursor = connection.cursor()

        try:
            cursor.execute(f"SELECT title, directory, dateTime FROM {tableName} WHERE userID = ?",(userID,))
            data = cursor.fetchall()
            files = [{'dateTime':json.loads(row[2]), 'directory': row[1], 'title': row[0]} for row in data]
            return files, 200
        except sqlite3.OperationalError as e:
            return jsonify({'message': f"OperationalError fetching dirs and titles from {userID}'s {tableName} table: "+str(e)}), 404
        except Exception as e:
            return jsonify({'message': f"Exception fetching dirs and titles from {userID}'s {tableName} table: "+str(e)}), 500

@app.route('/get_listed_objects/<tableName>',methods=['POST'])
def get_listed_objects(tableName):
    '''
    Get objects associated with each element of array (containing directory, title, table, dateTime, userID)
    '''
    attributes = request.get_json()['attributes']
    print(f'\n\n\n\n\ngetting objects from {tableName}')
    with sqlite3.connect(db_path) as connection:
        try:
            print(type(attributes[0]['dateTime']))
            print(json.dumps(attributes[0]['dateTime']))
            params = [[json.dumps(attribute['dateTime']),attribute['userID'],attribute['directory'],attribute['title']] for attribute in attributes]
            flat_params = [value for sublist in params for value in sublist]
            print('\n\n\n\n',params[0])
            cursor = connection.cursor()
            query = f'SELECT content FROM {tableName} WHERE '
            query += ' OR '.join([f'(dateTime = ? AND userID = ? AND directory = ? AND title = ?)' for _ in range(len(params))])
            print(query,flat_params)
            cursor.execute(query, flat_params)
            data = cursor.fetchall()
            outDicts = [{**item, 'content': json.loads(data[i][0])} for i, item in enumerate(attributes)]

            return jsonify({ 'fileInfo': outDicts })

        except Exception as e:
            return jsonify({'message', 'some error importing information'})
        
@app.route('/get_object/<tableName>/<encodedDateTime>/<userID>/<path:directory>/<title>', methods=['GET'])
def get_object(tableName, encodedDateTime, userID, directory, title):
    '''
    Accept tableName, userID, directory, and title\n
    Returns object containing UI array of objects and dateTime object
    '''
    with sqlite3.connect(db_path) as connection:
        try:
            dateTime = json.dumps(json.loads(encodedDateTime.replace('_','/')))
            cursor = connection.cursor()
            cursor.execute(f'SELECT content FROM {tableName} \
                           WHERE dateTime = ? AND userID = ? AND directory = ? AND title = ?', 
                           (dateTime, userID, directory, title))
            data = cursor.fetchone()
            if data is not None:
                UI = json.loads(data[0])
                return jsonify({ 'UI': UI }), 200
            else:
                cursor.execute(f'SELECT content FROM {tableName} \
                                WHERE userID = ? AND directory = ? AND title = ?', 
                                (userID, directory, title))
                data = cursor.fetchone()
                if data is not None:
                    print('\n\n\ndatetime',dateTime)
                    return jsonify({'message':f"{userID}'s {tableName}, {directory}, {title} UI doesn't exist at the given time"}), 404
                else:
                    return jsonify({'message':f"{userID}'s {tableName}, {directory}, {title} UI doesn't exist"}), 404

        except Exception as e:
            return jsonify({'message':"An error occurred:"+str(e)}), 500

@app.route('/save_object',methods=['POST'])
def save_object():
    '''
    Save userID, directory, title, dateTime, and object to tableName
    '''
    args = request.get_json()
    UI, dateTime, tableName, userID, directory, title = \
        json.dumps(args.get('UI')), json.dumps(args.get('dateTime')), args.get('tableName'), \
        args.get('userID'), args.get('directory'), args.get('title')
    
    print('\n', dateTime, tableName, userID, directory, title, '\n')

    create_table(tableName,'object')

    if UI and tableName and dateTime and userID and directory and title:
        with sqlite3.connect(db_path) as connection:
            cursor = connection.cursor()
    
            try:
                cursor.execute(f'INSERT INTO {tableName} (content, dateTime, userID, directory, title) \
                                VALUES (?, ?, ?, ?, ?)', (UI, dateTime, userID, directory, title))
                connection.commit()
                return {'message':f"{userID}'s {tableName}, {directory}, {title} object saved successfully"}, 200
            except sqlite3.IntegrityError as e:
                print('updatingUI: \n\n',UI)
                cursor.execute(f'UPDATE {tableName} SET content = ? \
                               WHERE dateTime = ? AND userID = ? AND directory = ? AND title = ?', 
                               (UI, dateTime, userID, directory, title))
                print('affectd:', cursor.rowcount)
                connection.commit()
                return {'message':f"{userID}'s {tableName}, {directory}, {title} object updated successfully"}, 200
            except Exception as e:
                return {'message':str(e)}, 500
    else:
        notList = []
        if not UI:
            notList.append('UI')
        if not dateTime:
            notList.append('dateTime')
        if not tableName:
            notList.append('tableName')
        if not userID:
            notList.append('userID')
        if not directory:
            notList.append('directory')
        if not title:
            notList.append('title')
        return jsonify({'message': f"missing required data: {', '.join(notList)}"}), 404

@app.route('/get_text/<tableName>/<encodedDateTime>/<userID>/<path:directory>/<title>', methods=['GET'])
def get_text(tableName, encodedDateTime, userID, directory, title):
    '''
    Accept tableName, dateTime object, userID, directory, and title\n
    Returns text
    '''
    with sqlite3.connect(db_path) as connection:
        try:
            dateTime = json.dumps(json.loads(encodedDateTime.replace('_','/')))
            cursor = connection.cursor()
            cursor.execute(f'SELECT content FROM {tableName} \
                           WHERE dateTime = ? AND userID = ? AND directory = ? AND title = ?', 
                           (dateTime, userID, directory, title))
            data = cursor.fetchone()

            if data is not None:
                entry = str(data[0])
                return jsonify({'entry':entry}), 200
            else:
                return jsonify({'message':f"{userID}'s {tableName}, {directory}, {title} entry doesn't exist"}), 404

        except Exception as e:
            print("Error:", e)
            return jsonify({'message': str(e)}), 500

@app.route('/save_text',methods=['POST'])
def save_text():
    '''
    Save userID, directory, title, dateTime, and text to tableName
    '''
    args = request.get_json()
    entry, dateTime, tableName, userID, directory, title = \
        args.get('entry'), json.dumps(args.get('dateTime')), args.get('tableName'), \
        args.get('userID'), args.get('directory'), args.get('title')

    create_table(tableName,'text')

    if entry and tableName and dateTime and userID and directory and title:
        with sqlite3.connect(db_path) as connection:
            cursor = connection.cursor()

            try:
                cursor.execute(f'INSERT INTO {tableName} (content, dateTime, userID, directory, title) \
                                VALUES (?, ?, ?, ?, ?)', (entry, dateTime, userID, directory, title))
                connection.commit()
                return {'message':f"{userID}'s {tableName}, {directory}, {title} entry saved successfully"}, 200
            except sqlite3.IntegrityError as e:
                cursor.execute(f'UPDATE {tableName} SET content = ? \
                               WHERE dateTime = ? AND userID = ? AND directory = ? AND title = ?', 
                               (entry, dateTime, userID, directory, title))
                connection.commit()
                return {'message': f"{userID}'s {tableName}, {directory}, {title} entry updated successfully"}, 200
            except Exception as e:
                return {'message':str(e)}, 500
    else:
        notList = []
        if not entry:
            notList.append('UI')
        if not dateTime:
            notList.append('dateTime')
        if not tableName:
            notList.append('tableName')
        if not userID:
            notList.append('userID')
        if not directory:
            notList.append('directory')
        if not title:
            notList.append('title')
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
            files = [{'dateTime':json.loads(row[2]), 'directory': row[1], 'title': row[0], 'content': row[3]} for row in data]
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
                    filesWhereStringFound.append({'dateTime': file['dateTime'], 'directory': file['directory'], 'title': file['title'], 'sample': sample})
            if len(filesWhereStringFound) > 0:
                return filesWhereStringFound, 200
            else:
                return jsonify({'message': f"Could not find '{searchStr}' fetching dirs and titles from {userID}'s {tableName} table."}), 404
        except sqlite3.OperationalError as e:
            return jsonify({'message': f"OperationalError fetching dirs and titles from {userID}'s {tableName} table: "+str(e)}), 404
        except Exception as e:
            return jsonify({'message': f"Exception fetching dirs and titles from {userID}'s {tableName} table: "+str(e)}), 500
            
@app.route('/remove_entry/<tableName>/<encodedDateTime>/<userID>/<path:directory>/<title>', methods=['DELETE'])
def remove_entry(tableName, encodedDateTime, userID, directory, title):
    '''
    remove userID, directory, and title entry from tableName
    '''
    try:
        with sqlite3.connect(db_path) as connection:
            dateTime = json.loads(encodedDateTime.replace('_','/'))
            cursor = connection.cursor()
            cursor.execute(f'SELECT id, dateTime FROM {tableName} \
                    WHERE userID = ? AND directory = ? AND title = ?', 
                    (userID, directory, title,))
            rows = cursor.fetchall()
            dateTimesDB = [json.loads(row[1]) for row in rows]
            ids = [row[0] for row in rows]
            rowsAffected = 0
            for id, dateTimeDB in zip(ids, dateTimesDB):
                delete = True
                for key in dateTimeDB:
                    if key not in dateTime:
                        delete = False
                        break
                    if dateTimeDB[key] != dateTime[key]:
                        delete = False
                        break
                if delete:
                    print(id, userID, directory, title, dateTimeDB)
                    rowsAffected += \
                        cursor.execute(f'DELETE FROM {tableName} \
                            WHERE id = ? AND userID = ? AND directory = ? AND title = ?',
                            (id, userID, directory, title)).rowcount
            if rowsAffected > 0:
                return jsonify({'message': f"{userID}'s {tableName}, {directory}, {title} from {dateTime} deleted successfully"}), 200
            else:
                return jsonify({'message': f"{userID}'s {tableName}, {directory}, {title} from {dateTime} not found"}), 404
    except Exception as e:
        print('\n\n',e)
        return jsonify({'message': str(e)}), 404


#create_table('miscDropdowns','object')

#Prints out table info
#Use table name for detailed printout of just that table
tablePrintout('loginInfo')
#remove_messed_up_entry('miscDropdowns','Garrit','CustomInfo/Chores','Taking Dogs Out')
#remove_table('loginInfo')
#selection_test('loginInfo','Health','Gym')
#find_string('customInfo','Garrit','ldes')

if __name__ == '__main__':
    app.run(host='localhost', port=5000)
