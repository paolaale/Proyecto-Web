const mongoose = require("mongoose");
const { encrypt, correctPassword } = require('./chyper');
const { DEFAUTL_PROFILE } = require('./../imagesProfileUrls');

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
    imageProfile: {type: String, require: true},
    lastName: { type: String, required: true },
    age: { type: Number, required: true },
    grade: { type: String, required: true },
    city: { type: String, required: true },
    school: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    problemSet: [String],
    burstSet: [String],
    burstTopics: {
        additions: Number,
        substractions: Number,
        fractions: Number,
        divisions: Number,
        multiplications: Number,
        mixed: Number
    },
    problemSetDifficulty: {
        easy: Number,
        medium: Number,
        hard: Number
    },
    score: Number,
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
    problemType: String,
    type: String,
    answerOptions: [String],
    hints: [String],
    acceptancy: Number,
    numOfSubmits: Number,
    correctSubmits: Number
});

const blastSchema = mongoose.Schema({
    name: { type: String, required: true },
    id: { type: String, required: true },
    topic: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: String,
    problemsBlast: { type: [String], required: true }
});

// Creación de esquemas
const User = mongoose.model("User", userSchema);
const Problem = mongoose.model("Problem", problemSchema);
const Blast = mongoose.model("Blast", blastSchema);
// Commons


// Metodos publicos
const getUsers = async () => {
    const users = await User.find({}).sort({ score: -1 });
    return users;
};

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
    const hashPassword = await encrypt(password);
    const newUser = new User({
        name: name.toLowerCase(),
        imageProfile: DEFAUTL_PROFILE,
        lastName: lastName.toLowerCase(),
        age: parseInt(age),
        grade,
        city,
        school,
        email,
        password: hashPassword,
        score: 0.0,
        burstTopics: {
            additions: 0,
            substractions: 0,
            fractions: 0,
            divisions: 0,
            multiplications: 0,
            mixed: 0
        },
        problemSetDifficulty: {
            easy: 0,
            medium: 0,
            hard: 0
        },
        createdDate: new Date()
    });
    const createdUser = await newUser.save();
    return createdUser;
};

const loginUser = async userInfo => {
    const { email, password } = userInfo;
    const [credentials] = await User.find({ email }).exec();
    if (credentials) {
        const areCorrectCredentials = await correctPassword(password, credentials.password);
        if (areCorrectCredentials) {
            return credentials;
        }
        return null;
    }
    return null;
};

const updateUser = async (formInfo, userId) => {
    const validInputs = ['name', 'lastName', 'school', 'password', 'imageProfile'];

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
};

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
        problemType: info.problemType,
        type: info.type,
        resources: info.resource,
        answerOptions: info.multOpt,
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
    let filter = {};
    if (grade) {
        const sGrade = parseInt(grade);
        filter = { "schoolGrade": sGrade, "problemType": "Normal" };
    }
    else {
        filter = { "problemType": "Normal" };
    }

    const foundProblems = await Problem.find(filter).exec();
    if (foundProblems) {

        return foundProblems;
    }
    return null;
};

const getProblem = async problemId => {
    const foundProblem = await Problem.findById(problemId).exec();
    if (foundProblem) {
        return foundProblem;
    }
    return null;
};

const searchProblem = async info => {
    console.log();
    const foundProblems = await Problem.find({ $or: [{ name: { $regex: '.*' + info + '.*', $options: 'i' } }, { id: { $regex: '.*' + info + '.*', $options: 'i' } }] }).exec();
    if (foundProblems) {
        return foundProblems;
    }
    return null;
};

const addProblemToUser = async (problemsId, userId) => {
    const user = await getUserInfo(userId);
    const setOfProblems = user.problemSet;

    for (let i = 0; i < problemsId.length; i++) {

        if (!setOfProblems.includes(problemsId[i])) {
            user.problemSet.push(problemsId[i]);
            const problem = await Problem.findById(problemsId[i]);
            user.score = user.score + problem.points;

            if (problem.difficulty === "Fácil") {
                user.problemSetDifficulty.easy = user.problemSetDifficulty.easy + 1;
            }
            else if (problem.difficulty === "Media") {
                user.problemSetDifficulty.medium = user.problemSetDifficulty.medium + 1;
            }
            else {
                user.problemSetDifficulty.hard = user.problemSetDifficulty.hard + 1;
            }
            await user.save();
        }
    }
};

// blast methods
const addBlast = async (info) => {
    const newBlast = new Blast({
        name: info.name,
        id: info.id,
        topic: info.topic,
        description: info.description,
        difficulty: info.difficulty,
        problemsBlast: info.problems
    });

    newBlast.save(function (err) {
        if (!err) {
            console.log("Ráfaga creada correctamente");
        }
        else {
            console.log(err);
        }
    });
};

const loadBlasts = async () => {

    const foundBlasts = await Blast.find().exec();
    if (foundBlasts) {

        return foundBlasts;
    }
    return null;
};

const getBlast = async blastId => {
    const foundBlast = await Blast.findById(blastId).exec();

    if (foundBlast) {
        return foundBlast;
    }
    return null;
};

const addBlastToUser = async (blastId, userId) => {
    const user = await getUserInfo(userId);
    const setOfBlasts = user.burstSet;
    console.log(blastId);
    if (!setOfBlasts.includes(blastId)) {
        user.burstSet.push(blastId);
        const blast = await Blast.findById(blastId);


        if (blast.topic === "Sumas") {
            user.burstTopics.additions = user.burstTopics.additions + 1;
        }
        else if (blast.topic === "Restas") {
            user.burstTopics.substractions = user.burstTopics.substractions + 1;
        }
        else if (blast.topic === "Multiplicaciones") {
            user.burstTopics.multiplications = user.burstTopics.multiplications + 1;
        }
        else if (blast.topic === "Divisiones") {
            user.burstTopics.multiplications = user.burstTopics.multiplications + 1;
        }
        else if (blast.topic === "Fracciones") {
            user.burstTopics.fractions = user.burstTopics.fractions + 1;
        }
        else {
            user.burstTopics.mixed = user.burstTopics.mixed + 1;
        }
        await user.save();
    }

};

module.exports = {
    registerUser,
    loginUser,
    getUserInfo,
    updateUser,
    addProblem,
    loadProblems,
    getProblem,
    searchProblem,
    addProblemToUser,
    getUsers,
    addBlast,
    loadBlasts,
    getBlast,
    addBlastToUser
};