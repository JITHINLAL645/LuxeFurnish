import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url";
import userRouter from "./routes/userRoutes.js";
import session from "express-session";
import adminRouter from './routes/adminRouter.js';
import MongoStore from 'connect-mongo';
import passport from "./config/passport.js";
import methodOverride from 'method-override';
// import connectMongo from 'connect-mongo';
// import commonFunctions from './common_functions.js'; // ES Module





const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(methodOverride('_method'));


app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

// Body-parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// Ensure SESSION_SECRET is defined
if (!process.env.SESSION_SECRET) {
  console.error("SESSION_SECRET is not defined in .env file");
  process.exit(1);
}

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 3 * 24 * 60 * 60,
      autoRemove: 'native',
    }),
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    },
  })
);

// Initialize Passport for authentication
app.use(passport.initialize());
app.use(passport.session());

// Set EJS as the view engine
app.set("view engine", "ejs");

// Define the view directory
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "Public")));

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

// Define routers
app.use("/", userRouter);
app.use("/admin", adminRouter);

connectDB();

// Start the server
const PORT = process.env.PORT 
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
