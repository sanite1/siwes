require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
// const AWS = require('aws-sdk');

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
    state: String, 
    firstName: String, 
    lastName: String, 
    middleName: String, 
    school: String, 
    gender: String,
    phoneNumber: String, 
    dateCreated: String,
    password: String,
    students: [String],
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
    week: String,
    date: String,
    timeStamp: String,
});
const acceptanceLetterSchema = new mongoose.Schema({
    studentID: String, 
    image: String
});

// for level 5 encryption
userSchema.plugin(passportLocalMongoose)
lecturerSchema.plugin(passportLocalMongoose)

// for level 6 encryption
userSchema.plugin(findOrCreate)

userSchema.plugin(passportLocalMongoose, {usernameQueryFields: ["username", "matricNumber"]})
lecturerSchema.plugin(passportLocalMongoose, {usernameQueryFields: ["username"]})

const User = mongoose.model("User", userSchema);
const Lecturer = mongoose.model("Lecturer", lecturerSchema);
const AcceptanceLetter = mongoose.model("AcceptanceLetter", acceptanceLetterSchema);
const Report = mongoose.model("Report", reportSchema);
const WorkDatails = mongoose.model("WorkDatails", workDetailsSchema);

// for level 5 encryption
const userAuth = () => {
    passport.use(User.createStrategy());
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });
    
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

}

const lecturerAuth = () => {
    passport.use(Lecturer.createStrategy());
    passport.serializeUser(function(lecturer, done) {
        done(null, lecturer._id);
    });
    
    passport.deserializeUser(function(id, done) {
        Lecturer.findById(id, function(err, lecturer) {
            done(err, lecturer);
        });
    });

}




// Configuration 
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});



// Configure Multer to parse FormData
// const storage = multer.memoryStorage();
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, 'uploads/');
    },
    filename: (req, file, callback) => {
      callback(null, Date.now() + path.extname(file.originalname));
    }
  });
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     console.log("🚀 ~ file: upload.ts:11 ~ file", process.cwd());
//     cb(null, `${process.cwd()}/src/Images`);
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.fieldname + "-" + Date.now());
//   },
// });
const upload = multer({ storage: storage });

app.route("/student/register")
    .get((req, res) => {
        res.status(200).json({success: true, name: "username"})
    })
    .post((req, res) => {
        userAuth()
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
        lecturerAuth()
        const { firstName, lastName, username, middleName, school, gender, password, phoneNumber, dateCreated, state} = req.body
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
                            state: state, 
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
        userAuth()
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
                    User.findOne({matricNumber: req.body.username}, (err, result) => {
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
        lecturerAuth()
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
                                Lecturer.find({state: state}, (err, result0) => {
                                    if(err) {
                                        res.status(200).json({success: false, err: err, })
                                    } else {
                                        if(result0.length > 0) {
                                            result0.sort((a, b) => a.students.length - b.students.length);
                                            console.log(result0[0]);
                                            User.updateOne({studentID: studentID}, {lecturerID: `${result0[0].lastName} ${result0[0].firstName}`}, (err, resultuser) => {
                                                if(err) {
                                                    console.log(resultuser);
                                                    res.status(200).json({success: false, err: err, name: studentID})
                                                } else {
                                                    Lecturer.updateOne({_id: result0[0]._id}, { $push: { students: studentID }}, (err, result) => {
                                                        if(err) {
                                                            res.status(200).json({success: false, err: err, name: studentID})
                                                        } else {
                                                            res.status(200).json({success: true, message: "Successfully Updated", details: result})
                                                        }
                                                    })
                                                }
                                            })
                                        } else {
                                            res.status(200).json({success: true, message: "No lecturer found", details: result})
                                        }
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
                                Lecturer.find({state: state}, (err, result0) => {
                                    if(err) {
                                        res.status(200).json({success: false, err: err, })
                                    } else {
                                        if(result0.length > 0) {
                                            result0.sort((a, b) => a.students.length - b.students.length);
                                            console.log(result0[0]);
                                            User.updateOne({studentID: studentID}, {lecturerID: `${result0[0].lastName} ${result0[0].firstName}`}, (err, resultuser) => {
                                                if(err) {
                                                    res.status(200).json({success: false, err: err, name: studentID})
                                                } else {
                                                    console.log(resultuser);
                                                    Lecturer.updateOne({_id: result0[0]._id}, { $push: { students: studentID }}, (err, result) => {
                                                        if(err) {
                                                            res.status(200).json({success: false, err: err, name: studentID})
                                                        } else {
                                                            res.status(200).json({success: true, message: "Successfully Updated", details: result})
                                                        }
                                                    })
                                                }
                                            })
                                        } else {
                                            res.status(200).json({success: true, message: "No lecturer found", details: result})
                                        }
                                    }
                                })
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
        const { studentID, monday, tuesday, wednesday, thursday, friday, week, date, timeStamp} = req.body
        Report.findOne({studentID: studentID, date: date, week: week }, (err, result) => {
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
                            date: date,
                            timeStamp: timeStamp,
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
                        date: date,
                        timeStamp: timeStamp,
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
    .post((req, res) => {
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


app.route("/student/company")
    .post((req, res) => {
        const { studentID } = req.body
        WorkDatails.findOne({studentID: studentID}, (err, result) => {
            if(err) {
                res.status(200).json({success: false, err: err})
            } else {
                console.log(req.body);
                if(result) {
                    res.status(200).json({success: true, details: result})
                } else {
                    res.status(200).json({success: false, err: "Not found"})

                }
            }
        })
    })
    .post((req, res) => {
        
    });



app.route("/student/reports")
    .post((req, res) => {
        const { studentID } = req.body
        Report.find({studentID: studentID}, (err, result) => {
            if(err) {
                res.status(200).json({success: false, err: err})
            } else {
                if(result) {
                    res.status(200).json({success: true, data: result})
                } else {
                    res.status(200).json({success: false, err: "Not found"})

                }
            }
        })
    })
    .get((req, res) => {
        
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




app.post('/upload-acceptance-letter', upload.single('file'), async (req, res) => {
    console.log("start")
    try {
        const filePath = req.file.path;
        const { secure_url } = await cloudinary.uploader.upload(filePath);
        console.log(secure_url); // check the value of secure_url

        const studentID = req.body.studentID;

        AcceptanceLetter.findOne({studentID: studentID}, (err, result) => {
            if(err) {
                return res.status(200).json({success: false, err: err});
            } else {
                if(result) {
                    AcceptanceLetter.updateOne(
                        {studentID: studentID},
                        {
                            image: secure_url
                        },
                        (err, result) => {
                            if(err) {
                                return res.status(200).json({success: false, err: err, studentID: studentID});
                            } else {
                                AcceptanceLetter.findOne({studentID: studentID}, (err, result) => {
                                    if(err) {
                                        return res.status(200).json({success: false, err: err, name: studentID});
                                    } else {
                                        return res.status(200).json({success: true, details: result});
                                    }
                                });
                            }
                        });
                }else{
                    AcceptanceLetter.insertMany({
                        studentID: studentID,
                        image: secure_url                            
                    }, (err, result) => {
                        if(err) {
                            return res.status(200).json({success: false, err: err});
                        } else {
                            if(result) {
                                return res.status(200).json({success: true, details: result[0]});
                            }
                        }
                    });
                }                 
            }
        });
    } catch (error) {
        console.error('Failed to upload file and save URL to database', error);
        return res.status(500).json({ message: 'Failed to upload file and save URL to database' });
    }
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








port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log("Server started on port " + port); 
})