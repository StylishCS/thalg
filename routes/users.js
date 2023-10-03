var express = require("express");
var router = express.Router();
const auth = require("../middlewares/protect");
const {
  signupController,
  resendOTP,
  verifyUser,
} = require("../controller/signupController");
const {loginController} = require("../controller/loginController")

router.post("/signup", signupController);
router.post("/resend-otp", resendOTP);
router.post("/verify",auth, verifyUser);
router.post("/login", loginController);

module.exports = router;
