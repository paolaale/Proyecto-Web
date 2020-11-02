const mongoose = require("mongoose");
const { encrypt, correctPassword } = require('./chyper');

const dbConfig = {
    dbName: 'leetmatDB',
    password: 'nqFPYekqgWAVE0pX'
}

let urlConnection = 'mongodb+srv://leetmate:<password>@web-cluster.9md0b.mongodb.net/<dbname>?retryWrites=true&w=majority'
urlConnection = urlConnection.replace('<password>', dbConfig.password).replace('<dbname>', dbConfig.dbName);

mongoose.connect(urlConnection, { useNewUrlParser: true, useUnifiedTopology: true });

// Delaración de esquemas
const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    lastName: { type: String, required: true },
    age: { type: Number, required: true },
    grade: { type: String, required: true },
    city: { type: String, required: true },
    school: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    problemSet: [String],
    burstSet: [String],
    problemSetDifficulty: {
        easy: [String],
        medium: [String],
        hard: [String]
    },
    score: mongoose.Decimal128,
    rankingPosition: Number,
    createdDate: Date
});

const problemSchema = mongoose.Schema({
    name: { type: String, required: true },
    id: { type: String, required: true },
    topic: { type: String, required: true },
    description: { type: String, required: true },
    schoolGrade: { type: Number, required: true },
    points: Number,
    difficulty: { type: String, required: true },
    solution: { type: String, required: true },
    explanation: String,
    resources: [String],
    hints: [String],
    acceptancy: Number,
    numOfSubmits: Number,
    correctSubmits: Number
});

// Creación de esquemas
const User = mongoose.model("User", userSchema);
const Problem = mongoose.model("Problem", problemSchema);

// Commons
const calculateRanking = async score => {
    const totalUsers = await User.find({ score: { $gt: score } });
    return (totalUsers.length + 1);
}


// Metodos publicos
const getUserInfo = async userId => {
    const user = await User.findById(userId);
    return user;
};

const registerUser = async userInfo => {
    const { name, lastName, age, grade, city, school, email, password } = userInfo;
    const [existUser] = await User.find({ email }).exec();
    if (existUser) {
        return false;
    }
    const rankingPosition = await calculateRanking(0);
    const hashPassword = await encrypt(password);
    const newUser = new User({
        name: name.toLowerCase(),
        lastName: lastName.toLowerCase(),
        age: parseInt(age),
        grade,
        city,
        school,
        email,
        password: hashPassword,
        score: 0,
        rankingPosition,
        createdDate: new Date()
    });
    const createdUser = await newUser.save();
    return createdUser;
};

const loginUser = async userInfo => {
    const { email, password } = userInfo;
    const [credentials] = await User.find({ email }).exec();
    if (credentials) {
        areCorrectCredentials = await correctPassword(password, credentials.password);
        if (areCorrectCredentials) {
            return credentials;
        }
        return null;
    }
    return null;
};

const updateUser = async (formInfo, userId) => {
    const validInputs = ['name', 'lastName', 'school', 'password'];

    const arrayInputs = validInputs.filter(ele => {
        return formInfo[ele] !== '';
    });

    if (validInputs.includes('password')) {
        formInfo['password'] = await encrypt(formInfo['password']);
    }

    const newInputs = {};
    arrayInputs.forEach(e => {
        newInputs[e] = formInfo[e];
    });

    await User.updateOne(
        { _id: userId },
        newInputs
    ).catch(error => {
        console.error(error);
    });
    return 0;
}

const addProblem = (info) => {
    const newProblem = new Problem({
        name: info.name,
        id: info.id,
        topic: info.topic,
        description: info.description,
        schoolGrade: info.grade,
        points: info.points,
        difficulty: info.difficulty,
        solution: info.solution,
        explanation: info.explanation,
        resources: info.resource,
        hints: info.hint,
        acceptancy: 0,
        numOfSubmits: 0,
        correctSubmits: 0
    });

    newProblem.save(function (err) {
        if (!err) {
            console.log("Exito");
        }
        else {
            console.log(err);
        }
    });
};

const loadProblems = async grade => {
    const sGrade = parseInt(grade);
    const foundProblems = await Problem.find({ "schoolGrade": sGrade }).exec();
    if (foundProblems) {
        return foundProblems;
    }
    return null;
};

module.exports = {
    registerUser,
    loginUser,
    getUserInfo,
    updateUser,
    addProblem,
    loadProblems
};