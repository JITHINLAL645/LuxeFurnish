import User from "../../models/userschema.js";
import Product from "../../models/productSchema.js";
import category from "../../models/categorySchema.js";
import Address from "../../models/addressSchema.js"
// routes/userRoutes.js
import Cart from "../../models/cartSchema.js";
import Order from "../../models/orderSchema.js";
import wishlist from "../../models/wishlistSchema.js"
import Wallet from '../../models/walletSchema.js'; 

import dotenv from 'dotenv';
dotenv.config();
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Wishlist from "../../models/wishlistSchema.js";
import { log } from "console";






// Define the loadSignup function
const loadSignup = (req, res) => {
  try {
    return res.render("user/signup"); // Render the signup page
  } catch (error) {
    console.log("Signup page not found");
    res.status(500).send("Server error");
  }
};


// const LoadHomepage = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = 6;
//   const skip = (page - 1) * limit;
//   const searchParams = {
//     search: req.query.search || '',     
//     minPrice: req.query.min_price || 0,  
//     maxPrice: req.query.max_price || Infinity, 
//     sort: req.query.sort || 'newest'     
//   };

//   try {
//       const Category = await category.find({ isDeleted: false }).lean();
//     const totalProducts = await product.countDocuments({ isDelete: false });
//     const totalPages = Math.ceil(totalProducts / limit);

//     const user = await User.findById(req.session?.passport?.user);

//     console.log(user);

//       const Products = await product.find({ isDelete: false }).populate('offer')
//       .skip(skip)
//       .limit(limit)
//       .lean();



//     res.render('user/home', {
//       user: user, 
//       Category: category,
//       products: Products,
//       currentPage: page,
//       totalPages: totalPages,

//     });
//   } catch (error) {
//     console.error('Error loading user home page:', error);
//     res.status(500).send('An error occurred while loading the page');
//   }
// };
const LoadHomepage = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const skip = (page - 1) * limit;
  const searchParams = {
    search: req.query.search || '',
    minPrice: req.query.min_price || 0,
    maxPrice: req.query.max_price || Infinity,
    sort: req.query.sort || 'newest'
  };

  try {
    const Category = await category.find({ isDeleted: false }).lean();

    const totalProducts = await Product.countDocuments({ isDelete: false });
    const totalPages = Math.ceil(totalProducts / limit);

    const user = await User.findById(req.session?.passport?.user);
    console.log(user);

    const Products = await Product.find({ isDelete: false })
      .populate('offer')
      .skip(skip)
      .limit(limit)
      .lean();

    res.render('user/home', {
      user: user,
      Category: Category,  
      products: Products, 
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error('Error loading user home page:', error);
    res.status(500).send('An error occurred while loading the page');
  }
};




const singleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const Product = await Product.findById(id).populate('category_id').populate('offer')
    const Category = await Product.find({ category_id: Product.category_id._id }).populate('offer')
    const user = await User.findById(req.session.userId).lean();
    const cart = await Cart.findOne({ user: user._id }).populate("items.product");
    const wishlist = await wishlist.findOne({ user: req.session.userId }).populate('items.product')

    let cartCount = 0;
    if (cart && cart.items && cart.items.length > 0) {
      cart.items.forEach(item => {
        cartCount += item.quantity;
      });
    }

    let wishlistCount = 0
    if (wishlist) {
      wishlistCount = wishlist.items.length
    }
    console.log(Product)

    res.render('user/single-product', { Product, Category, cartCount, wishlistCount, user });
  } catch (err) {
    console.error(err);
    res.redirect('/userHomePage');
  }
}


const resendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData;
    console.log(req.session.userData);
    if (!email) {
      return res.status(400).json({ success: false, message: "Email not found in session" })
    }
    const otp = generateOtp();
    req.session.userOtp = otp;
    console.log(req.session.userOtp);

    const emailSent = await sendVerificationEmail(email, otp)
    if (emailSent) {
      console.log("resend otp", otp);
      res.status(200).json({ success: true, message: "OTP resend successfully" })
    } else {
      res.status(500).json({ success: false, message: "Failed to send otp" })
    }
  } catch (error) {
    console.error("Error resending otp", error)
    res.status(500).json({ success: false, message: "Internal server error.please try again" })

  }
}



// pageNotFound function
/* const pageNotFound = (req, res) => {

  res.status(404).render("pagenotfound"); // Render the 404 page
}; */

// Function to generate OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}




// Function to send OTP email
async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.nodemailer_EMAIL,
        pass: process.env.nodemailer_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.nodemailer_EMAIL,
      to: email,
      subject: "Verify your account",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP: ${otp}</b>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email", error);
    return false;
  }
}




const signup = async (req, res) => {
  try {
    const { name, phone, email, Password, cPassword } = req.body;

    // Check if passwords match
    if (Password !== cPassword) {
      return res.render("user/signup", { message: "Passwords do not match" });
    }

    // Check if the user already exists
    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render("user/signup", { message: "User with this email already exists" });
    }

    // Generate OTP
    const otp = generateOtp();
    console.log(otp);


    // Send OTP via email
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.render("user/signup", { message: "Error sending email" });
    }

    // Store OTP and user data in session (using the correct variable names)
    req.session.userOtp = otp;
    req.session.userData = {
      name: name,
      email: email,
      phone: phone,
      password: Password
    };



    // Render OTP verification page with showResend variable
    return res.render("user/verify-otp", { errorMessage: '', showResend: true });
  } catch (error) {
    console.error("Signup error:", error);
    //res.redirect("/pageNotFound");
  }
};




const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const storedOtp = req.session.userOtp;

    console.log(req.body)
    console.log(otp, storedOtp);

    // Check if session has expired or data is missing
    if (!storedOtp || !req.session.userData) {
      return res.json({ success: false, message: 'Session expired or invalid request.' });
    }

    // Initialize the incorrect attempt counter if it doesn't exist
    if (!req.session.otpAttempts) {
      req.session.otpAttempts = 0;
    }

    // Check if the entered OTP matches the stored OTP
    if (otp === storedOtp) {
      console.log('OTP match');

      // Save the user details into the database after OTP verification
      const { name, email, phone, password } = req.session.userData;

      // Check if the user already exists based on the email (to prevent duplicate registration)
      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return res.json({ success: false, message: 'User already registered with this email.' });
      }

      // Hash the password before saving it (make sure you use bcrypt or any other hashing library)
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user object to save
      const newUser = new User({
        name: name,
        email: email,
        phone: phone,
        password: hashedPassword,
        IsAdmin: 0,
        isBlocked: false,
        ...(req.session.userData.googleId && { googleId: req.session.userData.googleId })

      });

      await newUser.save();

      // Clear session data after user is saved
      req.session.userOtp = null;
      req.session.otpAttempts = 0;
      req.session.userData = null;

      return res.json({ success: true, message: 'User registered successfully!' });
    } else {
      // Increment incorrect attempts
      req.session.otpAttempts += 1;

      // Handle max incorrect attempts
      if (req.session.otpAttempts >= 3) {
        return res.json({
          success: false,
          message: 'You have exceeded the maximum number of attempts. Please request a new OTP.',
          showResend: true,
        });
      }

      // If OTP is incorrect but attempts are less than 3
      return res.json({
        success: false,
        message: 'Invalid OTP. Please try again.',
        showResend: false,
      });
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ success: false, message: 'Server error occurred during OTP verification.' });
  }
};




// Route to load the login page
const loadLogin = async (req, res) => {
  try {
    // Check if the user session exists, and redirect if the user is already logged in
    if (!req.session.User) {
      return res.render("user/login");
    } else {
      return res.redirect("/");  // Redirect to home if user is authenticated
    }
  } catch (error) {
    console.log("Load login error:", error);
    return res.render("user/pagenotfound");
  }
};

// Login logic
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Attempting to login with email:", email);

    // Find the user with the given email and not an admin
    const findUser = await User.findOne({ isAdmin: false, email: email });

    console.log('user : ', findUser);


    if (!findUser) {
      console.log("User not found");

      return res.render("user/login", { message: "User not found" });
    }

    // Check if the user is blocked
    if (findUser.isBlocked) {
      console.log("User is blocked");
      return res.render("user/login", { message: "User is blocked by admin" });
    }

    // Check if the password matches
    const passwordMatch = await bcrypt.compare(password, findUser.password);
    if (!passwordMatch) {
      console.log("Incorrect password");
      return res.render("user/login", { message: "Incorrect password" });
    }
    req.session.passport = {}
    req.session.passport.user = findUser._id
    console.log("asdfghjkiuytrewzxcvbnm", req.session.passport.user);


    // Redirect to home page after successful login
    return res.redirect("/");
  } catch (error) {
    console.log("Login error:", error);
    return res.render("user/login", { message: "Login failed. Try again later" });
  }
};



const productDetails = async (req, res) => {
  try {
    // Retrieve the product by its ID
    const products = await Product.findById(req.params.id);

    if (!products) {
      return res.status(404).send("Product not found");
    }

    // Pass the product data to the view
    console.log(products);
    return res.render("user/productdetails", { product: products });
  } catch (error) {
    console.error("Error fetching product:", error);
    // Send a more detailed error response
    return res.status(500).send("Something went wrong. Please try again later.");
  }
};



// const shop = async(req,res)=>{
//   try {
//     const products= await product.find({isDelete:false})
//     return res.render("user/shop",{products}); 

//   } catch (error) {
//     console.error(error);

//     return res.status(500).send("Something went wrong. Please try again later.");
//   }
// }
const shop = async (req, res) => {
  try {
    const { sort_by } = req.query;  // Get the sort parameter from the query string
    let products;

    console.log(req.query)

    // Default: products sorted by popularity (descending)
    let sortOptions = { popularity: -1 };

    switch (sort_by) {
      case 'price_low_to_high':
        sortOptions = { price: 1 };  // Ascending price
        break;
      case 'price_high_to_low':
        sortOptions = { price: -1 };  // Descending price
        break;
      case 'average_ratings':
        sortOptions = { ratings: -1 };  // Highest ratings first
        break;
      case 'featured':
        // Filter for featured products
        products = await Product.find({ isDelete: false, isFeatured: true }).lean();
        break;
      case 'new_arrivals':
        sortOptions = { createdAt: -1 };  // Newest first
        break;
      case 'a_z':
        sortOptions = { productname: 1 };  // Alphabetical (A-Z)
        break;
      case 'z_a':
        sortOptions = { productname: -1 };  // Reverse alphabetical (Z-A)
        break;
      default:
        sortOptions = { popularity: -1 };  // Default to sorting by popularity
    }

    // If the sorting is based on a field, perform the query with sorting
    if (!products) {
      products = await Product.find({ isDelete: false })
        .sort(sortOptions)
        .collation({ locale: 'en', strength: 2 }) // Case-insensitive sorting
        .lean();
    }

    return res.render('user/shop', { products });
  } catch (error) {
    console.error('Error loading shop page:', error);
    return res.status(500).send("Something went wrong. Please try again later.");
  }
};

const sortProducts = async (req, res) => {
  const sortBy = req.query.sort_by || 'popularity'; // Default to 'popularity' if no sort option is provided

  let sortedProducts;

  switch (sortBy) {
    case 'price_low_to_high':
      sortedProducts = await Product.find().sort({ price: 1 }); // Ascending order
      break;
    case 'price_high_to_low':
      sortedProducts = await Product.find().sort({ price: -1 }); // Descending order
      break;
    case 'average_ratings':
      sortedProducts = await Product.find().sort({ ratings: -1 }); // Highest ratings first
      break;
    case 'featured':
      sortedProducts = await Product.find().where('isFeatured').equals(true); // Featured products only
      break;
    case 'new_arrivals':
      sortedProducts = await Product.find().sort({ createdAt: -1 }); // Most recent first
      break;
    case 'a_z':
      sortedProducts = await Product.find().sort({ name: 1 }); // Alphabetical order (A-Z)
      break;
    case 'z_a':
      sortedProducts = await Product.find().sort({ name: -1 }); // Reverse alphabetical order (Z-A)
      break;
    default:
      sortedProducts = await Product.find().sort({ popularity: -1 }); // Default sorting by popularity
  }

  // Render the products page with the sorted products
  res.render('user/shop', { products: sortedProducts });
};


const loadprofile = async (req, res) => {
  // Check if the user is authenticated (session passport exists)
  if (!req.session.passport || !req.session.passport.user) {
    return res.redirect('/login'); // Redirect to login if user is not authenticated
  }

  const userId = req.session.passport.user; // Get the logged-in user ID from the session

  console.log('User ID:', userId);

  try {
    // Fetch the user details from the User model
    const user = await User.findById(userId);

    // Fetch the addresses associated with the logged-in user from the Address model
    const addresses = await Address.find({ userId: userId });

    // Render the profile page with the user and address data
    res.render('user/profile', {
      user,
      addresses,
      successMessage: req.query.success || '', // Display success message if available
    });
  } catch (error) {
    console.error(error);
    res.redirect('/page-404'); // Redirect to 404 page if there's an error
  }
};





const loadAddressPage = async (req, res) => {
  try {
    console.log();

    res.render('user/addAddress')
  } catch (error) {
    res.redirect('/page-404')
  }
}


const Add_Address = async (req, res) => {
  console.log(req.body);  // Log the request body to check for missing fields

  const {
    firstName,
    lastName,
    email,
    phoneNumber,
    altPhoneNumber,
    place,
    street,
    city,
    district,
    state,
    country,
    pincode,
    addressLine, // Ensure addressLine is provided
  } = req.body;

  const userId = req.session.passport?.user; // Safely access user ID

  if (!userId) {
    return res.status(400).json({ message: 'User not logged in. Please log in and try again.' });
  }

  // Check if required fields are missing
  if (!firstName || !lastName || !email || !phoneNumber || !city || !district || !state || !country || !pincode || !addressLine) {
    return res.status(400).json({ message: 'Missing required fields. Please check all required fields and try again.' });
  }

  try {
    // Create a new address object
    const newAddress = new Address({
      userId: userId, // Reference the logged-in user
      address: [
        {
          firstName, // Add firstName
          lastName,  // Add lastName
          email,     // Add email
          phoneNumber, // Add phoneNumber
          altPhoneNumber, // Add altPhoneNumber
          addressLine, // Add addressLine
          place,      // Add place (assumed to be addressLine)
          street,     // Add street
          city,       // Add city
          district,   // Add district
          state,      // Add state
          country,    // Add country
          pincode     // Add pincode
        }
      ]
    });

    // Save the address to the database
    await newAddress.save();

    // Redirect to the profile page with a success message
    res.redirect('/profile?success=Address added successfully');
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding address', error: error.message });
  }
};





const userlogout = async (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Could not log out.');
    }
    res.redirect('/');
  });
};



const loadChangePasswordPage = async (req, res) => {
  try {
    res.render('changepassword');
  } catch (error) {
    res.redirect('/page-404');
  }
};


const changepassword = async (req, res) => {
  const userId = req.session.passport.user;
  try {
    const { currentpassword, newpassword, confirmpassword } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.render('user/changepassword', { message: 'User not found.' });
    }


    const isMatch = await bcrypt.compare(currentpassword, user.password);
    if (!isMatch) {
      return res.render('user/changepassword', { message: 'current password is  incorrect' });
    }


    if (newpassword !== confirmpassword) {
      return res.render('user/changepassword', { message: 'passwords do not match' });
    }

    // const passwordPattern=/^(?=.[A-Za-z])(?=.\d).{8,}$/;
    const alphaPattern = /[a-zA-Z]/;



    if (!newpassword.match(alphaPattern)) {
      return res.render('user/changepassword', { message: 'set a 8 character strong password' });
    }

    const hashedPassword = await bcrypt.hash(newpassword, 10);
    user.password = hashedPassword;
    await user.save();


    res.redirect('/profile?success=Password changed successfully.');

  } catch (error) {
    console.log('Error changing password:', error);
    res.status(500).json({ error: 'Server error, please try again later.' });
  }

}


const loadEditAddresspage = async (req, res) => {
  try {
    const userId = req.session.passport?.user;
    const addressId = req.params.addressId;

    // Find the user by their userId and find the specific address using the addressId
    const user = await Address.findOne({ userId, "address._id": addressId });

    if (user) {
      // Extract the specific address from the array using the addressId
      const address = user.address.id(addressId);

      if (address) {
        // Render the edit page with the address details
        res.render('user/editAddress', { address });
      } else {
        res.status(404).send('Address not found');
      }
    } else {
      res.status(404).send('User or Address not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};



const updateAddress = async (req, res) => {
  try {
    const userId = req.session.passport?.user;
    const addressId = req.params.addressId;

    // Use MongoDB's $set to update the specific address in the array
    const updatedUser = await Address.findOneAndUpdate(
      { userId, "address._id": addressId }, // Find the user and the specific address
      {
        $set: {
          "address.$.firstName": req.body.firstName,
          "address.$.lastName": req.body.lastName,
          "address.$.addressLine": req.body.addressLine,
          "address.$.place": req.body.place,
          "address.$.street": req.body.street,
          "address.$.city": req.body.city,
          "address.$.district": req.body.district,
          "address.$.state": req.body.state,
          "address.$.country": req.body.country,
          "address.$.pincode": req.body.pincode,
          "address.$.phoneNumber": req.body.phoneNumber,
          "address.$.altPhoneNumber": req.body.altPhoneNumber,
          "address.$.email": req.body.email
        }
      },
      { new: true } // Return the updated document
    );

    if (updatedUser) {
      res.redirect('/profile?success=Address updated successfully');
    } else {
      res.status(404).send('Address not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
};


const deleteAddress = async (req, res) => {
  try {
    const userId = req.session.passport?.user; // Retrieve userId from session
    const addressId = req.params.addressId;    // Retrieve addressId from params

    // Use $pull to remove the specific address from the user's address array
    const updatedUser = await Address.findOneAndDelete(
      { userId },
      { address: { _id: addressId } }, // Pull the address by its _id
      { new: true } // Return the updated document
    );

    if (updatedUser) {
      return res.status(200).json({ message: 'Address deleted successfully.' });
    } else {
      return res.status(404).json({ message: 'Address not found.' });
    }
  } catch (error) {
    console.error('Error deleting address:', error);
    return res.status(500).json({ message: 'Server error, failed to delete address.' });
  }
};




const cart = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).send("User not authenticated.");
    }

    const userCart = await Cart.findOne({ user: userId, isDelete: false })
      .populate('items.product')
      .exec();

    if (!userCart) {
      return res.render('user/Cart', { cart: null, message: 'Your cart is empty.' });
    }

    return res.render('user/Cart', { cart: userCart });
  } catch (error) {
    console.error("Error fetching cart items:", error);
    return res.status(500).send("Something went wrong. Please try again later.");
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).send({ success: false, message: "User not authenticated." });
    }

    const { productId, quantity } = req.body;

    // Validate the input
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).send({ success: false, message: 'Invalid product ID or quantity.' });
    }

    // Find the cart for the user
    const userCart = await Cart.findOne({ user: userId, isDelete: false }).populate('items.product');

    if (!userCart) {
      return res.status(404).send({ success: false, message: 'Cart not found.' });
    }

    // Find the item in the cart and update its quantity
    const itemIndex = userCart.items.findIndex(item => item.product._id.toString() === productId);

    if (itemIndex !== -1) {
      userCart.items[itemIndex].quantity = quantity;
    } else {
      return res.status(404).send({ success: false, message: 'Product not found in cart.' });
    }

    // Save the updated cart
    await userCart.save();

    // Return the updated item and cart total
    const updatedItem = userCart.items[itemIndex];
    const totalCartPrice = userCart.items.reduce((total, item) => total + item.quantity * item.product.price, 0);

    return res.send({
      success: true,
      updatedItem: {
        productId: updatedItem.product._id,
        quantity: updatedItem.quantity,
        totalItemPrice: updatedItem.quantity * updatedItem.product.price,
      },
      totalCartPrice
    });
  } catch (error) {
    console.error('Error updating cart quantity:', error);
    return res.status(500).send({ success: false, message: "Something went wrong." });
  }
};




const addtocart = async (req, res) => {
  const productId = req.params.productId;
  const userId = req.session?.passport?.user;

  try {
    const product = await Product.findById(productId);
    const price = product.price
    console.log("product price",price);

    if (!product) {
      return res.status(404).send('Product not found');
    }

    let cart = await Cart.findOne({ user: userId });

    if (cart) {
      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

      if (itemIndex > -1) {
        // If the product is already in the cart, increase its quantity
        cart.items[itemIndex].quantity += 1;
      } else {
        // If the product is not in the cart, add it
        cart.items.push({ product: productId, quantity: 1, price });
      }
      await cart.save();  // Save the updated cart
    } else {
      // If no cart exists, create a new one
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity: 1, price }]
      });
    }

    res.redirect('/cart');

  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).send('Error adding product to cart');
  }
};




const deleteCart = async (req, res) => {
  try {
    const productId = req.params.productId;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user._id;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.product._id.toString() === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    res.redirect('/cart');
  } catch (error) {
    console.error('Error deleting cart item:', error);
    res.status(500).json({ message: 'Failed to delete cart item' });
  }
};


const checkout = async (req, res) => {
  try {
    const userId = req.user._id; 

    const addresses = await Address.find({ userId: userId });
    const cart = await Cart.findOne({user:userId})

    const addressDetails = addresses.map(address => address.address).flat(); 

    // Calculate total amount
    let totalAmount = 0;
    cart.items.forEach(item => {
      totalAmount += item.price * item.quantity; 
    });

    const estimatedDelivery = "2024-12-05";  
    console.log("totAL AMD:",totalAmount);

    res.render('user/checkout', { 
      addresses: addressDetails,
      totalAmount: totalAmount,
      estimatedDelivery: estimatedDelivery,
      cartItems: cart.items
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
};



const checkoutupdateAddress = async (req, res) => {
  try {
    cons

    const {
      id,  // Address ID
      first_name,
      last_name,
      email,
      street_address,
      city,
      zipCode,
      phone_number,
      comment,
      create_account,
      different_address,
    } = req.body;

    // Basic validation for required fields
    if (!id || !first_name || !last_name || !email || !street_address || !city || !zipCode || !phone_number) {
      return res.status(400).send('Please fill in all required fields.');
    }

    // Log the extracted data
    console.log("Form Data:", {
      id,
      first_name,
      last_name,
      email,
      street_address,
      city,
      zipCode,
      phone_number,
      comment,
      create_account,
      different_address,
    });

    const orderDetails = {
      firstName: first_name,
      lastName: last_name,
      email,
      addressLine: street_address,
      city,
      district: city, 
      state: "",  
      country: "",  
      pincode: zipCode,
      phoneNumber: phone_number,
      altPhoneNumber: "", 
      comment,
    };

    const updatedAddress = await Address.findOneAndUpdate(
      { "address._id": id },  
      { $set: { "address.$": orderDetails } }, 
      { new: true }  
    );

    if (!updatedAddress) {
      console.error("Address not found with ID:", id);
      return res.status(404).send('Address not found.');
    }

    console.log('Updated Address:', updatedAddress);

    return res.redirect('/checkout'); 
  } catch (error) {
    console.error('Error processing checkout:', error);
    return res.status(500).send('Error processing checkout');
  }
};


const successpage = (req, res) => {
  try {
    console.log("order sucess..");
    res.render('user/successpage');
  } catch (error) {
    console.error('Error rendering success page:', error);
    res.status(500).send('Internal Server Error');
  }
};


const getOrder = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;

  try {
    const userId = req.session.passport.user;

    if (!userId) {
      return res.redirect("/login");
    }

    const user = await User.findById(userId).lean();
    const userEmail = user.email
    console.log("user email", userEmail);
    

    const cart = await Cart.findOne({ user: userId });
    
    const cartCount = cart && cart.items ? cart.items.length : 0;

    const allOrders = await Order.find({"address.email":userEmail})
    console.log("all orders", allOrders);

    const [orders, totalOrders] = await Promise.all([
      Order.find({ user: userId })
        .populate('items.product')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ user: userId })
    ]);
    

    orders.forEach(order => {
      order.items = order.items.filter(item => item.product);
    });

    const totalPages = Math.ceil(totalOrders / limit);

    console.log(orders)

    res.render('user/orders', {
      orders: allOrders,
      currentPage: page,
      totalPages,
      limit,
      cartCount,
      wishlistCount: cart && cart.wishlist ? cart.wishlist.length : 0,
      user 
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


const placeorder = async (req, res) => {
  try {
    console.log("this is data", req.body);

    const { totalAmount, deliveryAddress, estimatedDelivery } = req.body;

    const parsedAddressOg = await Address.findOne({
      address: {
        $elemMatch: { _id: deliveryAddress }
      }
    });
    const parsedAddress = parsedAddressOg.address[0]
    const userId = req.session.passport.user;

    const userCart = await Cart.findOne({ user: userId, isDelete: false });

    if (!userCart || userCart.items.length === 0) {
      return res.status(404).json({
        message: 'Your cart is empty. Cannot place an order.'
      });
    }

    const newOrder = new Order({
      orderItems: userCart.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price
      })),
      totalPrice: totalAmount,
      finalAmount: totalAmount, 
      address: {
        firstName: parsedAddress.firstName,
        lastName: parsedAddress.lastName,
        addressLine: parsedAddress.addressLine,
        city: parsedAddress.city,
        district: parsedAddress.district,
        state: parsedAddress.state,
        country: parsedAddress.country,
        pincode: parsedAddress.pincode,
        phoneNumber: parsedAddress.phoneNumber,
        altPhoneNumber: parsedAddress.altPhoneNumber,
        email: parsedAddress.email
      },
      status: 'Pending', 
      couponApplied: false 
    });

    const savedOrder = await newOrder.save();

    console.log('Order placed:', savedOrder);

    ({
      message: 'Order placed successfully!',
      order: savedOrder
    });


  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({
      message: 'Failed to place order',
      error: error.message
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;  
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus === 'Cancelled') {
        return res.status(400).json({ message: "Order is already cancelled" });
    }

    if (['Shipped', 'Delivered'].includes(order.orderStatus)) {
        return res.status(400).json({ message: "Cannot cancel order at this stage" });
    }

    order.orderStatus = 'Cancelled';
    order.orderStatusTimestamps.cancelled = new Date();

    for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: item.quantity }
        });
    }

    await order.save();

    res.status(200).json({ message: "Order cancelled successfully", redirect: "/orderHistory" });

  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


const loadForgot = async (req,res)=>{
  res.render('user/forgotPassword')
}


const post_ResetPage = async (req, res) => {
  const { email } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) {
      return res.status(404).json({ error: 'No user with that email found.' });
  }

  
  const token = crypto.randomBytes(20).toString('hex');
  

 
  res.cookie('resetToken', token, {
      httpOnly: true,
      maxAge: 2 * 60 * 1000, 
      secure: false 
  });
  res.cookie('resetEmail', email, {
      httpOnly: true,
      maxAge: 2 * 60 * 1000, 
      secure: false 
  });

 
  const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
          user: process.env.NODEMAILER_EMAIL,
          pass: process.env.NODEMAILER_PASSWORD
      }
  });

  // Email options
  const mailOptions = {
      to: user.email,
      from: process.env.NODEMAILER_EMAIL,
      subject: 'Password Reset',
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:\n\n
      http://localhost:3000/getRestPassword/${token}\n
      If you did not request this, please ignore this email and your password will remain unchanged.\n`
  };

  
  transporter.sendMail(mailOptions, (err) => {
      if (err) {
          console.error('Error sending email:', err);
          return res.status(500).json({ error: 'There was an error sending the email. Please try again.' });
      }
      return res.status(200).json({ success: true, message: 'Password reset email sent.' });
  });
};


const get_RestPassword = async (req, res) => {
  try {
      const { token } = req.params;
      const resetToken = req.cookies.resetToken;

      if (!resetToken) {
          return res.status(400).send('Reset token cookie not found. It may have expired.');
      }

      if (resetToken !== token) {
          return res.render('user/error'); 
      }
      
      res.render('user/changepwd');
  } catch (error) {
      console.error('Error in get_RestPassword:', error);
      res.status(500).send('An error occurred while processing your request.');
  }
};


const postResetPassword = async (req, res) => {
  try {
      const { newPassword } = req.body;
      const resetEmail = req.cookies.resetEmail;
      
      const user = await User.findOne({email:resetEmail});
      if (!user) {
          return res.json({success:false})
      }
  
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedPassword;
  
      
      await user.save();
  res.json({success:true})
  } catch (error) {
     console.log(error) 
  }
  
};



const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const Razorpayorder = async (req, res) => {
  try {
      const { amount, currency, receipt } = req.body;

      const options = {
          amount: amount * 100, // Convert amount to smallest currency unit
          currency: currency || "INR",
          receipt: receipt || "receipt#1",
          payment_capture: 1 // 1 for automatic capture, 0 for manual
      };

      const order = await razorpayInstance.orders.create(options);

      if (!order) return res.status(500).send("Some error occurred");

      res.json(order);
  } catch (error) {
      res.status(500).send(error);
  }
};


const verifyPayment = (req, res) => {
  try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature === razorpay_signature) {
          res.json({ success: true, message: "Payment Verified Successfully" });
      } else {
          res.status(400).json({ success: false, message: "Invalid Signature" });
      }
  } catch (error) {
      res.status(500).send(error);
  }
};

const loadWishlist = async (req, res) => {
  try {
    // Ensure the user is authenticated, using `req.user` from the session
    if (!req.user) {
      console.error('User not authenticated');
      return res.status(401).send('Please login to access your wishlist');
    }

    const userId = req.user.id; // Get the user ID from the session

    // Fetch user details from the database (you can skip this if user is already in session)
    const user = await User.findById(userId).lean();
    if (!user) {
      console.error('User not found');
      return res.status(404).send('User not found');
    }

    // Fetch the wishlist for the user
    const result = await wishlist.findOne({ user: userId }).populate('items.product');
    console.log("wishlist :",result);
    let wishlistCount = 0;
    if (result) wishlistCount = result.items.length;

    // Fetch the cart for the user
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    let cartCount = 0;
    if (cart) cartCount = cart.items.length;

    // Render the wishlist page with the necessary data
    res.render('user/wishlist', { wishlist:result, wishlistCount, cartCount, user });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).send('Something went wrong!');
  }
};

const add_Wishlist = async (req, res) => {
  try {
    const productId = req.params.productId; 
    
    const user = await User.findById(req.session.passport.user);
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let wishlist = await Wishlist.findOne({ user: user._id });

    if (!wishlist) {
      wishlist = new Wishlist({ user: user._id, items: [] });
    }

    const existingItemIndex = wishlist.items.findIndex((item) => item.product.equals(productId));
    
    if (existingItemIndex > -1) {
      return res.status(400).json({ success: false, message: "Product already in wishlist" });
    }

    wishlist.items.push({
      product: productId,
      quantity: 1
    });

    await wishlist.save();
    return res.status(200).json({ success: true, message: "Product added to wishlist" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};


const remove_WishlistItem = async (req, res) => {
  try {
    const { itemId } = req.params; // Get itemId from the URL params
    const userId = req.session.passport.user; // Assuming userId is stored in session

    console.log('User ID:', userId); // Debugging step
    console.log('Item ID:', itemId); // Debugging step

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not logged in" });
    }

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      console.log('Wishlist not found for user:', userId); // Debugging step
      return res.status(404).json({ success: false, message: "Wishlist not found" });
    }

    // Find the product in the wishlist
    const itemIndex = wishlist.items.findIndex(item => item.product.toString() === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Item not found in wishlist" });
    }

    // Remove the item from the wishlist
    wishlist.items.splice(itemIndex, 1);

    // Save the updated wishlist
    await wishlist.save();

    return res.status(200).json({ success: true, message: "Item removed from wishlist" });
  } catch (error) {
    console.error('Error removing item from wishlist:', error);
    return res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};




const load_walletPage = async (req, res) => {
  try {
    // Ensure that the user is logged in by checking req.session.userId
    if (!req.session.passport.user) {
      return res.redirect('/login'); // or send an appropriate error message
    }

    const user = await User.findById(req.session.passport.user).lean();
    
    // Check if user exists
    if (!user) {
      return res.status(404).send('User not found');
    }

    const cart = await Cart.findOne({ user: user._id }).populate("items.product");
    const wishlist = await Wishlist.findOne({ user: req.session.passport.user }).populate('items.product');
    
    let cartCount = 0;
    if (cart && cart.items && cart.items.length > 0) {
      cart.items.forEach(item => {
        cartCount += item.quantity;
      });
    }

    let wishlistCount = 0;
    if (wishlist) {
      wishlistCount = wishlist.items.length;
    }

    let wallet = await Wallet.findOne({ user: user._id });
    if (wallet && wallet.wallet_history) {
      wallet.wallet_history.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    if (!wallet) {
      wallet = new Wallet({
        user: user._id,
        balance: 0,
        wallet_history: [],
      });
      await wallet.save();
    }

    res.render('user/wallet', { user, cartCount, wishlistCount, wallet });

  } catch (error) {
    console.error('Error loading user home page:', error);
    res.status(500).send('An error occurred while loading the page');
  }
};



export {
  LoadHomepage,
  // pageNotFound, 
  verifyOtp,
  loadSignup,
  signup,
  resendOtp,
  login,
  loadLogin,
  productDetails,
  singleProduct,
  shop,
  loadprofile,
  loadAddressPage,
  Add_Address,
  userlogout,
  changepassword,
  loadEditAddresspage,
  updateAddress,
  deleteAddress,
  cart,
  updateCartQuantity,
  addtocart,
  deleteCart,
  checkout,
  checkoutupdateAddress,
  sortProducts,
  successpage,
  getOrder,
  placeorder,
  cancelOrder,
  loadForgot,
  post_ResetPage,
  get_RestPassword,
  postResetPassword,
  Razorpayorder,
  verifyPayment,
  loadWishlist,
  add_Wishlist,
  remove_WishlistItem,
  load_walletPage
};
