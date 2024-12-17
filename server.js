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
const router = express.Router(); // Initialize the router

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

    // if (checkEmail.length != 0 && checkEmail) {
    //   console.log(checkEmail);
    //   throw new Error('You already have an account, please log in!');
    // }

    if (checkEmail && checkEmail.length > 0) {
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

async function login(payload) {
  try {
    const checkUser = await userQuery.findOneByEmail(payload.email);
    if (!checkUser || !checkUser.password) {
      throw new Error('Invalid email or password');
    }

    const user = {
      email: checkUser.email,
      password: checkUser.password,
    };

    const isValidPassword = bcrypt.compareSync(
      payload.password,
      checkUser.password
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

app.post('/orders', async (req, res) => {
  try {
    const { email, orderStatus } = req.body;

    if (!email || !orderStatus || !Array.isArray(orderStatus)) {
      return res.status(400).json({
        message: 'Invalid input: "email" and "orderStatus" are required, and "orderStatus" must be an array.'
      });
    }

    // Validasi setiap entri dalam orderStatus
    const isValidOrderStatus = orderStatus.every((status) => {
      return (
        status.orderDate &&
        status.takenDate &&
        status.returnDate &&
        ['completed', 'uncomplete'].includes(status.paymentStatus) &&
        ['taken', 'untaken'].includes(status.takenStatus) &&
        ['returned', 'unreturned'].includes(status.returnStatus)
      );
    });

    if (!isValidOrderStatus) {
      return res.status(400).json({
        message: 'Invalid orderStatus: Each entry must have valid dates and statuses.'
      });
    }

    // Periksa apakah email sudah ada di database
    const existingOrder = await userQuery.findOrderByEmail(email);

    if (existingOrder) {
      // Jika email sudah ada, tambahkan orderStatus baru ke array
      existingOrder.orderStatus.push(...orderStatus);
      const updatedOrder = await existingOrder.save();

      return res.status(200).json({
        message: 'Order status added successfully.',
        order: updatedOrder,
      });
    }

    // Jika email belum ada, buat order baru
    const savedOrder = await userQuery.createOrder(email, orderStatus);

    res.status(201).json({
      message: 'Order created successfully.',
      order: savedOrder,
    });
  } catch (error) {
    console.error('Error creating order:', error);

    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
});

app.put('/orders/:id/paidstatus', async (req, res) => {
  try {
    const { id } = req.params; // _id nya orderStatus
    const updatedOrder = await userQuery.updatePaymentStatusByOrderStatusId(id);

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order status not found' });
    }

    res.status(200).json({
      message: 'Payment status updated to completed',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

app.put('/orders/:id/takenstatus', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrder = await userQuery.updateTakenStatusByOrderStatusId(id);

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order status not found' });
    }

    res.status(200).json({
      message: 'Taken status updated to taken',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating taken status:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

app.put('/orders/:id/returnedstatus', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrder = await userQuery.updateReturnStatusByOrderStatusId(id);

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order status not found' });
    }

    res.status(200).json({
      message: 'Return status updated to returned',
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating return status:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

app.get('/orders', async (req, res) => {
  try {
    const orders = await userQuery.getAllOrders();

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found.' });
    }

    res.status(200).json({
      message: 'Orders fetched successfully.',
      orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
});

app.get('/orders/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const order = await userQuery.getOrderById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    res.status(200).json({
      message: 'Order fetched successfully.',
      order,
    });
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
    });
  }
});
