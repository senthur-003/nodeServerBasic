const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const cors = require('cors');
const multer = require('multer'); //added for the formdata in api 
const upload = multer();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Parses incoming requests with URL-encoded payloads
app.use(bodyParser.urlencoded({ extended: true }));

//DB Connection

const db = {
    server: 'serverip', //user your server ip
    user: 'username', // dbusername
    password: 'password', //dbuser password
    database: 'dbname', //db name
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    port: 1433
};
const db_tcs_demo = {
    server: 'serverip', //user your server ip
    user: 'username', // dbusername
    password: 'password', //dbuser password
    database: 'dbname', //db name
    options: {
        encrypt: true,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    port: 1433
};

sql.connect(db_tcs_demo, err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected successfully');
})

const poolPromise = new sql.ConnectionPool(db_tcs_demo)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL.');
        return pool;
    })
    .catch(err => console.log('Database Connection Failed! Bad Config: ', err));


//APIng
//Get
app.get('/user', (req, res) => {
    const request = new sql.Request();
    const query = 'SELECT * FROM adminuserdetails';
    request.query(query, (err, result) => {
        if (err) {
            console.error('Query error: ', err);
            res.status(500).send(err);
            return;
        }
        res.status(200).json({ statusCode: 200, data: result.recordset, message: 'Logged In successfully' });
    });
});


//Post
app.post('/register', upload.array(), async (req, res) => {
    try {
        const pool = await poolPromise;
        const { email, phone, password, name } = req.body;

        if (!email || !phone || !password || !name) {
            return res.status(400).send({ error: 'All fields are required' });
        }

        await pool.request()
            .input('email', sql.VarChar, email)
            .input('phone', sql.VarChar, phone)
            .input('passwrd', sql.VarChar, password)
            .input('name', sql.VarChar, name)
            .query(`INSERT INTO USERDETAILS (email,phone,passwrd,name) VALUES (@email,@phone,@passwrd,@name)`);
        res.status(201).send({ message: 'Employee created successfully' });
    }
    catch (err) {
        res.status(500).send({ message: 'Error Creating item', error: err.message });
    }
});


app.post('/login', upload.array(), async (req, res) => {
    try {
        const pool = await poolPromise;
        const { email, password } = req.body;

        // console.log('Request Body:', req.body);
        // console.log('Parsed Values:', { email, password });
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .input('passwrd', sql.VarChar, password)
            .query(`SELECT * from USERDETAILS where email=@email and passwrd=@passwrd `);

        if (result.recordset.length > 0) {
            return res.status(200).send({ 
                statuscode: 200,
                status: 'Success',
                message: 'Data retrieved successfully'
            });
        } else {
            return res.status(400).send({ 
                statuscode: 400,
                status: 'Failure',
                message: 'Invalid email or password'
            });
        }
    }
    catch (err) {
        res.status(500).send({ message: 'Login failed', error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});