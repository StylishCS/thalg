const jwt = require("jsonwebtoken");

async function auth(req, res, next) {
  try {
    const token = req.header("Authorization").split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ msg: "access denied, no provided token.." });
    }
    let verify=0;
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY,
      (err, decoded) => {
        if (err) {
          verify = err;
        }
        req.user = decoded;
      }
    );
    if(verify!=0){
      return res.status(400).json({msg: verify});
    }
    next();
  } catch (error) {
    return res.status(400).json({ msg: "invalid token.." });
  }
}

module.exports = auth;
