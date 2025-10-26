const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  // A username is valid if it's a non-empty string and not already taken
  if (!username || typeof username !== 'string') return false;
  const existing = users.filter((user) => user.username === username);
  return existing.length === 0;
}

const authenticatedUser = (username,password)=>{ //returns boolean
  // Check if username and password match a registered user
  return users.some((user) => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }

  if (!authenticatedUser(username, password)) {
    return res.status(401).json({message: "Invalid username or password"});
  }

  // Create JWT token and store in session
  const accessToken = jwt.sign({username: username}, 'access', {expiresIn: 60*60});
  req.session.authorization = {accessToken: accessToken, username: username};
  return res.status(200).json({message: "User successfully logged in", token: accessToken});
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;

  if (!req.session || !req.session.authorization || !req.session.authorization.username) {
    return res.status(401).json({message: "User not logged in"});
  }

  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({message: "Book not found"});
  }

  if (!review) {
    return res.status(400).json({message: "Review text is required as a query parameter 'review'"});
  }

  // Add or modify the review for this user
  books[isbn].reviews = books[isbn].reviews || {};
  books[isbn].reviews[username] = review;

  return res.status(200).json({message: "Review added/updated", reviews: books[isbn].reviews});
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;

  if (!req.session || !req.session.authorization || !req.session.authorization.username) {
    return res.status(401).json({message: "User not logged in"});
  }

  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({message: "Book not found"});
  }

  if (!books[isbn].reviews || !books[isbn].reviews[username]) {
    return res.status(404).json({message: "Review by this user not found"});
  }

  delete books[isbn].reviews[username];

  return res.status(200).json({message: "Review deleted", reviews: books[isbn].reviews});
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
