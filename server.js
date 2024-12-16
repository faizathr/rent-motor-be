require('dotenv').config();
const mongodb = require('./database/mongodb/db');
const userQuery = require('./database/mongodb/query');
const cors = require('cors');
mongodb.connectDB();

// Import the express module to create and configure the HTTP server
const express = require('express');
// Import the body-parser middleware to parse incoming request bodies
const bodyParser = require('body-parser');
// Initialize an Express application
const app = express();
app.use(cors());
// Define the port number on which the server will listen
const PORT = 8080;
// Import the bcrypt module for password hashing
const bcrypt = require('bcrypt');

// Import the jwt module for authentication and authorization checks
const jwt = require('jsonwebtoken');
// Import the verifyToken middleware to authenticate JWT tokens
//const verifyToken = require('./middlewares/jwt');
// Import the passport middleware to authenticate and configure the passport authentication
// const { initializePassport, authenticatePassportJwt } = require('./middlewares/passport-jwt');
// Initialize Passport
//app.use(initializePassport());

// Middleware to verify JWT tokens

// Initialize an array to store user data
let users = [];

// Middleware to parse JSON bodies
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Start the server and listen on the defined port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Route to login user
app.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const payload = { email, password };
    const token = await login(payload); // Untuk nunggu sebentar saat lagi memproses
    res.status(200).json({ message: 'Success login!', token }); // Responds dan status yang dikirim, status bisa variatif tergantung message
  } catch (err) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  }
});

app.post('/register', async (req, res) => {
  // Async untuk concurrency, request dan responds
  try {
    const { name, email, password } = req.body; // Nerima dari frontend
    const payload = { name, email, password }; // Untuk menyimpan ketiga variabel menjadi satu paket
    const user = await register(payload);

    userQuery.createUser(user).then((user) => {
      res.status(201).json({ message: 'Register success' }); // Respond with the created user and status code 201
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: 'Register ' + error });
  }
});



async function register(payload) {
  try {
    // const test = await userQuery.getUsers()
    // console.log(test);
    // console.log(payload);
    const checkEmail = await userQuery.findOneByEmail(payload.email);
    const checkUser = await userQuery.findByName(payload.name);
    const allowedDomains = ['.com', '.org', '.net', '.ac.id', '.co.uk'];

    const isValid = allowedDomains.some((domain) =>
      payload.email.endsWith(domain)
    );

    if (!isValid) {
      throw new Error('Email tidak valid');
    }

    if (!payload.email.includes('@')) {
      throw new Error('Email not valid');
    }

    if (checkEmail.length != 0 && checkEmail) {
      console.log(checkEmail);
      throw new Error('You already have an account, please log in!');
    }

    // if (checkUser && checkUser.length !=0) {
    //   throw new Error("Username unavailable, please choose other username");
    // }

    if (payload.password.length < 8) {
      throw new Error('Minimal 8 character, please re-generate the password');
    }

    // payload.password = await bcrypt.hash(payload.password, 10);

    return payload;
  } catch (error) {
    console.error('Error register', error);
    throw error;
  }
}

async function login(payload) {
  try {
    const checkUser = await userQuery.findOneByEmail(payload.email);
    if (!checkUser) {
      throw new Error('Invalid email or password');
    }
    const user = {
      email: checkUser.email,
      password: checkUser.password,
    };
    const isValidPassword = bcrypt.compareSync(
      payload.password,
      checkUser[0].password
    ); // Check pass dengan db udah sama atau ga
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }
    const key = process.env.JWT_SECRET || 'default_secret_key'; // Bikin secret key
    const token = jwt.sign(user, key, { expiresIn: '30m' }); // jwt.sign untuk ngasilin token
    return token; // Generate token
  } catch (error) {
    console.error('Error login: ', error);
    throw error;
  }
}
