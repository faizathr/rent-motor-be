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

// Route to GET all users - returns the users array as JSON
app.get('/users', (req, res) => {
  userQuery.getUsers().then((users) => {
    res.json(users);
  });
});

// Route to POST a new user - adds a new user to the users array
app.post('/users', (req, res) => {
  const user = req.body; // Extract the user from the request body
  console.log(req);
  userQuery.createUser(user).then((user) => {
    res.status(201).json(user); // Respond with the created user and status code 201
  });
});

// Route to PUT (update) a user by id
app.put('/users/:id', (req, res) => {
  const { id } = req.params; // Extract the id from the request parameters
  const user = req.body; // Extract the updated user from the request body
  userQuery.updateUser(id, user).then((user) => {
    res.status(200).json(user); // Respond with the updated user
  });
});

// Route to DELETE a user by id
app.delete('/users/:id', (req, res) => {
  const { id } = req.params; // Extract the id from the request parameters
  userQuery.deleteUser(id).then(() => {
    res.status(204).send(); // Respond with no content and status code 204
  });
});

// Route to search users by name
app.get('/users/search', (req, res) => {
  const { name } = req.query; // Extract the name query parameter

  // Check if the name query parameter is provided
  if (!name) {
    return res
      .status(400)
      .send({ message: 'Name query parameter is required' });
  }
  userQuery.findByName(name).then((users) => {
    res.status(200).json(users); // Respond with the filtered users
  });
});
app.get('/register', (req, res) => {
  userQuery.getUsers().then((users) => {
    res.json(users);
  });
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

app.put('/user/blast-now', async (req, res) => {
  try {
    const {
      title,
      caption,
      channel,
      date,
      createdDate,
      totalBroadcast,
      status,
    } = req.body;

    // Mendapatkan waktu GMT saat ini
    const localCreatedDate = new Date();
    const offsetHours = localCreatedDate.getTimezoneOffset() / 60;
    const gmtCreatedDate = new Date(
      localCreatedDate.getTime() - offsetHours * 60 * 60 * 1000
    );

    const payload = {
      title,
      caption,
      channel,
      date: new Date(date), // Memastikan payload.date adalah waktu GMT
      createdDate: gmtCreatedDate,
      totalBroadcast,
      status: 'Finish',
    };

    const broadcast = await blastNow(payload);

    const broadcastBlast = {
      title,
      caption,
      channel,
      date: gmtCreatedDate, // Memastikan payload.date adalah waktu GMT
      createdDate: gmtCreatedDate,
      totalBroadcast,
      status: 'Finish',
    };

    userQuery.createBroadcast(broadcastBlast).then((broadcastBlast) => {
      res
        .status(202)
        .json({ message: 'Success blast broadcast!', broadcastBlast });
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: 'Blast broadcast ' + error });
  }
});

async function blastNow(payload) {
  try {
    // Mendapatkan waktu GMT saat ini
    const localCreatedDate = new Date();
    const gmtCreatedDate = new Date(localCreatedDate.toISOString()); // Mengonversi ke GMT

    console.log('ISO Format:', gmtCreatedDate.toISOString());
    console.log('Payload Date:', payload.date.toISOString());

    if (payload.date <= gmtCreatedDate) {
      throw new Error('Broadcast already finished!');
    }

    return payload;
  } catch (error) {
    console.error('Error register', error);
    throw error;
  }
}

app.post('/user/create', async (req, res) => {
  // Async untuk concurrency, request dan responds
  try {
    const {
      title,
      caption,
      channel,
      date,
      media,
      createdDate,
      totalBroadcast,
      status,
    } = req.body; // Nerima dari frontend
    const localCreatedDate = new Date();

    // Menghitung offset GMT dalam jam
    const offsetHours = localCreatedDate.getTimezoneOffset() / 60;

    // Menambahkan offset GMT ke waktu lokal
    const gmtCreatedDate = new Date(
      localCreatedDate.getTime() - offsetHours * 60 * 60 * 1000
    );

    console.log(localCreatedDate);
    const payload = {
      title,
      caption,
      channel,
      date,
      media,
      createdDate: gmtCreatedDate,
      totalBroadcast,
      status: 'Pending',
    };
    const broadcast = await upBlast(payload);
    userQuery.createBroadcast(broadcast).then((broadcast) => {
      res
        .status(202)
        .json({ message: 'Success create new broadcast!', broadcast });
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: 'Create new broadcast ' + error });
  }
});

// Route to PUT (update) a user by id
app.put('/users/create', (req, res) => {
  const {title, caption, channel, date, createdDate, totalBroadcast, status,} = req.params; // Extract the id from the request parameters
  const content = req.body; // Extract the updated user from the request body
  userQuery.updateUser(content).then((content) => {
    res.status(200).json(content); // Respond with the updated user
  });
});

// Route to DELETE a user by id
app.delete('/users/blast-now', (req, res) => {
  const {title, caption, channel, date, createdDate, totalBroadcast, status,} = req.params; 
  userQuery.deleteUser(id).then(() => {
    res.status(204).send(); // Respond with no content and status code 204
  });
});


app.get('/user/create', async (req, res) => {
  try {
    await updateBroadcastStatus();

    // Fetch the broadcasts and return them
    const broadcasts = await userQuery.getBroadcasts();
    res.json(broadcasts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Failed to get broadcasts' + error });
  }
});

app.get('/broadcasts/history', async (req, res) => {
  try {
    // Call the status update function first
    await updateBroadcastStatus();

    // Then fetch the updated broadcasts and send them to the frontend
    const broadcasts = await userQuery.getBroadcasts();
    res.status(200).json(broadcasts);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error fetching broadcasts' });
  }
});

async function updateBroadcastStatus() {
  const now = new Date();
  const broadcasts = await userQuery.getBroadcasts(); // Query all broadcasts
  broadcasts.forEach(async (broadcast) => {
    if (broadcast.date < now && broadcast.status !== 'Finish') {
      // If the broadcast date has passed and status is not "finish", update it
      broadcast.status = 'Finish';
      await broadcast.save();
    }
  });
}

// False Condition Upcoming Blast :
// 1. Kalau title belum terisi
// 2. Kalau caption belum terisi
// 3. Kalau channel belum terpilih
// 4. Kalau datenya kurang dari hari itu
// 5. Kalau timenya kurang dari hari itu
// 6. Kalau total broadcast kurang dari sama dengan 0

async function upBlast(payload) {
  try {
    // const checkTitle = await userQuery.findOneByTitle(payload.title);
    // const checkCaption = await userQuery.findOneByCaption(payload.caption);
    // const checkChannel = await userQuery.findOneByChannel(payload.channel);
    // const checkTime = await userQuery.findOneByTime(payload.time);
    // const checkDate = await userQuery.findOneByEmail(payload.date);
    // const checkBroadcast = await userQuery.findOneByTotalBroadcast(payload.broadcast);
    const now = new Date(); // Mendeklarasikan now sebagai waktu saat ini
    // const inputTime = new Date(`${payload.date}T${payload.time}`); // Menggabungkan date dan time menjadi satu objek Date

    // Format lengkap dalam ISO format
    const dateTimeISO = now.toISOString(); // Contoh: "2024-09-12T15:30:00.000Z"

    console.log('ISO Format:', dateTimeISO);

    if (payload.date >= dateTimeISO) {
      if (payload.date < dateTimeISO) {
        throw new Error('The time cannot be less than the current time!');
      }
    } else {
      throw new Error('The date cannot be earlier than today!');
    }

    if (payload.title.length == 0) {
      throw new Error('Title has not been filled!');
    }
    if (payload.caption.length == 0) {
      throw new Error('Caption has not been filled!');
    }
    if (payload.channel.length == 0) {
      throw new Error('Channel has not been filled!');
    }
    if (payload.totalBroadcast == null) {
      throw new Error('Broadcast has not been filled!');
    }
    if (payload.totalBroadcast <= 0) {
      throw new Error('Broadcast invalid!');
    }

    return payload;
  } catch (error) {
    console.error('Error register', error);
    throw error;
  }
}

// False Condition Register :
// 1. Kalau password tidak memenuhi kriteria
// 2. Kalau email sudah ada dalam database
// 3. Kalau username tidak unik
// 4. Kalau email tidak valid

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

// // Route to GET all orders - returns the orders array as JSON
// app.get('/orders', verifyToken, (req, res) => {
//   userQuery.getOrders().then((orders) => {
//     res.json(orders);
//   });
// });

// // Route to POST a new order - adds a new order to the orders array
// app.post('/orders', verifyToken, (req, res) => {
//   const order = req.body; // Extract the order from the request body
//   userQuery.createOrder(order).then((order) => {
//     res.status(201).json(order); // Respond with the created order and status code 201
//   });
// });

// // Route to PUT (update) an order by id
// app.put('/orders/:id', (req, res) => {
//   const { id } = req.params; // Extract the id from the request parameters
//   const order = req.body; // Extract the updated order from the request body
//   userQuery.updateOrder(id, order).then((order) => {
//     res.status(200).json(order); // Respond with the updated order
//   });
// });

// // Route to DELETE an order by id
// // app.delete('/orders/:id', authenticatePassportJwt(), (req, res) => {
// //   const { id } = req.params; // Extract the id from the request parameters
// //   userQuery.deleteOrder(id).then(() => {
// //     res.status(204).send(); // Respond with no content and status code 204
// //   });
// // });

// // Route to search orders by status
// app.get('/orders/search', (req, res) => {
//   const { status } = req.query; // Extract the status query parameter

//   // Check if the status query parameter is provided
//   if (!status) {
//     return res.status(400).send({ message: "Status query parameter is required" });
//   }
//   userQuery.findByStatus(status).then((orders) => {
//     res.status(200).json(orders); // Respond with the filtered orders
//   });
// });

// // Route to find an order by orderId
// app.get('/orders/:orderId', (req, res) => {
//   const { orderId } = req.params; // Extract the orderId from the request parameters
//   userQuery.findOneByOrderId(orderId).then((order) => {
//     res.status(200).json(order); // Respond with the found order
//   });
// });

// // Route to login user
// app.post("/user/login", async (req, res) => {
//   try{
//     const{email, password} = req.body;
//     const payload = { email, password };
//     // const token = await login(payload);
//     res.status(200).json({ message: "Success login", token});
//   } catch (err){
//     res.status(500).json({ error: 'Internal Server Error', message: err.message});
//   }
// });

// // async function login(payload){
// //   try{
// //     const checkUser = await userQuery.findOneByEmail(payload.email);
// //     if(!checkUser){
// //       throw new Error('Invalid email or password');
// //     }
// //     const user = {
// //       userId: checkUser.user_id,
// //       email: checkUser.email,
// //       password: checkUser.password
// //     };
// //     const isValidPassword = bcrypt.compareSync(payload.password, user.password);
// //     if(!isValidPassword){
// //       throw new Error('Invalid email or password');
// //     }
// //     const key = process.env.JWT_SECRET || 'default_secret_key';
// //     const token = jwt.sign(user, key, { expiresIn: '30m'});
// //     return token;
// //   } catch (error){
// //       console.error('Error login: '. error);
// //       throw error;
// //   }
// // }
