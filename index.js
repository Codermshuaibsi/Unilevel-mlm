const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoute');
const mongoose = require('mongoose');
const investrouter = require('./routes/userRoute');
const uploadInvestmentProof = require('./routes/investmentRoutes')
const withdrawalRoutes = require('./routes/withdrawalRoutes')
dotenv.config();
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);
require('./utlis/ROI_Transfer');

mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("Mongo Error:", err));

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/investment', investrouter);
app.use('/api/upload', uploadInvestmentProof);
app.use('/api/withdrawal', withdrawalRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
