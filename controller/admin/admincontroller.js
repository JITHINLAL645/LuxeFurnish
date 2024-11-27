import User from "../../models/userschema.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

// admincontroller.js

const loadLogin = (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect("/admin/dashboard");
    }

    res.render("admin/login", { message: null });
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await User.findOne({ email, isAdmin:true });
        if (admin) {
            const passwordMatch = await bcrypt.compare(password, admin.password);
            if (passwordMatch) {
                req.session.isAdmin = true;
                return res.redirect("/admin/dashboard")
            } else {
                return res.redirect("/admin/login")
            }
        } else {
            return res.redirect("/admin/login")
        }
    } catch (error) {
        console.log("login error", error);
        return res.redirect("/user/pagenotfound")

    }
}


const loadDashboard = async (req, res) => {
    if (req.session.isAdmin) {
        try {
            res.render("admin/dashboard"); 
        } catch (error) {
            console.log("Dashboard error:", error);
            //res.redirect("/user/pagenotfound");
        }
    } else {
        res.redirect("/admin/login"); 
    }
};


const logout = (req, res) => {
    req.session.destroy()
    res.redirect("/admin/login")

    /* try {
        req.session.destroy(err=>{
            if(err){
                console.log("Error destroying session");
                return res.redirect("/pagenotfound")
            }
            res.redirect("/admin/login")
        })
    } catch (error) {
        console.log("unexpected error during",error);
        res.redirect("/pagenotfound")
        
    } */
}





export {
    loadLogin,
    login,
    loadDashboard,
    logout
};
