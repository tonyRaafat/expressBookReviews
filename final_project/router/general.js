const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');
const BASE_URL = "http://localhost:5000";


public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }

  // Check if user already exists
  const existingUser = users.find((user) => user.username === username);
  if (existingUser) {
    return res.status(409).json({message: "User already exists"});
  }

  users.push({username: username, password: password});
  return res.status(200).json({message: "User successfully registered"});
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  
  return res.status(200).json({data: books});
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).json(books[isbn]);
  } else {
    return res.status(404).json({message: "Book not found"});
  }
 });
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author;
  const keys = Object.keys(books);
  const results = [];

  keys.forEach((key) => {
    if (books[key].author === author) {
      // include isbn in returned object for clarity
      results.push(Object.assign({isbn: key}, books[key]));
    }
  });

  if (results.length > 0) return res.status(200).json({books: results});
  return res.status(404).json({message: "No books found for the given author"});
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title;
  const keys = Object.keys(books);
  const results = [];

  keys.forEach((key) => {
    if (books[key].title === title) {
      results.push(Object.assign({isbn: key}, books[key]));
    }
  });

  if (results.length > 0) return res.status(200).json({books: results});
  return res.status(404).json({message: "No books found for the given title"});
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).json({reviews: books[isbn].reviews});
  }
  return res.status(404).json({message: "Book not found"});
});

// ------- Promise / Axios based routes -------
public_users.get('/axios/books', async function (req, res) {
  try {
    const resp = await axios.get(`${BASE_URL}/`);
    if (resp.data && resp.data.data) {
      return res.status(200).json({data: JSON.parse(resp.data.data)});
    }
    return res.status(200).json(resp.data);
  } catch (err) {
    return res.status(500).json({message: "Error fetching books", error: err.message});
  }
}); 

// Get book by ISBN using axios
public_users.get('/axios/isbn/:isbn', async function (req, res) {
  const isbn = req.params.isbn;
  try {
    const resp = await axios.get(`${BASE_URL}/isbn/${isbn}`);
    return res.status(resp.status).json(resp.data);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    return res.status(500).json({message: "Error fetching book", error: err.message});
  }
});

public_users.get('/axios/author/:author', async function (req, res) {
  const author = req.params.author;
  try {
    const resp = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return res.status(resp.status).json(resp.data);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    return res.status(500).json({message: "Error fetching books by author", error: err.message});
  }
});

// Get books by title using axios
public_users.get('/axios/title/:title', async function (req, res) {
  const title = req.params.title;
  try {
    const resp = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
    return res.status(resp.status).json(resp.data);
  } catch (err) {
    if (err.response) return res.status(err.response.status).json(err.response.data);
    return res.status(500).json({message: "Error fetching books by title", error: err.message});
  }
});

module.exports.general = public_users;
