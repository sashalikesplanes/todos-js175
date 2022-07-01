// wrapper for handler in order to require a user to be signed in 

const requireSignIn = (handler) => {
  return (req, res, next) => {
    console.log("SIgned in ??", res.locals.signedIn);
    if (!res.locals.signedIn) {
      res.redirect("/users/signin");
    } else {
      handler(req, res,next);
    }
  }
};

module.exports = requireSignIn;
