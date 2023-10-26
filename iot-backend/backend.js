const express = require('express');
const mysql = require('mysql2');
const mqtt = require('mqtt');
const http = require('http');
const app = express();
const port = 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'olympic963',
  database: 'iotweb'
});

db.connect((err) => {
  if (err) {
      throw err;
  }
  console.log('Connected to database');
});

//const client  = mqtt.connect('mqtt://192.168.0.2');
const client = mqtt.connect('mqtts://08e56ac55e6545fd9c563fdbafc7e768.s1.eu.hivemq.cloud', {
    port: 8883,
    username: 'olympic963',
    password: 'Anacondaxs5'
}); 

const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",  
    methods: ["GET", "POST"]
  }
});

client.on('connect', () => {
  console.log('Connected to MQTT Broker');
  client.subscribe('ESP32/temperature_humidity_brightness_gas', (err) => {
    if (!err) {
      console.log('Subscribed to ESP32/temperature_humidity_brightness_gas');
    }
  });
  client.subscribe('ESP32/Device/#', (err) => {
    if (!err) {
      console.log('Subscribed to ESP32/Device topic');
    }
  });
  client.subscribe('ESP32/curInterval', (err) => {
    if (!err) {
      console.log('Subscribed to ESP32/curInterval topic');
    }
  });
});

let currentFiltersDevice = {};
let currentFiltersSensor = {};
let check=false;
io.on('connection', (socket) => {
  console.log('New client connected');
  socket.on('deviceControl', (data) => {
    const { status, deviceId } = data;
    const message = `${status}${deviceId}`;
    const topic = `ESP32/deviceControl`;
    client.publish(topic, message, (err) => {
      if(err) {
        console.error('Failed to send message', err);
      } else {
        console.log(`Message sent to ${topic} with status: ${message}`);
      }
    });
  });
  socket.on('setFiltersDevice', (filters) => {
      currentFiltersDevice = filters;
  });
  socket.on('setFiltersSensor', (filters) => {
    currentFiltersSensor = filters;
    check=true;
  });
  socket.on('setInterval', (interval) => {
    client.publish('ESP32/setInterval', String(interval));
  });
  socket.on('deleteReq',(req) =>{
    if(req === 'deleteSensorHistory'){
      db.query('TRUNCATE `iotweb`.`sensor_data`;', (err) => {
        if(err) {
          console.error('Error delete sensor data:', err);
        } else {
          io.emit('deleteRes', 'Delete sensor history complete' );
        }
      });
    }
    if(req === 'deleteDeviceHistory'){
      db.query('TRUNCATE `iotweb`.`device_status`;', (err) => {
        if(err) {
          console.error('Error delete device history:', err);
        } else {
          io.emit('deleteRes', 'Delete device history complete' );
        }
      });
    }
  });
});
client.on('message', (topic, message) => {
  console.log(`Received message on ${topic}: ${message.toString()}`);
  try {
    if(topic === 'ESP32/temperature_humidity_brightness_gas') {
      const [temp, humidity, brightness,gas] = message.toString().split(',');
      db.query('INSERT INTO sensor_data (temperature, humidity, brightness, gas) VALUES (?, ?, ?, ?)', [temp, humidity, brightness, gas], (err) => {
        if(err) {
          console.error('Error inserting data:', err);
        } else {
          db.query('SELECT * FROM sensor_data ORDER BY id DESC LIMIT 1', (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
              const receivedAt = results[0].received_at;
              const receivedAtLocal = new Date(receivedAt.getTime() - (receivedAt.getTimezoneOffset() * 60000));
              const receivedAtISOLocal = receivedAtLocal.toISOString(); 
              const formattedReceivedAt = receivedAtISOLocal.replace("T", " ").replace("Z", "");
              const timePart = formattedReceivedAt.split(" ")[1];
              const time = timePart.split('.')[0];
              // const datePart = formattedReceivedAt.split(" ")[0];
              // const [year, month, day] = datePart.split('-');
              // const date = [day, month, year].join('-');   
              //const reorderedReceivedAt  = `${time} ${date}`;
              io.emit('newData', { temperature: temp, humidity: humidity, brightness: brightness,gas: gas, time });       
              // client.publish('ESP32/timestamp', reorderedReceivedAt);         
            } 
          });         
          console.log('Insert sensor data complete')  
          if(check){
            let sql = '';
            const conditions = [];
            let sortConditions = []; 
            const values = [];
            if (currentFiltersSensor.startTime) {
              conditions.push(" DATE(received_at) >= ?");
              values.push(currentFiltersSensor.startTime);
            }
            if (currentFiltersSensor.endTime) {
                conditions.push(" DATE(received_at) <= ?");
                values.push(currentFiltersSensor.endTime);
            }  
            if (currentFiltersSensor.option == 'stats') {
              sql = `SELECT 
                MIN(temperature) AS min_temperature,
                MAX(temperature) AS max_temperature,
                ROUND(AVG(temperature), 2) AS avg_temperature,
                MIN(humidity) AS min_humidity,
                MAX(humidity) AS max_humidity,
                ROUND(AVG(humidity), 2) AS avg_humidity,             
                MIN(brightness) AS min_brightness,
                MAX(brightness) AS max_brightness,
                ROUND(AVG(brightness), 2) AS avg_brightness,
                MIN(gas) AS min_gas,
                MAX(gas) AS max_gas,
                ROUND(AVG(gas), 2) AS avg_gas
                FROM sensor_data`;
              if (conditions.length) {
                sql += ' WHERE ' + conditions.join(' AND '); 
              }                  
            } else if (currentFiltersSensor.option == 'search') {
              sql = 'SELECT * FROM sensor_data';
              if (['temperature', 'humidity', 'brightness','gas'].includes(currentFiltersSensor.attribute) && currentFiltersSensor.value && !isNaN(parseFloat(currentFiltersSensor.value))) {
                const delta = 0.08;  
                const minValue = parseFloat(currentFiltersSensor.value) - delta;
                const maxValue = parseFloat(currentFiltersSensor.value) + delta;
                const attributeCondition = `${currentFiltersSensor.attribute} BETWEEN ? AND ?`;
                conditions.push(attributeCondition);
                values.push(minValue, maxValue);
              }   
              if (conditions.length) {
                sql += ' WHERE ' + conditions.join(' AND '); 
              }             
              if (currentFiltersSensor.sortT && currentFiltersSensor.sortT !== 'all') {
                  sortConditions.push(`temperature ${currentFiltersSensor.sortT}`);
              }
              if (currentFiltersSensor.sortH && currentFiltersSensor.sortH !== 'all') {
                  sortConditions.push(`humidity ${currentFiltersSensor.sortH}`);
              }
              if (currentFiltersSensor.sortB && currentFiltersSensor.sortB !== 'all') {
                  sortConditions.push(`brightness ${currentFiltersSensor.sortB}`);
              }
              if (currentFiltersSensor.sortG && currentFiltersSensor.sortG !== 'all') {
                sortConditions.push(`gas ${currentFiltersSensor.sortG}`);
              }
              if (currentFiltersSensor.sortR && currentFiltersSensor.sortR !== 'all') {
                sortConditions.push(`received_at ${currentFiltersSensor.sortR}`);
              }
              if (sortConditions.length) {
                  sql += ' ORDER BY ' + sortConditions.join(', ');
              }
            }     
            db.query(sql, values, (err, results) => {
              if (err) {
                throw err;
              } else {
                if (currentFiltersSensor.option === 'search') {
                  results.forEach((result, index) => {
                    const changedAt = result.received_at;
                    const changedAtLocal = new Date(changedAt.getTime() - (changedAt.getTimezoneOffset() * 60000));
                    const changedAtISOLocal = changedAtLocal.toISOString(); 
                    const formattedChangedAt = changedAtISOLocal.replace("T", " ").replace("Z", "");
                    const timePart = formattedChangedAt.split(" ")[1];
                    const time = timePart.split('.')[0];
                    const datePart = formattedChangedAt.split(" ")[0];  
                    const [year, month, day] = datePart.split('-');
                    const date = [day, month, year].join('-');    
                    const reorderedChangedAt  = `${time} ${date}`;
                    results[index].received_at = reorderedChangedAt;
                  });
                }                 
              }
              io.emit('statistics', results);
            });
          }
        }
      });
    } 
    else if(topic.startsWith('ESP32/Device/')) {
      const deviceId = topic.split('/')[2]; 
      const state = message.toString(); 
      db.query('INSERT INTO device_status (device_id, state) VALUES (?, ?)', [deviceId, state], (err) => {
        if(err) {
          console.error('Error inserting data:', err);
        } else {
          console.log('Insert device status complete');
          io.emit('deviceStatus', { device_id: deviceId , state: state });

          let sql = 'SELECT * FROM device_status';
          const conditions = [];
          const values = [];
          if (currentFiltersDevice.deviceId && currentFiltersDevice.deviceId !== 'all') {
            conditions.push('device_id = ?');
            values.push(currentFiltersDevice.deviceId);
          }
          if (currentFiltersDevice.state && currentFiltersDevice.state !== 'all') {
              conditions.push('state = ?');
              values.push(currentFiltersDevice.state);
          }
          if (currentFiltersDevice.start) {
            conditions.push(" DATE(changed_at) >= ?");
            values.push(currentFiltersDevice.start);
          }
          if (currentFiltersDevice.end) {
              conditions.push(" DATE(changed_at) <= ?");
              values.push(currentFiltersDevice.end);
          }  
          if (conditions.length) {
              sql += ' WHERE ' + conditions.join(' AND ');
          }
          if (currentFiltersDevice.sortOrder === 'asc') {
              sql += ' ORDER BY changed_at ASC';
          } else {
              sql += ' ORDER BY changed_at DESC';
          }
          db.query(sql, values, (err, results) => {
            if (err) {
                console.error(err);
            } else {
              results.forEach((result, index) => {
                const changedAt = result.changed_at;
                const changedAtLocal = new Date(changedAt.getTime() - (changedAt.getTimezoneOffset() * 60000));
                const changedAtISOLocal = changedAtLocal.toISOString(); 
                const formattedChangedAt = changedAtISOLocal.replace("T", " ").replace("Z", "");
                const timePart = formattedChangedAt.split(" ")[1];
                const time = timePart.split('.')[0];
                const datePart = formattedChangedAt.split(" ")[0];  
                const [year, month, day] = datePart.split('-');
                const date = [day, month, year].join('-');    
                const reorderedChangedAt  = `${time} ${date}`;
                results[index].changed_at = reorderedChangedAt;
              });
              io.emit('deviceHistory', results);
            }
          });
        }
      });
    }
    else if(topic === "ESP32/curInterval"){
      const curInterval = message.toString();
      db.query('INSERT INTO intervals (interval_value) VALUES (?)', [curInterval], (err) => {
        if(err) {
          console.error('Error inserting data:', err);
        } else {
          console.log('Insert interval complete');
          io.emit('currentInterval', curInterval);  
        }
      });  
    }
  } catch (err) {
    console.error(err);
  }
});

app.get('/device/recently',(req,res) =>{
  const deviceSt = `SELECT
  (SELECT state FROM device_status WHERE device_id = 1 ORDER BY changed_at DESC LIMIT 1) AS device1St,
  (SELECT state FROM device_status WHERE device_id = 2 ORDER BY changed_at DESC LIMIT 1) AS device2St,
  (SELECT state FROM device_status WHERE device_id = 3 ORDER BY changed_at DESC LIMIT 1) AS device3St;`
  db.query(deviceSt , (err, results) => {
    if(err) {
      console.error('Error fetching device status', err);
    } else if(results.length > 0) {
      res.json(results);
    }
  });
});

app.get('/interval/recently',(req,res) =>{
  const intervalRec = `SELECT interval_value FROM intervals ORDER BY changed_at DESC LIMIT 1`
  db.query(intervalRec , (err, results) => {
    if(err) {
      console.error('Error fetching interval value', err);
    } else if(results.length > 0) {
      res.json(results);
    }
  });
});

app.get('/sensor/statistics', (req, res) => {
  let sql = '';
  const conditions = [];
  const values = [];
  
  if (req.query.startTime) {
    conditions.push("DATE(received_at) >= ?");
    values.push(req.query.startTime);
  }
  if (req.query.endTime) {
      conditions.push("DATE(received_at) <= ?");
      values.push(req.query.endTime);
  }  
  if (req.query.option == 'stats') {
    sql = `SELECT 
      MIN(temperature) AS min_temperature,
      MAX(temperature) AS max_temperature,
      ROUND(AVG(temperature), 2) AS avg_temperature,       
      MIN(humidity) AS min_humidity,
      MAX(humidity) AS max_humidity,
      ROUND(AVG(humidity), 2) AS avg_humidity,         
      MIN(brightness) AS min_brightness,
      MAX(brightness) AS max_brightness,
      ROUND(AVG(brightness), 2) AS avg_brightness,
      MIN(gas) AS min_gas,
      MAX(gas) AS max_gas,
      ROUND(AVG(gas), 2) AS avg_gas
      FROM sensor_data`;
    if (conditions.length) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
  } else if (req.query.option == 'search') {
    sql = 'SELECT * FROM sensor_data';
    let sortConditions = [];  
    if (['temperature', 'humidity', 'brightness','gas'].includes(req.query.attribute)&& req.query.value) {
      const delta = 0.08;  
      const minValue = parseFloat(req.query.value) - delta;
      const maxValue = parseFloat(req.query.value) + delta;
      const attributeCondition = `${req.query.attribute} BETWEEN ? AND ?`;
      conditions.push(attributeCondition);
      values.push(minValue, maxValue);
    } 
    if (conditions.length) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    if (req.query.sortT && req.query.sortT !== 'all') {
      sortConditions.push(`temperature ${req.query.sortT}`);
    }
    if (req.query.sortH && req.query.sortH !== 'all') {
        sortConditions.push(`humidity ${req.query.sortH}`);
    }
    if (req.query.sortB && req.query.sortB !== 'all') {
        sortConditions.push(`brightness ${req.query.sortB}`);
    }
    if (req.query.sortG && req.query.sortG !== 'all') {
      sortConditions.push(`gas ${req.query.sortG}`);
    }
    if (req.query.sortR && req.query.sortR !== 'all') {
        sortConditions.push(`received_at ${req.query.sortR}`);   
    }   
    if (sortConditions.length) {
        sql += ' ORDER BY ' + sortConditions.join(', ');
    }
  }
  db.query(sql, values, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
    } else {
      if (req.query.option === 'search') {
        results.forEach((result, index) => {
          const changedAt = result.received_at;
          const changedAtLocal = new Date(changedAt.getTime() - (changedAt.getTimezoneOffset() * 60000));
          const changedAtISOLocal = changedAtLocal.toISOString(); 
          const formattedChangedAt = changedAtISOLocal.replace("T", " ").replace("Z", "");
          const timePart = formattedChangedAt.split(" ")[1];
          const time = timePart.split('.')[0];
          const datePart = formattedChangedAt.split(" ")[0];  
          const [year, month, day] = datePart.split('-');
          const date = [day, month, year].join('-');    
          const reorderedChangedAt  = `${time} ${date}`;
          results[index].received_at = reorderedChangedAt;
        });
      }
      res.json(results);
    }
  });
});

app.get('/device/history', (req, res) => {
  let sql = 'SELECT * FROM device_status';
  const conditions = [];
  const values = [];
  if (req.query.deviceId && req.query.deviceId !== 'all') {
    conditions.push('device_id = ?');
    values.push(req.query.deviceId);
  }
  if (req.query.state && req.query.state !== 'all') {
    conditions.push('state = ?');
    values.push(req.query.state);
  }
  if (req.query.start) {
    conditions.push(" DATE(changed_at) >= ?");
    values.push(req.query.start);
  }
  if (req.query.end) {
    conditions.push(" DATE(changed_at) <= ?");
    values.push(req.query.end);
  } 
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  if (req.query.sortOrder === 'asc') {
    sql += ' ORDER BY changed_at ASC';
  } else {
    sql += ' ORDER BY changed_at DESC';
  }
  db.query(sql, values, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
    } else {
      results.forEach((result, index) => {
        const changedAt = result.changed_at;
        const changedAtLocal = new Date(changedAt.getTime() - (changedAt.getTimezoneOffset() * 60000));
        const changedAtISOLocal = changedAtLocal.toISOString(); 
        const formattedChangedAt = changedAtISOLocal.replace("T", " ").replace("Z", "");
        const timePart = formattedChangedAt.split(" ")[1];
        const time = timePart.split('.')[0];
        const datePart = formattedChangedAt.split(" ")[0];  
        const [year, month, day] = datePart.split('-');
        const date = [day, month, year].join('-');    
        const reorderedChangedAt  = `${time} ${date}`;
        results[index].changed_at = reorderedChangedAt;
      });
      res.json(results);
    }
  });
});

app.get('/data', (req, res) => {
  db.query('SELECT * FROM sensor_data ORDER BY received_at DESC LIMIT 20', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
      return;
    }
    results.forEach((result, index) => {
      const receivedAt = result.received_at;
      const receivedAtLocal = new Date(receivedAt.getTime() - (receivedAt.getTimezoneOffset() * 60000));
      const receivedAtISOLocal = receivedAtLocal.toISOString();
      const formattedReceivedAt = receivedAtISOLocal.replace("T", " ").replace("Z", "");
      const timePart = formattedReceivedAt.split(" ")[1];
      const time = timePart.split('.')[0];
      results[index].received_at = time;
    });
    res.json(results);
  });
});

app.get('/data/latest', (req, res) => {
  db.query('SELECT * FROM sensor_data ORDER BY id DESC LIMIT 1', (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      const receivedAt = results[0].received_at;
      const receivedAtLocal = new Date(receivedAt.getTime() - (receivedAt.getTimezoneOffset() * 60000));
      const receivedAtISOLocal = receivedAtLocal.toISOString(); 
      const formattedReceivedAt = receivedAtISOLocal.replace("T", " ").replace("Z", "");
      const timePart = formattedReceivedAt.split(" ")[1];
      const time = timePart.split('.')[0];         
    }
    res.json(results);
  });
});

app.get('/user_info', (req, res) => {
  db.query('SELECT * FROM user_info ORDER BY id DESC LIMIT 1;', (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Server error');
    } else {
      let dob = new Date(results[0].dob);
      let formattedDob = dob.toLocaleDateString('en-GB');
      results[0].dob = formattedDob;
      res.json(results); 
    }
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
