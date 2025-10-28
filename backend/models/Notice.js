import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
  title: String,
  message: String,
  date: String,
  userId: String,
});

export default mongoose.model("Notice", noticeSchema);
