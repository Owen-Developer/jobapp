const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2');
const app = express();
const PORT = process.env.PORT || 3000;
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
require('dotenv').config();
const cors = require('cors');
const crypto = require('crypto');
const e = require('express');
const jwt = require("jsonwebtoken");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
db.query('SELECT 1', (err, results) => {
    if (err) console.error('Error running query:', err);
    else console.log('Database is working');
});

const store = new MySQLStore({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.PORT 
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);

app.use(session({
    store,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, 
        secure: false,       // HTTPS only
        sameSite: "lax"    // allow cross-site cookies
    }
}));

app.use(express.static(path.join(__dirname, "docs")));




////////////////////////// REUSABLE FUNCTIONS //////////////////////////
async function sendEmail(userEmail, text) {
    const dataToSend = { reciever: userEmail, text: `${text}`, service: 'nextdesign' };
    try {
        const response = await fetch('https://email-sender-lkex.vercel.app/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', 
            },
            body: JSON.stringify(dataToSend), 
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error:', errorData.error);
            return;
        }
    } catch (error) {
        console.error('Error posting data:', error);
    }
}
function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}
function getCurrentDate() {
    const today = new Date();

    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const yyyy = today.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
}
function getTime(){
    const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
    ];
    const todayDate = getCurrentDate();
    let monthTxt = months[Number(todayDate.split("/")[1]) - 1];
    let monthNum = todayDate.split("/")[0];
    let yearNum = todayDate.split("/")[2];
    const now = new Date();
    let timeString = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
    if(Number(timeString.slice(0, 2)) > 12){
        timeString = String(Number(Number(timeString.slice(0, 2)) - 12)) + timeString.slice(2) + "pm";
    } else if(Number(timeString.slice(0, 2)) == 12){
        timeString = timeString + "pm";
    } else {
        timeString = timeString + "am";
    }
    return `${monthTxt} ${monthNum}, ${yearNum} at ${timeString}`;
}
function createNoti(userId, title, type, reciever){
    db.query("insert into notifications (user_id, title, full_date, type, status, reciever) values (?, ?, ?, ?, ?, ?)", [userId, title, getTime(), type, "unread", reciever], (err, result) => {
        if(err){
            console.error(err);
        }
    });
}
function sendVerificationCode(userEmail, code){
    sendEmail(userEmail, "Your verification code is " + code);
}
function requireAuth(req, res, next) {
    const header = req.headers.authorization;

    if (!header){
        console.log("unauth");
        req.user = null;
        return next();
    } 
        

    const token = header.split(" ")[1];


    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (error) {
        console.log("unauth 2")
        req.user = null;
    }
    next();
}




////////////////////////// APIS ROUTES //////////////////////////
app.post("/api/setup", requireAuth, (req, res) => {
    const { name, email, password } = req.body;

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if(err){
            console.error('Error hashing password:', err);
            return res.status(500).send('Error hashing password');
        }

        const query = 'INSERT INTO users (role, name, email, phone, password_hash, perms) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, ["n/a", name, email, "n/a", hashedPassword, "admin"], (err, result) => {
            if(err){
                console.error('Error inserting data:', err);
                return res.json({ message: 'failure' });
            }

            const payload = {
                userId: result.insertId
            };
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: "60m" }
            );
             
            return res.json({ message: 'success', token: token });
        });
    });
});

app.post("/api/login", requireAuth, (req, res) => {
    const { email, password } = req.body;

    db.query("select * from users where email = ?", [email], (err, result) => {
        if(err){
            console.error(err);
        }

        if(result.length == 0){
            return res.json({ message: "no user" });
        }

        bcrypt.compare(password, result[0].password_hash, (err, isMatch) => {
            if(err){
                console.error("Error comparing passwords: " + err);
                return res.json({ message: 'failure' });
            }
            if(!isMatch){
                return res.json({ message: 'invalid password' });
            }

            const payload = {
                userId: result[0].id
            };
            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: "60m" }
            );
            if(result[0].perms == "admin"){
                return res.json({ message: 'admin', token: token });
            } else {
                return res.json({ message: 'success', token: token });
            }
        });
    });
});

app.get("/api/get-jobs", requireAuth, (req, res) => {
    db.query("select * from jobs where user_id = ?", [req.user.userId], (err, result) => {
        if(err){
            console.error(err);
        }

        if(result.length > 0){
            return res.json({ messageFound: true, jobs: result });
        } else {
            return res.json({ messageFound: false });
        }
    });
});

app.get("/api/get-user", requireAuth, (req, res) => {
    if(!req.user?.userId){
        db.query("select * from users", (err, result) => {
            if(err){
                console.error(err);
            }

            if(result.length == 0){
                return res.json({ message: 'setup' });
            } else {
                return res.json({ message: 'nouser' });
            }
        });
    } else {
        db.query("select * from users where id = ?", [req.user.userId], (err, result) => {
            if(err){
                console.error(err);
            }
    
            let userData = result[0];
            userData.password_hash = "";
            db.query("select * from notifications where user_id = ? or reciever = ? order by id desc", [req.user.userId, "admin"], (err, result) => {
                if(err){
                    console.error(err);
                }
    
                let notifications = [];
                result.forEach(noti => {
                    if(userData.perms == "admin" && (noti.reciever == "admin" || userData.id == noti.user_id)){
                        notifications.push(noti);
                    } else if(userData.perms == "worker" && noti.reciever == "worker"){
                        notifications.push(noti);
                    }
                });
                userData.notifications = notifications;
    
                return res.json({ message: 'success', userData: userData });
            });
        });
    }

});

app.post("/api/mark-read", requireAuth, (req, res) => {
    if(req.body.perms == "admin"){
        db.query("update notifications set status = ? where reciever = ? or user_id = ?", ["read", "admin", req.user.userId], (err, result) => {
            if(err){
                console.error(err);
            }
    
            return res.json({ message: 'success' });
        });
    } else {
        db.query("update notifications set status = ? where user_id = ?", ["read", req.user.userId], (err, result) => {
            if(err){
                console.error(err);
            }
    
            return res.json({ message: 'success' });
        });
    }
});

app.post("/api/update-progress", (req, res) => {
    const { time, jobId } = req.body;

    db.query("update jobs set job_progress = ? where id = ?", [time, jobId], (err, result) => {
        if(err){
            console.error(err);
        }

        return res.json({ message: 'success' });
    });
});

app.post("/api/end-job", (req, res) => {
    const { time, jobId } = req.body;

    db.query("update jobs set job_status = ?, job_progress = ? where id = ?", ["Completed", time, jobId], (err, result) => {
        if(err){
            console.error(err);
        }

        return res.json({ message: 'success' });
    });
});

app.get("/api/get-materials", (req, res) => {
    db.query("select * from prices", (err, result) => {
        if(err){
            console.error(err);
        }

        if(result.length == 0){
            return res.json({ message: 'nodata' });
        }

        return res.json({ message: 'success', materials: result });
    });
});

app.post("/api/send-summary", (req, res) => {
    let { jobId, date, notes, materials, charges } = req.body;

    let chargeStr;
    if(charges.length == 0){
        chargeStr = "No charges";
    } else {
        chargeStr = charges.join(",,");
    }
    let matStr = "";
    materials.forEach((arr, idx) => {
        if(idx > 0){
            matStr += ",," + arr[0] + "-" + arr[1] + arr[2];
        } else {
            matStr += arr[0] + "-" + arr[1] + arr[2];
        }
    });
    if(matStr == "") matStr = "No materials used";
    if(notes == "") notes = "No notes yet.";

    db.query("select * from prices", (err, result) => {
        if(err){
            console.error(err);
        }

        let chargeCharge = 0;
        let materialCost = 0;
        let materialCharge = 0;
        let labourCost;
        let labourCharge;
        let calloutCharge;
        result.forEach(price => {
            charges.forEach(charge => {
                if(charge == price.id){
                    chargeCharge += price.charge;
                }
            });
            materials.forEach(arr => {
                if(price.area == "materials" && arr[0].toLowerCase() == price.name.toLowerCase()){
                    let newCost = Number((price.cost * (Number(arr[1]) / price.default_value)).toFixed(2));
                    let newCharge = Number((price.charge * (Number(arr[1]) / price.default_value)).toFixed(2));
                    materialCost += newCost;
                    materialCharge += newCharge;
                }
            });
            if(price.name == "Hourly labour cost"){
                labourCost = price.cost;
            } else if(price.name == "Hourly labour charge"){
                labourCharge = price.charge;
            } else if(price.name == "Call out fee"){
                calloutCharge = price.charge;
            }
        });

        db.query("select * from jobs where id = ?", [jobId], (err, result) => {
            if(err){
                console.error(err);
            }

            let jobName = result[0].job_name;
            let hoursWorked = 0;
            let minutesWorked = 0;
            let progressStr = result[0].job_progress;
            let totalLabourCost = 0;
            let totalLabourCharge = 0;
            if(progressStr.includes("hrs")){
                hoursWorked = 0;
                minutesWorked = Number(progressStr.slice(progressStr.indexOf("s") + 2, progressStr.indexOf("m") - 1));
            } else {
                minutesWorked = Number(progressStr.slice(0, progressStr.indexOf("m") - 1));
            }
            totalLabourCost += Number(((hoursWorked * labourCost) + (labourCost * (minutesWorked / 60))).toFixed(2));
            totalLabourCharge += Number(((hoursWorked * labourCharge) + (labourCharge * (minutesWorked / 60))).toFixed(2));
            if(totalLabourCharge < calloutCharge) totalLabourCharge = calloutCharge;

            let realCharge = "£" + Number(chargeCharge + materialCharge + totalLabourCharge);
            let setback = "£" + Number(materialCost + totalLabourCost);

            db.query("update jobs set job_date = ?, job_notes = ?, job_materials = ?, job_charges = ?, job_realcharge = ?, job_setback = ?, material_cost = ?, material_charge = ?, labour_cost = ?, labour_charge = ? where id = ?", [date, notes, matStr, chargeStr, realCharge, setback, "£" + materialCost, "£" + materialCharge, "£" + totalLabourCost, "£" + totalLabourCharge, jobId], async (err, result) => {
                if(err){
                    console.error(err);
                }
        
                await createNoti(0, "'" + jobName + "' has been completed.", "finished", "admin");
                return res.json({ message: 'success' });
            });
        });
    });
});

app.get("/api/get-profile", requireAuth, (req, res) => {
    db.query("select * from users where id = ?", [req.user.userId], (err, result) => {
        if(err){
            console.error(err);
        }

        if(result.length == 0){
            return res.json({ message: 'nodata' });
        }

        const profileData = result[0];
        profileData.password_hash = "";
        return res.json({ message: 'success', profile: profileData });
    });
});

app.post("/api/save-profile", requireAuth, (req, res) => {
    const { name, email, phone } = req.body;

    db.query("update users set name = ?, email = ?, phone = ? where id = ?", [name, email, phone, req.user.userId], (err, result) => {
        if(err){
            console.error(err);
        }

        db.query("select * from users where id = ?", [req.user.userId], (err, result) => {
            if(err){
                console.error(err);
            }

            if(result.length == 0){
                return res.json({ message: 'failure' });
            }

            let userData = result[0];
            userData.password_hash = "";
            db.query("select * from notifications where user_id = ?", [req.user.userId], (err, result) => {
                if(err){
                    console.error(err);
                }

                let notifications = [];
                result.forEach(noti => {
                    notifications.push(noti);
                });
                userData.notifications = notifications;

                return res.json({ message: 'success', userData: userData });
            });
        });
    });
});

app.post("/api/change-password", requireAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body;

    db.query("select * from users where id = ?", [req.user.userId], (err, result) => {
        if(err){
            console.error(err);
        }

        bcrypt.compare(currentPassword, result[0].password_hash, (err, isMatch) => {
            if(err){
                console.error("Error comparing passwords: " + err);
                return res.json({ message: 'failure' });
            }
            if(!isMatch){
                return res.json({ message: 'invalid password' });
            }

            bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
                if(err){
                    console.error(err);
                }

                db.query("update users set password_hash = ? where id = ?", [hashedPassword, req.user.userId], async (err, result) => {
                    if(err){
                        console.error(err);
                    }

                    await createNoti(req.user.userId, "You password has recently been changed.", "password", "worker");
                    return res.json({ message: 'success' });
                });
            });    
        });
    });
});

app.get("/api/admin-data", (req, res) => {
    db.query("select * from jobs", (err, result) => {
        let jobs = result;
        db.query("select * from users where perms = ? order by name asc", ["worker"], (err, result) => {
            let users = result;
            db.query("select * from prices", (err, result) => {
                let prices = result;

                return res.json({ message: 'success', jobs: jobs, users: users, prices: prices });
            });
        });
    });
});

app.post("/api/create-job", (req, res) => {
    const { jobName, customerName, customerAddress, jobDate, jobTime, finishTime, jobCost, worker, workerId } = req.body;

    if(worker == ""){
        return res.json({ message: 'noworker' });
    }

    db.query("insert into jobs (job_name, job_customer, job_date, job_time, job_finish, job_address, job_worker, user_id, job_status, job_progress, job_materials, job_notes, job_cost) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [jobName, customerName, jobDate, jobTime, finishTime, customerAddress, worker, workerId, "Pending", "0 minutes", "No materials used", "No notes yet.", jobCost], async (err, result) => {
        if(err){
            console.error(err);
        }

        await createNoti(workerId, "You have been assigned to a new job.", "job", "worker");
        return res.json({ message: 'success' });
    });
});

app.post("/api/edit-job", (req, res) => {
    const { jobId, editName, editCustomerName, editCustomerAddress, editDate, editTime, editFinish, editCost, editWorker, editWorkerId } = req.body;

    if(editWorker == ""){
        return res.json({ message: 'noworker' });
    }

    db.query("update jobs set job_name = ?, job_customer = ?, job_date = ?, job_time = ?, job_finish, job_address = ?, job_worker = ?, user_id = ?, job_status = ?, job_progress = ?, job_materials = ?, job_notes = ?, job_cost = ? where id = ?", [editName, editCustomerName, editDate, editTime, editFinish, editCustomerAddress, editWorker, editWorkerId, "Pending", "0 minutes", "No materials used", "No notes yet.", editCost, jobId], async (err, result) => {
        if(err){
            console.error(err);
        }

        await createNoti(editWorkerId, "Your job details have recently been edited.", "job", "worker");
        return res.json({ message: 'success' });
    });
});

app.post("/api/delete-job", (req, res) => {
    db.query("select * from jobs where id = ?", [req.body.jobId], (err, result) => {
        let workerId = result[0].user_id;
        db.query("delete from jobs where id = ?", [req.body.jobId], async (err, result) => {
            if(err){
                console.error(err);
            }
    
            await createNoti(workerId, "One of your job have recently been cancelled.", "job", "worker");
            return res.json({ message: 'success' });
        });
    });
});

app.post("/api/create-worker", (req, res) => {
    const { name, role, email, phone, password } = req.body;

    const checkTakenQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkTakenQuery, [email], (err, result) => {
        if(err){
            console.error("Error checking if email is taken");
        }

        if(result.length > 0) {
            return res.json({ message: 'email taken' });
        }

        const valid = isValidEmail(email);
        if(!valid){
            return res.json({ message: 'invalid email' });
        }

        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if(err){
                console.error('Error hashing password:', err);
                return res.status(500).send('Error hashing password');
            }

            const code = Math.floor(100000 + Math.random() * 900000);
            const query = 'INSERT INTO users (role, name, email, phone, password_hash, perms) VALUES (?, ?, ?, ?, ?, ?)';
            db.query(query, [role, name, email, phone, hashedPassword, "worker"], (err, result) => {
                if(err){
                    console.error('Error inserting data:', err);
                    return res.json({ message: 'failure' });
                }
                    
                return res.json({ message: 'success' });
            });
        });
    });
});

app.post("/api/update-materials", (req, res) => {
    const data = req.body;

    data.forEach((material, idx) => {
        db.query("update prices set cost = ?, charge = ? where id = ?", [material[1], material[2], material[0]], (err, result) => {
            if(err){
                console.error(err);
            }

            if(idx == data.length - 1){
                return res.json({ message: 'success' });
            }
        });
    });
});

app.post("/api/update-charges", (req, res) => {
    const data = req.body;

    data.forEach((material, idx) => {
        db.query("update prices set charge = ? where id = ?", [material[1], material[0]], (err, result) => {
            if(err){
                console.error(err);
            }

            if(idx == data.length - 1){
                return res.json({ message: 'success' });
            }
        });
    });
});

app.post("/api/create-charge", (req, res) => {
    const { name, charge } = req.body;

    db.query("insert into prices (type, name, unit, default_value, cost, charge, area) values (?, ?, ?, ?, ?, ?, ?)", ["n/a", name, "n/a", 0, 0, charge, "charges"], (err, result) => {
        if(err){
            console.error(err);
        }

        return res.json({ message: 'success' });
    });
});

app.post("/api/update-labour", (req, res) => {
    const data = req.body;

    data.forEach((labour, idx) => {
        db.query("update prices set " + labour[2] + " = ? where id = ?", [labour[1], labour[0]], (err, result) => {
            if(err){
                console.error(err);
            }

            if(idx == data.length - 1){
                return res.json({ message: 'success' });
            }
        });
    });
});

app.get("/api/logout", (req, res) => {
    return res.json({ message: 'success' });
});

app.get("/api/admin-notis", (req, res) => {
    db.query("select * from notifications where reciever = ? order by id desc", ["admin"], (err, result) => {
        if(err){
            console.error(err);
        } 

        return res.json({ message: 'success', notis: result });
    });
});

app.get("/api/find-admin", (req, res) => {
    db.query("select * from users where perms = ?", ["admin"], (err, result) => {
        if(err){
            console.error(err);
        }

        if(result.length == 0){
            return res.json({ message: 'noadmin' });
        } else {
            return res.json({ message: 'adminfound' });
        }
    });
});

app.post("/api/delete-worker", (req, res) => {
    console.log(req.body.id);
    db.query("delete from users where id = ?", [req.body.id], (err, result) => {
        if(err){
            console.error(err);
        }

        return res.json({ message: 'success' });
    });
});

app.post("/api/create-material", (req, res) => {
    const { name, cost, charge, type, unit } = req.body;
    let defaultValue;
    let defaultStep;
    if(unit == "units"){
        defaultValue = 1;
        defaultStep = 1;
    } else if(unit == "m"){
        defaultValue = 1;
        defaultStep = 0.5;
    } else if(unit == "mm"){
        defaultValue = 15;
        defaultStep = 1;
    } else if(unit == "g"){
        defaultValue = 75;
        defaultStep = 25;
    } else if(unit == "kg"){
        defaultValue = 1;
        defaultStep = 0.25;
    } else if(unit == "ml"){
        defaultValue = 250;
        defaultStep = 50;
    }
    
    db.query("insert into prices (type, name, unit, default_value, cost, charge, area, step) values (?, ?, ?, ?, ?, ?, ?, ?)", [type, name, unit, defaultValue, Number(cost.replace("£", "")), Number(charge.replace("£", "")), "materials", defaultStep], (err, result) => {
        if(err){
            console.error(err);
        }

        return res.json({ message: 'success' });
    });
});

app.post("/api/delete-price", (req, res) => {
    db.query("delete from prices where id = ?", [req.body.id], (err, result) => {
        if(err){
            console.error(err);
        }

        return res.json({ message: 'success' });
    });
});

app.post("/api/contact", async (req, res) => {
    const { name, email, message } = req.body;

    await sendEmail("jackbaileywoods@gmail.com", `Hi, you got a message from the Job App.<br><br>Name: ${name}<br><br>Email: ${email}<br><br>Message: ${message}`);
    return res.json({ message: 'success' });
});

app.post("/api/send-code", (req, res) => {
    db.query("select * from users where email = ?", [req.body.email], (err, result) => {
        if(err){
            console.error(err);
        }

        if(result.length == 0){
            return res.json({ message: 'noemail' });
        }

        const code = Math.floor(100000 + Math.random() * 900000);
        sendVerificationCode(result[0].email, code);
        db.query("update users set verification_code = ? where id = ?", [code, result[0].id], (err, result) => {
            if(err){
                console.error(err);
            }
            
            return res.json({ message: 'success' });
        });
    });
});

app.post("/api/verify", requireAuth, (req, res) => {
    const { code, password } = req.body;

    db.query("select * from users where verification_code = ?", [code], (err, result) => {
        if(err){
            console.error(err);
        }

        if(result.length == 0){
            return res.json({ message: 'codeerror' });
        }

        let userId = result[0].id;
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if(err){
                console.error(err);
            }

            db.query("update users set password_hash = ?, verification_code = ? where id = ?", [hashedPassword, "n/a", userId], (err, result) => {
                if(err){
                    console.error(err);
                }

                req.user.userId = userId;
                return res.json({ message: 'success' });
            });
        });
    });
});




app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});