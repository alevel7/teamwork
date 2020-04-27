
module.exports = (app,verifyToken, upload) => {
  app.use("/v1/auth",upload.single('image'), require("./auth"))
  app.use("/v1/articles",verifyToken,require("./articles"))
  app.use("/v1/gifs", verifyToken, upload.single('image'), require("./gifs"))
}