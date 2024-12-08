# VAR Group

Project description (~1 paragraph)

# Team Members and Roles

* [Garrit Reynolds](https://github.com/garritr01/CIS641-HW2-Reynolds) (Role 1, Role 2)
* [vegesna sankeerthana](https://github.com/vegesnasankeerthana/CIS641-HW2-vegesna.git)
* [Festus Asante](https://github.com/asantefes7/CIS641-HW2-Asante.git) (Role 5, Role 6) 

## Prerequisites
* Computer must have internet access and be capable of downloading Node.js

## Run Instructions

### 1. Get WSL2 and set up with ubuntu
    https://learn.microsoft.com/en-us/windows/wsl/install#prerequisites
### 2. Install nvm: 
    $curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
### 3. Put follwing code in ~/.bashrc file
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
### 4. Restart ubuntu.
### 5. Install Node.js with nvm:
    $nvm install --lts ($nvm -use --lts    [if you had old version])
### 6. Confirm you have npm and node:
    $npm -v
    $node -v
### 7. Pull main branch to local at the desired location.
### 8. Create virtual environment.
  #### 8a. Retrieve updated package lists
        $sudo apt update
  #### 8b. Install venv
        $sudo apt install python3-venv
  #### 8c. Create venv (will be created in current directory):
        $python3 -m venv nameOfYourVirtualEnvironment
  #### 8d. Activate your virtual environment
        $source nameOfYourVirtualEnvironment/bin/activate
### 9. Download flask dependecies within virtual environment:
  #### 9a. Install required packages if you have not already (if you have you may want to update)
    $sudo apt install pkg-config build-essential python3-dev libatlas-base-dev liblapack-dev gfortran
  #### 9b. Install project's python dependencies
    $pip install -r src/flask/requirements.txt
### 10. Start backend.
    $python3 src/flask/src/flaskAndSQL.py
### 11. Open a new terminal and install dependencies for frontend:
    $cd ROSA
    $npm install
### 12. Open in development build:
    $npm start
### 13. Browser will open development server at http://localhost:3000/
