import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import levenshtein from 'fast-levenshtein';

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Get the current directory
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Define file paths
const booksPath = path.join(__dirname, "books.json");

const books = {
  "groups": [
    {
      "name": "Winnie the Pooh",
      "location": "Clock Tower",
      "books": [
        "Winnie-The-Pooh",
        "Winnie-The-Pooh",
        "The Little Things in Life: Simple Reflections from the Hundred-Acre Wood",
        "The World of Christopher Robin",
        "Pooh and the Millennium",
        "The Pooh Dictionary: The Complete Guide to the Words of Pooh & All the Animals in the Forest",
        "When We Were Very Young"
      ]
    },
    {
      "name": "Brothers Grimm",
      "location": "Clock Tower",
      "books": [
        "The Complete Brothers Grimm Fairy Tales",
        "The Brothers Grimm 101 Fairy Tales",
        "Grimm’s Fairy Tales",
        "Snow White or The House In The Wood",
        "The Sleeping Beauty",
        "Snow White"
      ]
    },
    {
      "name": "Hans Christian Andersen",
      "location": "Wooden Crates",
      "books": [
        "The Snow Queen",
        "The Complete Fairy Tales & Stories",
        "Hans Christian Andersen Tales"
      ]
    },
    {
      "name": "Children's Classics",
      "location": "Book Cart",
      "books": [
        "Anne of Green Gables",
        "The Little Prince",
        "Pippi Longstocking",
        "The Secret Garden (Word Cloud Classics)", 
        "Mary Poppins in the Park",
        "The Secret Garden"
      ]
    },
    {
      "name": "Alice in Wonderland",
      "location": "Book Cart",
      "books": [
        "Alice’s Adventures in Wonderland and Through the Looking-Glass",
        "Alice's Adventures in Wonderland",
        "The Annotated Alice",
        "Alice's Adventures Underground",
        "Alice's Adventures in Wonderland (Yayoi Kusama)"
      ]
    },
    {
      "name": "Disney Favorites",
      "location": "Wooden Crates",
      "books": [
        "Walt Disney’s Story Land 55 Favorite Stories",
        "Donald Duck Sees South America",
        "Walt Disney’s Peter Pan",
        "Mickey See The U.S.A.",
        "Everything I Need to Know I Learned From a Disney Little Golden Book",
        "Disney Storybook Collection"
      ]
    },
    {
      "name": "Adventure Stories",
      "location": "Wooden Crates",
      "books": [
        "The Adventures of Robin Hood",
        "The Two Jungle Books",
        "Peter Pan",
        "Peter Pan (English Library)",
        "The Story of King Arthur and His Knights",
        "Heidi",
        "Pinocchio"
      ]
    },
    {
      "name": "Animal Tales",
      "location": "Wooden Crates",
      "books": [
        "Tales From Beatrix Potter",
        "The Wind in the Willows",
        "White Tail: King of the Forest",
        "The Boy, The Mole, The Fox and The Horse"
      ]
    },
    {
      "name": "French Fairy Tales",
      "location": "Wooden Crates",
      "books": [
        "Hansel at Gretel",
        "Jacques et le Haricot Magique",
        "Le Trois Petits Cochons",
        "Boucle d’Or et Les Trois Ours",
        "Le Petit Chaperon Rouge"
      ]
    },
    {
      "name": "Nursery Rhymes",
      "location": "Book Cart",
      "books": [
        "Book of Nursery and Mother Goose Rhymes",
        "Nursery Friends From France",
        "The Annotated Mother Goose",
        "Aesop’s Fables",
        "The Land of Little Rain",
        "The Orchard Book of Nursery Rhymes"
      ]
    }
  ]
}
app.get('/', (req, res) => {
  // Create an empty array to store group names
  const groupNames = [];

  // Loop through each group in books.groups
  for (const group of books.groups) {
    // Extract group name and push it to groupNames
    groupNames.push(group.name);
  }

  // Send the list of group names as JSON response
  res.json(groupNames);
});

// Route handler to get book titles for a similar group name
app.get('/books/:groupName', (req, res) => {
  const { groupName } = req.params;
  // Find the group with the exact same name
  const matchingGroup = books.groups.find(group => group.name === groupName);

  // If a matching group is found, return its book titles
  if (matchingGroup) {
    const bookTitles = matchingGroup.books;
    res.json({ groupName: matchingGroup.name, bookTitles });
  } else {
    res.status(404).json({ error: 'Group not found' });
  }
});

// Function to read books data from books.json file
function readBooksData() {
    try {
        const booksContent = fs.readFileSync(booksPath, 'utf8');
        return JSON.parse(booksContent);
    } catch (error) {
        console.error('Error reading books data:', error);
        return [];
    }
}
app.get('/book-location/:title', (req, res) => {
  const { title } = req.params;

  if (!title) {
      return res.status(400).send('Bad request: Missing book title');
  }

  // Find the group containing the book with the given title
  const groupContainingBook = books.groups.find(group => group.books.includes(title));

  if (groupContainingBook) {
      return res.status(200).json({ location: groupContainingBook.location });
  } else {
      return res.status(404).send('Book not found.');
  }
});

// Function to find the closest match using Levenshtein distance
function findClosestMatch(searchTerm, booksData) {
    if (!booksData || !booksData.length) {
        return { closestMatch: null, minDistance: Infinity }; // No books data or empty array
    }

    let closestMatch = null;
    let minDistance = Infinity;

    booksData.forEach(book => {
        const distance = levenshtein.get(searchTerm.toLowerCase(), book.Title.toLowerCase());
        if (distance < minDistance) {
            minDistance = distance;
            closestMatch = book;
        }
    });

    return { closestMatch, minDistance };
}

// Endpoint to handle book search
app.get('/search', (req, res) => {
    const searchTerm = req.query.title;
    console.log(searchTerm)

    if (!searchTerm) {
        return res.status(400).send('Bad request: Missing search term');
    }

    // Read books data from books.json
    const booksData = readBooksData();
    // Find exact match
    const exactMatch = booksData.find(book => book.Title.toLowerCase() === searchTerm.toLowerCase());
    console.log(exactMatch)
    if (exactMatch) {
        return res.status(200).json(exactMatch);
    } else {
        // Find closest match
        const { closestMatch, minDistance } = findClosestMatch(searchTerm, booksData);

        if (closestMatch) {
            // If closest match found, display suggestion and book information
            return res.status(201).json(closestMatch);
        } else {
            return res.status(404).send('No books found.');
        }
    }
});

app.get('/book-location/:title', (req, res) => {
  const { title } = req.params;

  if (!title) {
      return res.status(400).send('Bad request: Missing book title');
  }

  // Find the group containing the book with the given title
  const groupContainingBook = books.groups.find(group => group.books.includes(title));

  if (groupContainingBook) {
      return res.status(200).json({ location: groupContainingBook.location });
  } else {
      return res.status(404).send('Book not found.');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
