require('dotenv').config();
const mongodb = require('./database/mongodb/db');
const userQuery = require('./database/mongodb/query');
const cors = require('cors');
mongodb.connectDB();

const uploadImage = require('./storage/s3');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });

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
const verifyToken = require('./middlewares/jwt');
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
    const isAdmin = false;
    const payload = { name, email, password, isAdmin }; // Untuk menyimpan ketiga variabel menjadi satu paket
    const user = await register(payload);

    userQuery.createUser(user).then((user) => {
      res.status(201).json({
        status: 'success',
        message: 'Register success',
        data: {}
      }); // Respond with the created user and status code 201
    });
  } catch (err) {
    console.error('Error POST Register:', err);
    res.status(400).json({
      status: 'error',
      message: 'Register error: ' + err.message,
      data: {}
    });
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

    if (checkEmail != null) {
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
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const payload = { email, password };
    const {token, isAdmin} = await login(payload, false); // Untuk nunggu sebentar saat lagi memproses
    res.status(200).json({
      status: 'success',
      message: 'Login success',
      data: {
        user: email,
        token: token,
        isAdmin: isAdmin
      }
    }); // Responds dan status yang dikirim, status bisa variatif tergantung message
  } catch (err) {
    console.error('Error POST Login:', err);
    res.status(400).json({
      status: 'error',
      message: 'Login error: ' + err.message,
      data: {}
    });
  }
});

app.get('/login/verify', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    const email = user.email;
    const password = user.password;
    const payload = { email, password };
    const { token, isAdmin } = await login(payload, true); // Untuk nunggu sebentar saat lagi memproses
    res.status(200).json({
      status: 'success',
      message: 'Login success',
      data: {
        user: email,
        token: token,
        isAdmin: isAdmin
      }
    }); // Responds dan status yang dikirim, status bisa variatif tergantung message
  } catch (err) {
    console.error('Error POST Verify Login:', err);
    res.status(400).json({
      status: 'error',
      message: 'Verify Login error: ' + err.message,
      data: {}
    });
  }
});

async function login(payload, ishashed) {
  try {
    const checkUser = await userQuery.findOneByEmail(payload.email);
    if (!checkUser || !checkUser.password) {
      throw new Error('Invalid email or password');
    }

    const user = {
      email: checkUser.email,
      password: checkUser.password,
      isAdmin: checkUser.isAdmin
    };

    const isValidPassword = ishashed ? (payload.password === checkUser.password) : bcrypt.compareSync(
      payload.password,
      checkUser.password
    );

    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    const key = process.env.JWT_SECRET || 'default_secret_key'; // Bikin secret key
    const token = jwt.sign(user, key, { expiresIn: '30m' }); // jwt.sign untuk ngasilin token
    return {
      token: token,
      isAdmin: user.isAdmin
    }; // Generate token
  } catch (err) {
    console.error('Error login: ', err);
    throw err;
  }
}

app.get('/inventories', async (req, res) => {
  try {
    const inventories = await userQuery.getAllInventories();

    if (!inventories || inventories.length === 0) {
      return res.status(404).json({
        status: 'success',
        message: 'No inventories found',
        data: {
          inventories: []
        }
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'GET inventories success',
      data: {
        inventories: inventories
      }
    });
  } catch (err) {
    console.error('Error GET Inventory:', err);
    res.status(400).json({
      status: 'error',
      message: 'Error GET Inventory: ' + err.message,
      data: {}
    });
  }
});

app.post('/inventories', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const { name, type, fuel, transmission, capacity, price, total, available } = req.body;

      const isValidInventory = ((name, type, fuel, transmission, capacity, price, total, available) => {
        return (
          name && name != null &&
          ['Skuter', 'Sport'].includes(type) &&
          req.file &&
          fuel && fuel > 0 &&
          ['Matic', 'Manual'].includes(transmission) &&
          capacity && capacity > 0 &&
          price && price > 0 &&
          total &&
          available
        )
      })(name, type, fuel, transmission, capacity, price, total, available);

      if (isValidInventory) {
        const image = await uploadImage(req.file);

        const savedInventory = await userQuery.createInventory({
          name,
          type,
          image,
          fuel,
          transmission,
          capacity,
          price,
          total,
          available
        });

        res.status(201).json({
          status: 'success',
          message: 'Inventory created successfully.',
          data: {
            inventories: savedInventory
          }
        });
      } else {
        res.status(400).json({
          status: 'error',
          message: 'Error POST Inventory: Invalid Inventory Data',
          data: {}
        })
      }
    } else {
      res.status(403).json({
        status: 'error',
        message: 'Error POST Inventory: Admin Privilege required',
        data: {}
      });
    }
  } catch (err) {
    console.error('Error POST Inventory:', err);
    if (["MimeTypeNotAllowed","ExtensionNotAllowed"].includes(err.name)) {
      res.status(422).json({
        status: 'error',
        message: 'Error POST Inventory: ' + err.message,
        data: {}
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Error POST Inventory: ' + err.message,
        data: {}
      });
    }
  }
});

app.put('/inventories/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const { id } = req.params;
      const inventories = req.body;

      const savedInventory = await userQuery.updateInventory(id, inventories);

      res.status(200).json({
        status: 'success',
        message: 'Inventory updated successfully.',
        data: {
          inventories: savedInventory
        }
      });
    } else {
      res.status(403).json({
        status: 'error',
        message: 'Error PUT Inventory: Admin Privilege required',
        data: {}
      });
    }
  } catch (err) {
    console.error('Error PUT Inventory:', err);
    res.status(400).json({
      status: 'error',
      message: 'Error PUT Inventory: ' + err.message,
      data: {}
    });
  }
});

app.get('/orders', verifyToken, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const orders = await userQuery.getAllOrders();

      if (!orders || orders.length === 0) {
        return res.status(404).json({
          status: 'success',
          message: 'No orders found',
          data: {
            orders: []
          }
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'GET Orders success',
        data: {
          orders: orders
        }
      });
    } else {
      const orders = await userQuery.findOrderByEmail(req.user.email);

      if (!orders || orders.length === 0) {
        return res.status(404).json({
          status: 'success',
          message: 'No orders found',
          data: {
            orders: []
          }
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'GET Orders success',
        data: {
          orders: orders.orderStatus
        }
      });
    }
  } catch (err) {
    console.error('Error GET Order: ', err);
    res.status(400).json({
      status: 'error',
      message: 'Error GET Order: ' + err.message,
      data: {}
    });
  }
});

app.post('/orders', verifyToken, upload.single('ktpImage'), async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      const email = req.user.email;
      const { phone, startDate, endDate, motorId } = req.body;

      if (!email || !phone || !startDate || !endDate || !req.file || !motorId) {
        let invalidItems = [];
        if (!email) {invalidItems.push("email")}
        else if (!phone) {invalidItems.push("phone")}
        else if (!startDate) {invalidItems.push("startDate")}
        else if (!endDate) {invalidItems.push("endDate")}
        else if (!req.file) {invalidItems.push("ktpImage")}
        else if (!motorId) {invalidItems.push("motorId")}
        return res.status(400).json({
          status: 'error',
          message: `Error POST Order: Invalid Order Data (${invalidItems.join(", ")})`,
          data: {}
        });
      }

      const inventory = await userQuery.getInventoryById(motorId);

      if (!inventory) {
        return res.status(400).json({
          status: 'error',
          message: 'Error POST Order: motorId not found!',
          data: {}
        });
      }

      if (inventory.available == 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Error POST Order: no more available vehicle for requested motorId',
          data: {}
        });
      }

      const imageURL = await uploadImage(req.file);

      // Periksa apakah email sudah ada di database
      const existingOrder = await userQuery.findOrderByEmail(email);

      const newOrderStatus = { 
        phoneNumber: phone,
        idCard: imageURL,
        orderDate: new Date(),
        paymentDate: null,
        paymentStatus: "uncomplete",
        takenDate: startDate,
        takenStatus: "untaken",
        returnDate: endDate,
        returnStatus: "unreturned",
        motorId: motorId
      }

      if (existingOrder) {
        // Jika email sudah ada, tambahkan orderStatus baru ke array
        existingOrder.orderStatus.push(newOrderStatus);
        const updatedOrder = await existingOrder.save();

        return res.status(200).json({
          status: 'success',
          message: 'Order status added successfully.',
          data: {
            order: updatedOrder
          }
        });
      }

      // Jika email belum ada, buat order baru
      const savedOrder = await userQuery.createOrder(email, newOrderStatus);

      inventory.available = inventory.available - 1;
      const updatedInventory = await userQuery.updateInventory(motorId, inventory);

      res.status(201).json({
        status: 'success',
        message: 'Order created successfully.',
        data: {
          order: savedOrder
        }
      });
    } else {
      res.status(403).json({
        status: 'error',
        message: 'Error POST Order: Admin cannot make order',
        data: {}
      });
    }
  } catch (err) {
    console.error('Error POST Order:', err);
    if (["MimeTypeNotAllowed","ExtensionNotAllowed"].includes(err.name)) {
      res.status(422).json({
        status: 'error',
        message: 'Error POST Inventory: ' + err.message,
        data: {}
      })
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Error POST Inventory: ' + err.message,
        data: {}
      });
    }
  }
});

app.put('/orders/:id/paidstatus', verifyToken, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const { id } = req.params; // _id nya orderStatus
      const updatedOrder = await userQuery.updatePaymentStatusByOrderStatusId(id);

      if (!updatedOrder) {
        return res.status(200).json({
          status: 'success',
          message: 'Order status not found',
          data: {}
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Payment status updated to completed',
        data: {
          order: updatedOrder
        }
      });
    } else {
      res.status(403).json({
        status: 'error',
        message: 'Error PUT Order: Admin Privilege required',
        data: {}
      });
    }
  } catch (err) {
    console.error('Error updating payment status:', err);
    res.status(400).json({
      status: 'error',
      message: 'Internal Server Error: ' + err.message,
      data: {}
    });
  }
});

app.put('/orders/:id/takenstatus', verifyToken, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const { id } = req.params;
      const updatedOrder = await userQuery.updateTakenStatusByOrderStatusId(id);

      if (!updatedOrder) {
        return res.status(200).json({
          status: 'success',
          message: 'Order status not found',
          data: {}
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Taken status updated to taken',
        data: {
          order: updatedOrder
        }
      });
    } else {
      res.status(403).json({
        status: 'error',
        message: 'Error PUT Order: Admin Privilege required',
        data: {}
      });
    }
  } catch (err) {
    console.error('Error updating taken status:', err);
    res.status(400).json({
      status: 'error',
      message: 'Internal Server Error' + err.message,
      data: {}
    });
  }
});

app.put('/orders/:id/returnedstatus', verifyToken, async (req, res) => {
  try {
    if (req.user.isAdmin) {
      const { id } = req.params;
      const updatedOrder = await userQuery.updateReturnStatusByOrderStatusId(id);

      if (!updatedOrder) {
        return res.status(404).json({ 
          status: 'success',
          message: 'Order status not found',
          data: {}
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Return status updated to returnedupdatedOrder',
        data: {
          order: updatedOrder
        }
      });
    } else {
      res.status(403).json({
        status: 'error',
        message: 'Error PUT Order: Admin Privilege required',
        data: {}
      });
    }
  } catch (err) {
    console.error('Error updating return status:', err);
    res.status(400).json({ 
      status: 'success',
      message: 'Internal Server Error' + err.message,
      data: {}
    });
  }
});


app.get('/payment/:id/barcode', verifyToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      const { id } = req.params;
      // Use the query function to find the matched orderStatus
      const result = await userQuery.findOneByOrderId(id);

      if (!result) {
        return res.status(404).json({
          status: 'error',
          message: 'Error GET Payment: Order not found',
          data: {}
        });
      }

      if (result.userEmail != req.user.email) {
        console.error(`Error GET Payment: result.userEmail (${result.userEmail}) and req.user.email (${req.user.email}) not matched`);
        return res.status(403).json({
          status: 'error',
          message: 'Error GET Payment: Unauthorized',
          data: {}
        });
      }

      const { matchedOrderStatus } = result;

      // Generate the barcode link
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const barcodeLink = `${baseUrl}/payment/${id}/pay`;

      res.status(200).json({
        status: 'success',
        message: 'Barcode link generated successfully',
        data: {
          order: matchedOrderStatus,
          payment_url: barcodeLink
        },
      });
    } else {
      res.status(403).json({
        status: 'error',
        message: 'Error GET Payment: Only customer can access payment',
        data: {}
      });
    }
  } catch (err) {
    console.error("Error GET Payment: ", err);
    res.status(400).json({
      status: 'error',
      message: 'Error GET Payment: ' + err.message,
      data: {}
    });
  }
});

// PUT /payment/:id/pay endpoint
app.put('/payment/:id/pay', verifyToken, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      const { id } = req.params;

      const order = await userQuery.findOneByOrderId(id);

      if (!order) {
        return res.status(404).json({
          status: 'error',
          message: 'Error PUT Payment: Order not found',
          data: {}
        });
      }

      if (order.userEmail != req.user.email) {
        return res.status(403).json({
          status: 'error',
          message: 'Error PUT Payment: Unauthorized',
          data: {}
        });
      }

      const updatedOrder = await userQuery.updatePaymentStatusByOrderStatusId(id);

      if (!updatedOrder) {
        return res.status(404).json({
          status: 'error',
          message: 'Error PUT Payment: Order not found',
          data: {}
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'Payment status updated to completed',
        data: {
          order: updatedOrder
        },
      });
    } else {
      res.status(403).json({
        status: 'error',
        message: 'Error PUT Payment: Only customer can access payment',
        data: {}
      });
    }
  } catch (err) {
    console.error("Error PUT Payment: ", err);
    res.status(400).json({
      status: 'error',
      message: 'Error PUT Payment: ' + err.message,
      data: {}
    });
  }
});