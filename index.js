const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false })); // For parsing application/x-www-form-urlencoded
app.use(express.static('public'));
app.use(express.json()); // For parsing application/json

let users = []; // In-memory storage for users

// Function to generate a 24-character hexadecimal ID
function generateId() {
  return [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Create a new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;
  const newUser = { username, _id: generateId() };
  users.push(newUser);
  res.json(newUser);
});

// Get all users
app.get('/api/users', (req, res) => {
  // Map the users array to only include the desired fields
  const userList = users.map(user => {
    return {
      username: user.username,
      _id: user._id
    };
  });
  res.json(userList); // Return the mapped array
});
// Add an exercise to a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params._id;
  let { description, duration, date } = req.body;

  console.log('### ADD A NEW EXERCISE ###'.toUpperCase());

  // Check for date and set to current date if not provided
  if (!date) {
    date = new Date().toISOString().substring(0, 10); // Use ISO date format
  }

  console.log(`Looking for user with ID [${userId}] ...`);

  // Find the user by ID
  const user = users.find(u => u._id === userId);
  if (!user) {
    console.error('User not found');
    return res.json({ message: 'There are no users with that ID in the database!' });
  }

  // Create new exercise
  const newExercise = {
    userId: user._id,
    username: user.username,
    description,
    duration: parseInt(duration),
    date,
  };

  // If the user doesn't have an exercises array, initialize it
  if (!user.exercises) {
    user.exercises = [];
  }

  // Save the exercise
  user.exercises.push(newExercise);

  // Format the response
  res.json({
    username: user.username,
    description: newExercise.description,
    duration: newExercise.duration,
    date: new Date(newExercise.date).toDateString(), // Format the date
    _id: user._id,
  });
});


// Get exercise log for a user
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params._id;
  const user = users.find(u => u._id === userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let log = user.exercises || [];
  const { from, to, limit } = req.query;

  // Filter log by date range if specified
  if (from) {
    log = log.filter(ex => new Date(ex.date) >= new Date(from));
  }
  if (to) {
    log = log.filter(ex => new Date(ex.date) <= new Date(to));
  }
  if (limit) {
    log = log.slice(0, parseInt(limit));
  }

  // Format the log entries to have the desired output
  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log: log.map(ex => ({
      description: ex.description,
      duration: ex.duration,
      date: new Date(ex.date).toDateString(), // Format the date as "Mon Jan 01 1990"
    }))
  });
});


app.get('/api/users/all', (req, res) => {
  const allUsersInfo = users.map(user => {
    return {
      username: user.username,
      _id: user._id,
      exercises: user.exercises || [] // Include exercises if they exist
    };
  });
  res.json(allUsersInfo);
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
