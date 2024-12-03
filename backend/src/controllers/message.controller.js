import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("Error in getUsersForSidebar", error.message);
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, reciverId: userToChatId },
        { senderId: userToChatId, reciverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("Error in getMessages", error.message);
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { id: reciverId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    let imageUrl;

    if (image) {
      // Upload image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.url;
    }

    const newMessage = new Message({
      text,
      reciverId,
      senderId,
      image: imageUrl,
    });

    await newMessage.save();

    const reciverSocketId = getReceiverSocketId(reciverId);
    if (reciverSocketId) {
      io.to(reciverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("Error in sendMessage", error.message);
  }
};
