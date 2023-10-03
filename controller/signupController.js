const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { nanoid } = require("nanoid");
const {
  getEmail,
  insertUser,
  insertOTP,
  getId,
  insertToken,
  getUser,
  getUser2,
  getEmailInfo,
  deleteOTP,
  getOTP,
  verify,
} = require("../services/signupServices");

async function signupController(req, res) {
  try {
    const nId = await nanoid(10);
    const mail = await getEmail(req.body.email);
    if (await getEmail(req.body.email)) {
      return res.status(400).json({ msg: "email already registered" });
    }
    const user = {
      id: nId,
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email,
      password: await bcrypt.hash(req.body.password, 10),
    };
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      service: "Gmail",
      port: 587,
      secure: false,
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });
    let otp = Math.floor(1000 + Math.random() * 9000);
    let message = {
      from: "Thalg",
      to: req.body.email,
      subject: "Verify",
      text: `otp is ${otp}`,
      html: `<p>otp is<br> <h1>${otp}</h1><br><h3>Your code will expire in 2 minutes</h3></p>`,
    };
    otp = bcrypt.hashSync(String(otp), 10);
    await transporter.sendMail(message).catch((error) => {
      return res.status(500).json({ msg: "INTERNAL SERVER ERROR" });
    });

    const d = new Date();
    d.setMinutes(d.getMinutes());
    const d2 = new Date();
    d2.setMinutes(d2.getMinutes() + 2);

    let obj2 = {
      otp: otp,
      createdAt: Number(d),
      expiresAt: Number(d2),
      id: nId,
    };
    await insertOTP(obj2);
    await insertUser(user);
    const id = await getId(user.email);
    const token = jwt.sign({ userId: id }, process.env.JWT_SECRET_KEY, {
      expiresIn: process.env.JWT_EXPIRE_TIME,
    });

    return res.status(201).json({ data: user, token: token });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "INTERNAL SERVER ERROR" });
  }
}

async function resendOTP(req, res) {
  const user = await getEmailInfo(req.body.email);
  if (user == "") {
    return res.status(404).json({ msg: "user not found..." });
  }
  if (user[0].verified == true) {
    return res.status(400).json({ msg: "user already verified" });
  }
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    service: "Gmail",
    port: 587,
    secure: false,
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });

  let otp = await Math.floor(1000 + Math.random() * 9000);
  let message = {
    from: "Thalg",
    to: req.body.email,
    subject: "Verify",
    text: `Your OTP is ${otp}`,
    html: `<p>otp is<br> <h1>${otp}</h1><br><h3>Your code will expire in 2 minutes</h3></p>`,
  };
  otp = bcrypt.hashSync(String(otp), 10);
  await transporter.sendMail(message).catch((error) => {
    console.log(error);
  });

  const d = new Date();
  d.setMinutes(d.getMinutes());
  const d2 = new Date();
  d2.setMinutes(d2.getMinutes() + 20);

  let obj2 = {
    otp: otp,
    createdAt: Number(d),
    expiresAt: Number(d2),
    id: user[0].id,
  };
  await deleteOTP(user[0].id);
  await insertOTP(obj2);
  res.status(201).json({ msg: "OTP sent..." });
}

async function verifyUser(req, res) {
  if (!(await getEmail(req.body.email))) {
    return res.status(404).json({ msg: "User not found..." });
  }
  const user = await getEmailInfo(req.body.email);
  const otp = await getOTP(user[0].id);
  let d = new Date();
  if (otp == "") {
    return res.status(404).json({ msg: "No OTP was sent..." });
  }
  console.log(otp[0].otp);
  if (!(await bcrypt.compare(req.body.otp, otp[0].otp))) {
    return res.status(401).json({ msg: "Authentication failed..." });
  }
  if (!(Number(d) < Number(otp[0].expiresAt))) {
    return res
      .status(400)
      .json({ msg: "OTP has expired, please try again..." });
  }
  const state = await verify(user[0].id);
  if (!state) {
    return res.status(500).json({ msg: "INTERNAL SERVER ERROR" });
  }
  await deleteOTP(user[0].id);
  return res.status(200).json({ msg: "Verified Successfully" });
}

module.exports = { signupController, resendOTP, verifyUser };
