import User from "../models/userschema.js";

const userAuth = (req, res, next) => {
    if (req.session.passport.user) {
        User.findById(req.session.passport.user)
            .then(data => {
                if (data && !data.isBlocked) {
                    next(); 
                } else {
                    res.redirect("/login"); 
                }
            })
            .catch(err => {
                console.log("error in user auth middleware"); 
                res.status(500).send("Internal server error")
            });
    } else {
        res.redirect("/login"); 
    }
};

const adminAuth= (req,res,next)=>{
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next()
        }else{
            res.redirect("/admin/login")
        }
    })
    .catch(error=>{
        console.log("Erroring in admin auth middleware",error);
        res.status(500).send("Internal server error")
        
    })
}



export{
    userAuth,
    adminAuth
} 
