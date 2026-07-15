const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger'); // Import the Swagger configuration file

const path = require('path');

require("dotenv").config();

const app = express();
const PORT = 3000;
//app.use(express.static('public'));

// ✅ Add Middleware to Parse JSON and URL-encoded data
app.use(express.json());  // For JSON requests
app.use(express.urlencoded({ extended: true })); // For form data

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Declare a global db variable
let db;

async function connectToDatabase() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      port: process.env.PORT,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      enableKeepAlive: true, 
      keepAliveInitialDelay: 10000 
    });
    console.log('Connected to MySQL database');
  } catch (err) {
    console.error('Error connecting to MySQL:', err.message);
    throw err;
  }
}

const vendors = require('./routes/vendors_route');
const projects = require('./routes/projects_route');
const vendortype = require('./routes/vendortype_route');
const items = require('./routes/items_route');
const itemchoices = require('./routes/itemchoices_route');
const elements = require('./routes/elements_route');
const elementsitemsmapping = require('./routes/elementsitemsmapping_route');
const clientchoices = require('./routes/client_choices_route');
const itemselections = require('./routes/itemselections_route');
const defaultitemselections = require('./routes/default_item_selections_route');
const itempredefinedspecs = require('./routes/items_predefined_specs_route');
const itemarchinputs = require('./routes/items_arch_inputs_route');
const itemvendorpricing = require('./routes/item_vendor_pricing_route');
const tags = require('./routes/tags_route');
const element_tags = require('./routes/element_tags_route');
const element_tags_measurements = require('./routes/element_tags_measurements_route');


// Pass the database connection to the routes
app.use('/api', (req, res, next) => {
  req.db = db;
  next();
});

app.use('/api', vendors);
app.use('/api', projects);
app.use('/api', vendortype);
app.use('/api', items);
app.use('/api', itemchoices);
app.use('/api', elements);
app.use('/api', elementsitemsmapping);
app.use('/api', clientchoices);
app.use('/api', itemselections);
app.use('/api', defaultitemselections);
app.use('/api', itempredefinedspecs);
app.use('/api', itemarchinputs);
app.use('/api', itemvendorpricing);
app.use('/api', tags);
app.use('/api', element_tags);
app.use('/api', element_tags_measurements);

app.listen(PORT, async () => {
  await connectToDatabase();
  console.log(`Server running at http://localhost:${PORT}`);
  // console.log(`Server running at https://cspl.canaanspace.com/api/:${PORT}`);
});

// Close the database connection when the server shuts down
process.on('SIGINT', async () => {
  if (db) {
    await db.end();
    console.log('Database connection closed');
  }
  process.exit();
});
