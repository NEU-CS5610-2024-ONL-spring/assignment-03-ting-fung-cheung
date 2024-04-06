const express = require("express");
const app = express();
const port = process.env.PORT || 8000;

// 在这里可以添加你的后端路由和中间件
const cors = require("cors");
app.use(cors());

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
