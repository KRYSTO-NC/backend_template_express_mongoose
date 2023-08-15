const mongoose = require('mongoose')

const connectDB = async () => {
  mongoose.set('strictQuery', false)
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
    })
    console.log(
      ` ✔️ ✔️ ✔️ ✔️ ✔️  MongoDB connected with success !! connection host: ${conn.connection.host} ✔️ ✔️ ✔️ ✔️ ✔️`
        .white.underline.bold,
    )
  } catch (error) {
    console.log(
      ` ❌ ❌ ❌ Error ❌ ❌ ❌   =>  ${error.message}`.red.underline.bold
        .bgWhite,
    )
    process.exit(1)
  }
}

module.exports = connectDB
