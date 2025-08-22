const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dxl2id77j",
  api_key: "235255144767138",
  api_secret: "1d7bkLNTqcCjbWlebhce2kOncis",
});

// Export as "cloud"
module.exports = cloudinary;
