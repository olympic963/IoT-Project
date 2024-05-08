# IoT-Project
Welcome to the IoT-Project repository! This project focuses on displaying and analyzing data from various sensors (DHT11, BH1750 - GY30, MQ-2) and controlling LED lights. Below are the steps to set up and run the project locally.

## Prerequisites
Ensure you have the following installed on your system:
- Node.js
- MySQL
- Visual Studio Code or any preferred IDE

## Setup Instructions
### 1. Installing and Configuring Node.js
Download and install Node.js from [Node.js official website](https://nodejs.org/).

### 2. Setting Up MySQL
Install MySQL from the [MySQL official website](https://dev.mysql.com/downloads/). Once installed, execute the SQL script found in `create.sql` to set up your database. This script initializes tables such as `device_status`, `intervals`, `sensor_data`, and `user_info` necessary for the project.

### 3. Cloning the Project
Clone this repository to your local machine using Visual Studio Code or your preferred IDE. Use the following command:

git clone https://github.com/olympic963/IoT-Project.git

### 4. Project Structure
The project is divided into three main folders:
- `iot-backend`: Contains the server-side code.
- `iot-frontend`: Contains the React application for the user interface.
- `mqtt_esp32`: Contains the Arduino code for the ESP32 microcontroller to handle MQTT communications.

### 5. Running the Backend
Navigate to the `iot-backend` folder and install dependencies: npm install

Start the server: node backend.js

### 6. Running the Frontend
Navigate to the `iot-frontend` folder and install dependencies: npm install

Start the server: npm start

The application will be available at `http://localhost:3000`.

### 7. Deploying the MQTT Broker
Ensure the MQTT broker settings in the `mqtt_esp32` code are correctly configured to match your MQTT server settings.

Thank you for viewing IoT-Project!


