const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: API for managing employees
 */

/**
 * @swagger
 * /employees:
 *   get:
 *     tags: [Employees]
 *     description: Retrieve all employees from the employees table
 *     responses:
 *       200:
 *         description: List of employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   employee_id:
 *                     type: integer
 *                   first_name:
 *                     type: string
 *                   last_name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   employee_code:
 *                     type: string
 *                   designation:
 *                     type: string
 *                   department:
 *                     type: string
 *                   role:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: ['Active', 'On Leave', 'Terminated', 'Resigned']
 *       500:
 *         description: Internal server error
 */

// Get all employees
router.get('/', async (req, res) => {
  const db = req.db; // Access the global db object passed in middleware
  try {
    // Correctly access the rows property from the query result
    const result = await db.query('SELECT * FROM employees ORDER BY last_name, first_name');
    const rows = result.rows;

    res.json(rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     tags: [Employees]
 *     description: Retrieve a specific employee by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the employee to retrieve
 *     responses:
 *       200:
 *         description: Employee details
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */

// Get employee by ID
router.get('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM employees WHERE employee_id = $1', [id]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               employee_code:
 *                 type: string
 *               designation:
 *                 type: string
 *               department:
 *                 type: string
 *               role:
 *                 type: string
 *               reporting_manager_id:
 *                 type: integer
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: ['Active', 'On Leave', 'Terminated', 'Resigned']
 *               join_date:
 *                 type: string
 *                 format: date
 *               termination_date:
 *                 type: string
 *                 format: date
 *               username:
 *                 type: string
 *               password_hash:
 *                 type: string
 *               salary:
 *                 type: number
 *               salary_currency:
 *                 type: string
 *               document_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               profile_image_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: First name, last name, and email are required
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res) => {
  const db = req.db;
  const {
    first_name,
    last_name,
    email,
    phone,
    employee_code,
    designation,
    department,
    role,
    reporting_manager_id,
    date_of_birth,
    gender,
    address,
    city,
    state,
    postal_code,
    country,
    status,
    join_date,
    termination_date,
    username,
    password_hash,
    salary,
    salary_currency,
    document_ids,
    profile_image_url
  } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: "First name, last name, and email are required" });
  }

  try {
    const query = `
      INSERT INTO employees (
        first_name, last_name, email, phone, employee_code, designation, department,
        role, reporting_manager_id, date_of_birth, gender, address, city, state,
        postal_code, country, status, join_date, termination_date, username,
        password_hash, salary, salary_currency, document_ids, profile_image_url
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
             $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *
    `;
    
    const values = [
      first_name,
      last_name,
      email,
      phone || null,
      employee_code || null,
      designation || null,
      department || null,
      role || null,
      reporting_manager_id || null,
      date_of_birth || null,
      gender || null,
      address || null,
      city || null,
      state || null,
      postal_code || null,
      country || 'India',
      status || 'Active',
      join_date || null,
      termination_date || null,
      username || null,
      password_hash || null,
      salary || null,
      salary_currency || 'INR',
      document_ids || null,
      profile_image_url || null
    ];

    const result = await db.query(query, values);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    if (err.code === '23505') {
      // Check which unique constraint was violated
      if (err.detail.includes('email')) {
        return res.status(400).json({ error: "Email address already in use" });
      } else if (err.detail.includes('employee_code')) {
        return res.status(400).json({ error: "Employee code already in use" });
      } else if (err.detail.includes('username')) {
        return res.status(400).json({ error: "Username already in use" });
      }
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: Update an existing employee by ID
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the employee to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               employee_code:
 *                 type: string
 *               designation:
 *                 type: string
 *               department:
 *                 type: string
 *               role:
 *                 type: string
 *               reporting_manager_id:
 *                 type: integer
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: ['Active', 'On Leave', 'Terminated', 'Resigned']
 *               join_date:
 *                 type: string
 *                 format: date
 *               termination_date:
 *                 type: string
 *                 format: date
 *               username:
 *                 type: string
 *               password_hash:
 *                 type: string
 *               salary:
 *                 type: number
 *               salary_currency:
 *                 type: string
 *               document_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               profile_image_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       400:
 *         description: First name, last name, and email are required
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const {
    first_name,
    last_name,
    email,
    phone,
    employee_code,
    designation,
    department,
    role,
    reporting_manager_id,
    date_of_birth,
    gender,
    address,
    city,
    state,
    postal_code,
    country,
    status,
    join_date,
    termination_date,
    username,
    password_hash,
    salary,
    salary_currency,
    document_ids,
    profile_image_url
  } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: "First name, last name, and email are required" });
  }

  try {
    const query = `
      UPDATE employees 
      SET 
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        employee_code = $5,
        designation = $6,
        department = $7,
        role = $8,
        reporting_manager_id = $9,
        date_of_birth = $10,
        gender = $11,
        address = $12,
        city = $13,
        state = $14,
        postal_code = $15,
        country = $16,
        status = $17,
        join_date = $18,
        termination_date = $19,
        username = $20,
        password_hash = $21,
        salary = $22,
        salary_currency = $23,
        document_ids = $24,
        profile_image_url = $25,
        updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $26
      RETURNING *
    `;
    
    const values = [
      first_name,
      last_name,
      email,
      phone || null,
      employee_code || null,
      designation || null,
      department || null,
      role || null,
      reporting_manager_id || null,
      date_of_birth || null,
      gender || null,
      address || null,
      city || null,
      state || null,
      postal_code || null,
      country || 'India',
      status || 'Active',
      join_date || null,
      termination_date || null,
      username || null,
      password_hash || null,
      salary || null,
      salary_currency || 'INR',
      document_ids || null,
      profile_image_url || null,
      id
    ];

    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    if (err.code === '23505') {
      // Check which unique constraint was violated
      if (err.detail.includes('email')) {
        return res.status(400).json({ error: "Email address already in use" });
      } else if (err.detail.includes('employee_code')) {
        return res.status(400).json({ error: "Employee code already in use" });
      } else if (err.detail.includes('username')) {
        return res.status(400).json({ error: "Username already in use" });
      }
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Delete an employee by ID
 *     tags: [Employees]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the employee to delete
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;

  try {
    const result = await db.query(
      "DELETE FROM employees WHERE employee_id = $1 RETURNING employee_id", 
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }
    
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error('Database error:', err.message);
    if (err.code === '23503') {
      // Foreign key constraint violation
      return res.status(400).json({ 
        error: "Cannot delete employee because they are referenced in other tables",
        details: "This employee may be a project manager or supervisor for other employees"
      });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /employees/department/{department}:
 *   get:
 *     tags: [Employees]
 *     description: Retrieve employees by department
 *     parameters:
 *       - in: path
 *         name: department
 *         required: true
 *         schema:
 *           type: string
 *         description: The department to retrieve employees from
 *     responses:
 *       200:
 *         description: List of employees in the specified department
 *       500:
 *         description: Internal server error
 */
router.get('/department/:department', async (req, res) => {
  const db = req.db;
  const { department } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM employees WHERE department = $1 ORDER BY last_name, first_name", 
      [department]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /employees/status/{status}:
 *   get:
 *     tags: [Employees]
 *     description: Retrieve employees by status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: ['Active', 'On Leave', 'Terminated', 'Resigned']
 *         description: The status to filter employees by
 *     responses:
 *       200:
 *         description: List of employees with the specified status
 *       500:
 *         description: Internal server error
 */
router.get('/status/:status', async (req, res) => {
  const db = req.db;
  const { status } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM employees WHERE status = $1 ORDER BY last_name, first_name", 
      [status]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /employees/manager/{managerId}:
 *   get:
 *     tags: [Employees]
 *     description: Retrieve all employees reporting to a specific manager
 *     parameters:
 *       - in: path
 *         name: managerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the manager
 *     responses:
 *       200:
 *         description: List of employees reporting to the specified manager
 *       500:
 *         description: Internal server error
 */
router.get('/manager/:managerId', async (req, res) => {
  const db = req.db;
  const { managerId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT * FROM employees WHERE reporting_manager_id = $1 ORDER BY last_name, first_name", 
      [managerId]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /employees/search:
 *   get:
 *     tags: [Employees]
 *     description: Search for employees by name or email
 *     parameters:
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *         description: Search term for employee name or email
 *     responses:
 *       200:
 *         description: List of employees matching the search criteria
 *       400:
 *         description: Search term is required
 *       500:
 *         description: Internal server error
 */
router.get('/search', async (req, res) => {
  const db = req.db;
  const { term } = req.query;
  
  if (!term) {
    return res.status(400).json({ error: "Search term is required" });
  }
  
  try {
    const result = await db.query(
      `SELECT * FROM employees 
       WHERE first_name ILIKE $1 
       OR last_name ILIKE $1 
       OR email ILIKE $1
       ORDER BY last_name, first_name`,
      [`%${term}%`]
    );
    res.json(result.rows);
  } catch (queryErr) {
    console.error('Database query error:', queryErr.message);
    res.status(500).json({ error: queryErr.message });
  }
});

/**
 * @swagger
 * /employees/update-status/{id}:
 *   patch:
 *     tags: [Employees]
 *     description: Update an employee's status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the employee to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ['Active', 'On Leave', 'Terminated', 'Resigned']
 *               termination_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Employee status updated successfully
 *       400:
 *         description: Status is required
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */
router.patch('/update-status/:id', async (req, res) => {
  const db = req.db;
  const { id } = req.params;
  const { status, termination_date } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: "Status is required" });
  }
  
  try {
    let query, values;
    
    if (status === 'Terminated' || status === 'Resigned') {
      query = `
        UPDATE employees 
        SET 
          status = $1,
          termination_date = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $3
        RETURNING *
      `;
      
      values = [
        status,
        termination_date || new Date(),
        id
      ];
    } else {
      query = `
        UPDATE employees 
        SET 
          status = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $2
        RETURNING *
      `;
      
      values = [
        status,
        id
      ];
    }
    
    const result = await db.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employee not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;