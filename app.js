require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
// for level 5 encryption
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")

// level 6 
const findOrCreate = require("mongoose-findorcreate")

const app = express();

app.use(express.urlencoded({extended: true}));

app.use(express.static("public"));
app.use(express.json())

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const corsOption = {
    origin: [
        process.env.FRONTEND_URL
    ],
    // credentials: true,
    optionSuccessStatus: 200
}
app.options("*", cors())

app.use(cors(corsOption))
app.use(cors({methods: ["GET", "POST"]}))

// level 5
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())

const url = process.env.MONGOOSE_URL_ATLAS

mongoose.connect(url);

const userSchema = new mongoose.Schema({
    username: String, 
    firstName: String, 
    lastName: String, 
    middleName: String, 
    school: String, 
    level: String,
    course: String,
    matricNumber: String,
    gender: String,
    phoneNumber: String, 
    dateCreated: String,
    password: String,
    lecturerID: String,
    acceptanceLetterID: String,
    reportID: String,
});
const lecturerSchema = new mongoose.Schema({
    username: String, 
    firstName: String, 
    lastName: String, 
    middleName: String, 
    school: String, 
    gender: String,
    phoneNumber: String, 
    dateCreated: String,
    password: String,
    students: [String],
    acceptanceLetterID: String,
});
const workDetailsSchema = new mongoose.Schema({
    studentID: String, 
    companyName: String, 
    companyAddress: String, 
    state: String, 
    lga: String, 
    companyEmail: String,
    companyPhoneNumber: String,
    resumptionDate: String,
    terminationDate: String,
    assignedDepartment: String,
    jobDesc: String,
});
const reportSchema = new mongoose.Schema({
    studentID: String, 
    monday: String, 
    tuesday: String, 
    wednesday: String, 
    thursday: String, 
    friday: String,
});
const acceptanceLetterSchema = new mongoose.Schema({
    studentID: String, 
    monday: String, 
    tuesday: String, 
    wednesday: String, 
    thursday: String, 
    friday: String,
});

// for level 5 encryption
userSchema.plugin(passportLocalMongoose)

// for level 6 encryption
userSchema.plugin(findOrCreate)

// userSchema.plugin(passportLocalMongoose, {usernameQueryFields: ["username", "email"]})

const User = mongoose.model("User", userSchema);
const Lecturer = mongoose.model("Lecturer", lecturerSchema);
const AcceptanceLetter = mongoose.model("AcceptanceLetter", acceptanceLetterSchema);
const Report = mongoose.model("Report", reportSchema);
const WorkDatails = mongoose.model("WorkDatails", workDetailsSchema);

// for level 5 encryption
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user._id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});




app.route("/student/register")
    .get((req, res) => {
        res.status(200).json({success: true, name: "username"})
    })
    .post((req, res) => {
        const { firstName, lastName, username, middleName, school, level, course, matricNumber, gender, password, phoneNumber, dateCreated} = req.body
        User.findOne({username: username}, (err, result) => {
            if(err) {
                res.status(200).json({success: false, err: err, name: req.body.username})
            } else {
                if(result) {
                    res.status(200).json({success: false, exists: true, name: req.body.username})
                } else {
                    User.register(
                        {
                            username: username, 
                            firstName: firstName, 
                            lastName: lastName, 
                            middleName: middleName, 
                            school: school, 
                            level: level,
                            course: course,
                            matricNumber: matricNumber,
                            gender: gender,
                            phoneNumber: phoneNumber, 
                            dateCreated: dateCreated,
                        }, 
                        password, 
                        (err, result) => {
                        if(err) {
                            res.status(200).json({success: false, message: err, name: result})
                        } else {
                            User.findOne({username: req.body.username}, (err, result) => {
                                if(err) {
                                    res.status(200).json({success: false, err: err, name: req.body.username})
                                } else {
                                    res.status(200).json({success: true, user: result})
                                }
                            })
                        }
                    })
                }
            }
        })
        
    });




app.route("/supervisor/register")
    .get((req, res) => {
        res.status(200).json({success: true, name: "username"})
    })
    .post((req, res) => {
        const { firstName, lastName, username, middleName, school, gender, password, phoneNumber, dateCreated} = req.body
        Lecturer.findOne({username: username}, (err, result) => {
            if(err) {
                res.status(200).json({success: false, err: err, name: req.body.username})
            } else {
                if(result) {
                    res.status(200).json({success: false, exists: true, name: req.body.username})
                } else {
                    Lecturer.register(
                        {
                            username: username, 
                            firstName: firstName, 
                            lastName: lastName, 
                            middleName: middleName, 
                            school: school, 
                            gender: gender,
                            phoneNumber: phoneNumber, 
                            dateCreated: dateCreated,
                        }, 
                        password, 
                        (err, result) => {
                        if(err) {
                            res.status(200).json({success: false, message: err, name: result})
                        } else {
                            Lecturer.findOne({username: req.body.username}, (err, result) => {
                                if(err) {
                                    res.status(200).json({success: false, err: err, name: req.body.username})
                                } else {
                                    res.status(200).json({success: true, user: result})
                                }
                            })
                        }
                    })
                }
            }
        })
        
    });


app.route("/student/login")
    .get((req, res) => {
        res.render("login")
    })
    .post((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })
        req.login(user, (err) => {
            if(err) {
                console.log(err);
                res.status(200).json({success: false, err: err})
            } else {
                passport.authenticate("local") (req, res, () => {
                    User.findOne({username: req.body.username}, (err, result) => {
                        if(err) {
                            res.status(200).json({success: false, err: err, name: req.body.username})
                        } else {
                            res.status(200).json({success: true, user: result})
                        }
                    })
                })
                // res.status(200).json({success: false, name: req.body.username})
            }
        })
    });

app.route("/supervisor/login")
    .get((req, res) => {
        res.render("login")
    })
    .post((req, res) => {
        const lecturer = new Lecturer({
            username: req.body.username,
            password: req.body.password
        })
        req.login(lecturer, (err) => {
            if(err) {
                console.log(err);
                res.status(200).json({success: false, err: err})
            } else {
                passport.authenticate("local") (req, res, () => {
                    Lecturer.findOne({username: req.body.username}, (err, result) => {
                        if(err) {
                            res.status(200).json({success: false, err: err, name: req.body.username})
                        } else {
                            res.status(200).json({success: true, user: result})
                        }
                    })
                })
                // res.status(200).json({success: false, name: req.body.username})
            }
        })
    });


app.route("/student/upload-details")
    .get((req, res) => {
        res.render("login")
    })
    .post((req, res) => {
        const { studentID, companyName, companyAddress, state, lga, companyEmail, companyPhoneNumber, resumptionDate, terminationDate, assignedDepartment, jobDesc } = req.body
        WorkDatails.findOne({studentID: studentID}, (err, result) => {
            if(err) {
                res.status(200).json({success: false, err: err, name: studentID})
            } else {
                if(result) {
                    WorkDatails.updateOne(
                        {studentID: studentID},
                        {
                            studentID: studentID,
                            companyName: companyName,
                            companyAddress: companyAddress,
                            state: state,
                            lga: lga,
                            companyEmail: companyEmail,
                            companyPhoneNumber: companyPhoneNumber,
                            resumptionDate: resumptionDate,
                            terminationDate: terminationDate,
                            assignedDepartment: assignedDepartment,
                            jobDesc: jobDesc,
                        },
                        (err, result) => {
                            if(err) {
                                res.status(200).json({success: false, err: err, studentID: studentID})
                            } else {
                                WorkDatails.findOne({studentID: studentID}, (err, result) => {
                                    if(err) {
                                        res.status(200).json({success: false, err: err, name: studentID})
                                    } else {
                                        res.status(200).json({success: true, details: result})
                                    }
                                })
                            }
                        }
                    )
                } else {
                    WorkDatails.insertMany({
                        studentID: studentID,
                        companyName: companyName,
                        companyAddress: companyAddress,
                        state: state,
                        lga: lga,
                        companyEmail: companyEmail,
                        companyPhoneNumber: companyPhoneNumber,
                        resumptionDate: resumptionDate,
                        terminationDate: terminationDate,
                        assignedDepartment: assignedDepartment,
                        jobDesc: jobDesc,
                    }, (err, result) => {
                        if(err) {
                            res.status(200).json({success: false, err: err})
                        } else {
                            if(result) {
                                res.status(200).json({success: true, details: result[0]})
                            }
                        }
                    })
                }
            }
        })
        
    });



app.route("/student/upload-report")
    .get((req, res) => {
        res.render("login")
    })
    .post((req, res) => {
        const { studentID, monday, tuesday, wednesday, thursday, friday, week, } = req.body
        Report.findOne({studentID: studentID}, (err, result) => {
            if(err) {
                res.status(200).json({success: false, err: err})
            } else {
                if(result) {
                    Report.updateOne(
                        {studentID: studentID},
                        {
                            studentID: studentID,
                            monday: monday,
                            tuesday: tuesday,
                            wednesday: wednesday,
                            thursday: thursday,
                            friday: friday,
                            week: week,
                        },
                        (err, result) => {
                            if(err) {
                                res.status(200).json({success: false, err: err, studentID: studentID})
                            } else {
                                Report.findOne({studentID: studentID}, (err, result) => {
                                    if(err) {
                                        res.status(200).json({success: false, err: err, name: studentID})
                                    } else {
                                        res.status(200).json({success: true, details: result})
                                    }
                                })
                            }
                        }
                    )
                } else {
                    Report.insertMany({
                        studentID: studentID,
                        monday: monday,
                        tuesday: tuesday,
                        wednesday: wednesday,
                        thursday: thursday,
                        friday: friday,
                        week: week,
                    }, (err, result) => {
                        if(err) {
                            res.status(200).json({success: false, err: err})
                        } else {
                            if(result) {
                                res.status(200).json({success: true, details: result[0]})
                            }
                        }
                    })
                }
            }
        })
        
    });



app.route("/student/profile")
    .get((req, res) => {
        const { studentID } = req.body
        User.findOne({_id: studentID}, (err, result) => {
            if(err) {
                res.status(200).json({success: false, err: err})
            } else {
                if(result) {
                    res.status(200).json({success: true, user: result})
                } else {
                    res.status(200).json({success: false, err: "Not found"})

                }
            }
        })
    })
    .post((req, res) => {
        
    });



app.route("/student/reports")
    .get((req, res) => {
        const { studentID } = req.body
        Report.findOne({studentID: studentID}, (err, result) => {
            if(err) {
                res.status(200).json({success: false, err: err})
            } else {
                if(result) {
                    res.status(200).json({success: true, user: result})
                } else {
                    res.status(200).json({success: false, err: "Not found"})

                }
            }
        })
    })
    .post((req, res) => {
        
    });


app.route("/supervisor/profile")
    .get((req, res) => {
        const { lecturerID } = req.body
        Lecturer.findOne({_id: lecturerID}, (err, result) => {
            if(err) {
                res.status(200).json({success: false, err: err})
            } else {
                if(result) {
                    res.status(200).json({success: true, user: result})
                } else {
                    res.status(200).json({success: false, err: "Not found"})

                }
            }
        })
    })
    .post((req, res) => {
        
    });


app.route("/update")
    .get((req, res) => {
        res.render("login")
    })
    .patch((req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })
        req.login(user, (err) => {
            if(err) {
                console.log(err);
                res.status(200).json({success: false, err: err})
            } else {
                passport.authenticate("local") (req, res, () => {
                    
                    User.updateOne(
                        {username: req.body.username},
                        {
                            username: req.body.username, 
                            firstName: req.body.firstName, 
                            lastName: req.body.lastName, 
                            country: req.body.country, 
                            state: req.body.state,
                            phoneNumber: req.body.phoneNumber, 
                        },
                        (err, result) => {
                            if(err) {
                                res.status(200).json({success: false, err: err, name: req.body.username})
                            } else {
                                User.findOne({username: req.body.username}, (err, result) => {
                                    if(err) {
                                        res.status(200).json({success: false, err: err, name: req.body.username})
                                    } else {
                                        res.status(200).json({success: true, user: result})
                                    }
                                })
                            }
                        }
                    )
                })
                // res.status(200).json({success: false, name: req.body.username})
            }
        })
    });

app.post("/api/delete", (req, res) => {
    
    const { name, hitsNum } = req.body;
    let hit;
    User.findOne({username: req.body.username}, (err, result) => {
        if(err) {
            console.log(err);
        } else {
            if(result) {
                result.hitsNum = result.hitsNum - 3
                result.save(err => {
                    if (err) {
                        console.log("Could not update...");
                        res.json({success: false, data: err})            
                    } else {
                        res.json({success: true, data: result})
                    }
                })
                
            }
        }
    })
})






port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("Server started on port " + port);
})